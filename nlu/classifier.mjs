// ─────────────────────────────────────────────────────────────
// Nova NLU · intent classifier
//   Features : word uni+bigrams (stemmed) + char 3–5 grams → TF-IDF (sublinear, L2)
//   Model    : multinomial logistic regression (softmax), AdaGrad + L2
//   Storage  : int8-quantised weight matrix, base64-packed (~10× smaller)
// ─────────────────────────────────────────────────────────────
import { tokenize, stem } from "./text.mjs";

/** Raw feature strings for one utterance. */
export function extractFeatures(text) {
  const toks = tokenize(text);
  const feats = [];
  const stems = toks.map(stem);
  for (const s of stems) feats.push("w:" + s);
  for (let i = 0; i < stems.length - 1; i++) feats.push("b:" + stems[i] + "_" + stems[i + 1]);
  for (const t of toks) {
    if (t.startsWith("<")) continue;
    const p = " " + t + " ";
    for (let n = 3; n <= 5; n++)
      for (let i = 0; i + n <= p.length; i++) feats.push("c:" + p.slice(i, i + n));
  }
  if (toks.length <= 2) feats.push("len:short");
  return feats;
}

/** Map feature strings → sparse TF-IDF vector [[idx, val], ...] (L2-normalised). */
export function vectorize(text, vocab, idf) {
  const counts = new Map();
  for (const f of extractFeatures(text)) {
    const i = vocab[f];
    if (i === undefined) continue;
    counts.set(i, (counts.get(i) || 0) + 1);
  }
  const vec = [];
  let norm = 0;
  for (const [i, c] of counts) {
    const v = (1 + Math.log(c)) * idf[i];
    vec.push([i, v]);
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;
  for (const e of vec) e[1] /= norm;
  return vec;
}

function softmax(z) {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Train softmax regression.
 * @param {{text:string,intent:string}[]} data
 */
export function train(data, opts = {}) {
  const { epochs = 40, lr = 0.5, l2 = 1e-5, minDf = 2, seed = 42, log = () => {} } = opts;
  const classes = [...new Set(data.map((d) => d.intent))].sort();
  const cIdx = Object.fromEntries(classes.map((c, i) => [c, i]));

  // vocabulary + document frequency
  const df = new Map();
  for (const d of data) for (const f of new Set(extractFeatures(d.text))) df.set(f, (df.get(f) || 0) + 1);
  const vocab = {};
  const idf = [];
  const N = data.length;
  for (const [f, c] of df) {
    if (c < minDf) continue;
    vocab[f] = idf.length;
    idf.push(Math.log((1 + N) / (1 + c)) + 1);
  }
  const F = idf.length, K = classes.length;
  const X = data.map((d) => vectorize(d.text, vocab, idf));
  const Y = data.map((d) => cIdx[d.intent]);

  const W = new Float64Array(F * K);
  const G = new Float64Array(F * K).fill(1e-8); // AdaGrad accumulators
  const b = new Float64Array(K), gb = new Float64Array(K).fill(1e-8);
  const rand = mulberry32(seed);
  const order = [...X.keys()];

  for (let ep = 0; ep < epochs; ep++) {
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let loss = 0;
    for (const n of order) {
      const x = X[n], y = Y[n];
      const z = Array.from(b);
      for (const [i, v] of x) for (let k = 0; k < K; k++) z[k] += W[i * K + k] * v;
      const p = softmax(z);
      loss -= Math.log(p[y] + 1e-12);
      for (let k = 0; k < K; k++) {
        const g = p[k] - (k === y ? 1 : 0);
        gb[k] += g * g; b[k] -= (lr * g) / Math.sqrt(gb[k]);
        for (const [i, v] of x) {
          const idx = i * K + k;
          const gw = g * v + l2 * W[idx];
          G[idx] += gw * gw;
          W[idx] -= (lr * gw) / Math.sqrt(G[idx]);
        }
      }
    }
    if (ep % 10 === 0 || ep === epochs - 1) log(`  epoch ${String(ep + 1).padStart(2)}  loss ${(loss / N).toFixed(4)}`);
  }
  return quantize({ classes, vocab, idf, W, b, F, K });
}

/** int8 quantisation: w ≈ q * scale, q ∈ [-127,127]. Unused features pruned. */
function quantize({ classes, vocab, idf, W, b, F, K }) {
  let maxAbs = 0;
  for (const w of W) maxAbs = Math.max(maxAbs, Math.abs(w));
  const scale = maxAbs / 127;
  const keep = [];
  for (let i = 0; i < F; i++) {
    let m = 0;
    for (let k = 0; k < K; k++) m = Math.max(m, Math.abs(W[i * K + k]));
    if (m / scale >= 0.5) keep.push(i);
  }
  const remap = new Map(keep.map((old, nw) => [old, nw]));
  const newVocab = {};
  for (const [f, i] of Object.entries(vocab)) if (remap.has(i)) newVocab[f] = remap.get(i);
  const q = new Int8Array(keep.length * K);
  keep.forEach((old, nw) => { for (let k = 0; k < K; k++) q[nw * K + k] = Math.round(W[old * K + k] / scale); });
  return {
    version: 1,
    classes,
    vocab: newVocab,
    idf: keep.map((i) => +idf[i].toFixed(4)),
    bias: Array.from(b, (v) => +v.toFixed(5)),
    scale,
    weights: Buffer.from(q.buffer).toString("base64"),
  };
}

/** Load a serialised model into a fast predictor. Works in Node + Next.js server. */
export function loadModel(json) {
  const bin = typeof Buffer !== "undefined" ? Buffer.from(json.weights, "base64") : Uint8Array.from(atob(json.weights), (c) => c.charCodeAt(0));
  const q = new Int8Array(bin.buffer, bin.byteOffset, bin.byteLength);
  const K = json.classes.length;
  return {
    classes: json.classes,
    featureCount: json.idf.length,
    /** @returns {{intent:string, confidence:number}[]} ranked */
    predict(text) {
      const x = vectorize(text, json.vocab, json.idf);
      const z = json.bias.slice();
      for (const [i, v] of x) for (let k = 0; k < K; k++) z[k] += q[i * K + k] * json.scale * v;
      const p = softmax(z);
      return json.classes
        .map((intent, k) => ({ intent, confidence: p[k] }))
        .sort((a, b) => b.confidence - a.confidence);
    },
  };
}
