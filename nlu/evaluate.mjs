// Hold-out evaluation: accuracy, per-intent precision/recall/F1, top confusions.
// Run standalone: node nlu/evaluate.mjs (uses the saved model)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TEST } from "./data/test.mjs";
import { loadModel } from "./classifier.mjs";

export function evaluate(model, { verbose = true } = {}) {
  const stats = {};
  const confusions = [];
  let correct = 0;
  for (const [text, gold] of TEST) {
    const pred = model.predict(text)[0].intent;
    for (const c of [gold, pred]) stats[c] ??= { tp: 0, fp: 0, fn: 0 };
    if (pred === gold) { correct++; stats[gold].tp++; }
    else { stats[pred].fp++; stats[gold].fn++; confusions.push({ text, gold, pred }); }
  }
  const perIntent = {};
  let f1Sum = 0, n = 0;
  for (const [c, s] of Object.entries(stats)) {
    const p = s.tp / (s.tp + s.fp || 1), r = s.tp / (s.tp + s.fn || 1);
    const f1 = p + r ? (2 * p * r) / (p + r) : 0;
    perIntent[c] = { precision: +p.toFixed(3), recall: +r.toFixed(3), f1: +f1.toFixed(3) };
    f1Sum += f1; n++;
  }
  const res = { testSize: TEST.length, accuracy: correct / TEST.length, macroF1: f1Sum / n, perIntent, confusions };
  if (verbose) {
    console.log(`\nhold-out: ${correct}/${TEST.length} correct`);
    for (const c of confusions) console.log(`  ✗ "${c.text}"  gold=${c.gold}  pred=${c.pred}`);
  }
  return res;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const here = dirname(fileURLToPath(import.meta.url));
  const m = loadModel(JSON.parse(readFileSync(join(here, "model", "model.json"), "utf8")));
  const r = evaluate(m);
  console.log(`accuracy ${(r.accuracy * 100).toFixed(1)}%  macro-F1 ${(r.macroF1 * 100).toFixed(1)}%`);
}
