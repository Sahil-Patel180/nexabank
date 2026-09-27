// Nova showreel deck — generator (pptxgenjs) + animation spec for post-processing.
// Run: NODE_PATH=<global node_modules> node deck/build_deck.js  → deck/build/raw.pptx + deck/build/anim.json
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const lu = require("react-icons/lu");

const OUT = path.join(__dirname, "build");
fs.mkdirSync(OUT, { recursive: true });
const metrics = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "nlu", "model", "metrics.json"), "utf8"));

// ── palette ──────────────────────────────────────────────
const C = {
  bg: "06222B", panel: "0A3140", panel2: "0C4555", teal: "16939A", teal7: "0F5D6C", mint: "7FCFCF", mintBg: "D7F0EE",
  gold: "F2A93B", gold2: "F6BF61", goldBg: "FDF0D6", white: "FFFFFF", text2: "CFE3E4", muted: "8FAEB3", ink: "10232A", green: "23915F", red: "C9403A",
};
const HEAD = "Arial", BODY = "Calibri";
const W = 13.333, H = 7.5;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "NexaBank · Nova — conversational banking showreel";

// ── assets ───────────────────────────────────────────────
async function icon(Comp, color = "#F2A93B", px = 256) {
  const svg = renderToStaticMarkup(React.createElement(Comp, { size: px, color, strokeWidth: 1.75 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
async function background() {
  let dots = "";
  for (let x = 0; x < 1920; x += 34) for (let y = 0; y < 1080; y += 34) dots += `<circle cx="${x + 10}" cy="${y + 10}" r="1.3" fill="#7FCFCF" fill-opacity="0.09"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <defs><radialGradient id="g1" cx="0.88" cy="0.05" r="0.7"><stop offset="0" stop-color="#16939A" stop-opacity="0.35"/><stop offset="1" stop-color="#06222B" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0.05" cy="1" r="0.55"><stop offset="0" stop-color="#F2A93B" stop-opacity="0.13"/><stop offset="1" stop-color="#06222B" stop-opacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="#06222B"/>${dots}<rect width="1920" height="1080" fill="url(#g1)"/><rect width="1920" height="1080" fill="url(#g2)"/></svg>`;
  const p = path.join(OUT, "bg.png");
  await sharp(Buffer.from(svg)).png().toFile(p);
  return p;
}

// ── animation spec (consumed by postprocess.py) ─────────
const ANIM = []; // per slide: { advMs, transDur, items: [{name, fx, delay, dur}] }
let S, SI = -1, auto = 0;
function newSlide(advMs = 6000, transDur = 1400) {
  S = pres.addSlide();
  S.background = { path: BG };
  SI++; auto = 0;
  ANIM.push({ advMs, transDur, items: [] });
  eyeOn = false;
  return S;
}
const nm = (base) => base || `obj_${SI}_${auto++}`;
function anim(name, fx, delay, dur = 600) { if (fx) ANIM[SI].items.push({ name, fx, delay: Math.round(delay * 1000), dur }); }

function text(t, o = {}, a = []) {
  const name = nm(o.name);
  S.addText(t, { isTextBox: true, fontFace: BODY, color: C.white, margin: 0, valign: "top", ...o, objectName: name, name: undefined });
  anim(name, ...a);
  return name;
}
function shape(type, o = {}, a = []) {
  const name = nm(o.name);
  S.addShape(type, { ...o, objectName: name, name: undefined });
  anim(name, ...a);
  return name;
}
function image(data, o, a = []) {
  const name = nm(o.name);
  S.addImage({ data, ...o, objectName: name, name: undefined });
  anim(name, ...a);
  return name;
}
// the peacock-eye motif — three named ovals that Morph glides between slides
let eyeOn = false;
function eye(cx, cy, w, opacity = 0) {
  const h = w * 1.17;
  shape(pres.shapes.OVAL, { name: "!!eyeOuter", x: cx - w / 2, y: cy - h / 2, w, h, fill: { color: C.teal7, transparency: opacity } });
  shape(pres.shapes.OVAL, { name: "!!eyeMid", x: cx - w * 0.3125, y: cy - h / 2 + h * 0.18, w: w * 0.625, h: h * 0.64, fill: { color: C.panel, transparency: opacity } });
  shape(pres.shapes.OVAL, { name: "!!eyeCore", x: cx - w * 0.15, y: cy - h / 2 + h * 0.43, w: w * 0.3, h: h * 0.31, fill: { color: C.gold, transparency: opacity } });
  eyeOn = true;
}
const title = (t, o = {}, a = ["float", 0.1]) => text(t, { name: "!!title", x: 0.7, y: 0.55, w: 10.5, h: 0.9, fontFace: HEAD, fontSize: 34, bold: true, ...o }, a);
const kicker = (t, a = ["fade", 0.35]) => text(t, { x: 0.7, y: 1.45, w: 10, h: 0.45, fontSize: 16, color: C.mint }, a);
function card(x, y, w, h, o = {}, a = []) { return shape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.18, fill: { color: C.panel }, line: { color: C.panel2, width: 1 }, ...o }, a); }
function arrow(x1, y1, x2, y2, a = [], color = C.mint) { return shape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width: 1.75, endArrowType: "triangle" } }, a); }
function chip(t, x, y, w, color = C.mint, a = [], o = {}) {
  const n = nm();
  S.addText(t, { isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.2, x, y, w, h: 0.42, fontFace: BODY, fontSize: 13, color, align: "center", valign: "middle", margin: 0, line: { color, width: 1 }, fill: { color: C.bg, transparency: 100 }, ...o, objectName: n });
  anim(n, ...a); return n;
}
function bubble(t, x, y, w, h, fromUser, a = [], fs = 15) {
  const n = nm();
  S.addText(t, { isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.2, x, y, w, h, fontFace: BODY, fontSize: fs, color: fromUser ? C.ink : C.white, fill: { color: fromUser ? C.white : C.teal7 }, margin: [6, 12, 6, 12], valign: "middle", objectName: n });
  anim(n, ...a); return n;
}
const notes = (t) => S.addNotes(t);

let BG;
(async () => {
  BG = await background();
  const I = {};
  for (const [k, comp, col] of [
    ["menu", lu.LuMenu], ["book", lu.LuBookOpen], ["headset", lu.LuHeadset], ["badge", lu.LuBadgeCheck], ["key", lu.LuKeyRound], ["user", lu.LuUserCheck],
    ["timer", lu.LuTimer], ["lock", lu.LuLockKeyhole], ["brain", lu.LuBrain], ["branch", lu.LuGitBranch], ["db", lu.LuDatabase], ["msg", lu.LuMessageCircle],
    ["monitor", lu.LuMonitor], ["sparkles", lu.LuSparkles], ["mic", lu.LuMic], ["click", lu.LuMousePointerClick], ["scan", lu.LuScanEye], ["lang", lu.LuLanguages],
    ["layers", lu.LuLayers], ["zap", lu.LuZap], ["phone", lu.LuSmartphone],
  ]) I[k] = await icon(comp, col);
  I.brainDark = await icon(lu.LuBrain, "#06222B");

  // ── 1 · Title ─────────────────────────────────────────
  newSlide(6500, 1200);
  eye(9.9, 3.75, 4.3);
  text("NexaBank · Nova", { name: "!!title", x: 0.7, y: 2.05, w: 7.6, h: 1.2, fontFace: HEAD, fontSize: 54, bold: true }, ["float", 0.2, 800]);
  text("Conversational banking with an in-house\nNLU, dialogue manager and NLG engine", { x: 0.7, y: 3.35, w: 7.4, h: 1.1, fontSize: 22, color: C.text2 }, ["fade", 0.75, 700]);
  text("ILP mini project  ·  Banking domain  ·  2026", { x: 0.7, y: 4.85, w: 7, h: 0.4, fontSize: 15, color: C.gold, bold: true }, ["fade", 1.2]);
  notes("Opening. Nova is a banking assistant for a fictional bank, NexaBank. Everything that understands and generates language was built from scratch in this project. Add your name to this slide before presenting.");

  // ── 2 · Problem ───────────────────────────────────────
  newSlide(7000);
  eye(12.35, 0.95, 0.85);
  title("Banking apps make you hunt");
  kicker("Simple tasks hide behind menus, jargon and call-centre queues.");
  [["menu", "Menus four taps deep", "Checking one EMI date means navigating Loans → Accounts → Schedule → Details."],
   ["book", "The bank's vocabulary", "IMPS, NEFT, IFSC, FOIR — customers have to learn the bank's words to get anything done."],
   ["headset", "Queues for easy questions", "“When is my EMI due?” shouldn't need a phone call and a wait."]].forEach(([ic, h, b], i) => {
    const x = 0.7 + i * 4.1, d = 0.55 + i * 0.3;
    card(x, 2.45, 3.75, 3.0, {}, ["float", d]);
    image(I[ic], { x: x + 0.35, y: 2.8, w: 0.55, h: 0.55 }, ["fade", d + 0.15]);
    text(h, { x: x + 0.35, y: 3.6, w: 3.1, h: 0.9, fontFace: HEAD, fontSize: 21, bold: true }, ["fade", d + 0.2]);
    text(b, { x: x + 0.35, y: 4.5, w: 3.1, h: 1.6, fontSize: 15, color: C.text2 }, ["fade", d + 0.25]);
  });
  notes("The problem: digital banking still maps the bank's structure onto the customer.");

  // ── 3 · Idea ──────────────────────────────────────────
  newSlide(7000);
  eye(2.2, 5.6, 1.9);
  text("Just ask.", { name: "!!title", x: 0.7, y: 0.9, w: 6, h: 1.6, fontFace: HEAD, fontSize: 80, bold: true }, ["float", 0.15, 800]);
  text("Nova understands everyday phrasing — amounts in lakh, nicknames like “mom”, dates like “last month” — and does the task with the same checks a teller would.", { x: 0.7, y: 2.6, w: 5.6, h: 1.6, fontSize: 18, color: C.text2 }, ["fade", 0.6]);
  [["send 2k to Rohan", 7.6, 1.2, 3.3], ["how much did I spend on Swiggy last month?", 6.9, 2.35, 5.7], ["EMI for 20 lakh over 15 years", 7.9, 3.5, 4.4], ["I lost my debit card", 7.2, 4.65, 3.4], ["ATM in Chennai", 8.6, 5.8, 2.7]]
    .forEach(([t, x, y, w], i) => bubble(t, x, y, w, 0.72, true, ["float", 0.7 + i * 0.35], 17));
  notes("The idea: let customers type the way they talk.");

  // ── 4a / 4b · Understanding one sentence (Morph) ──────
  const words = [["Transfer", 2.55], ["40k", 1.15], ["to", 0.7], ["mom", 1.35]];
  const sentence = (hl) => {
    let x = 1.25;
    card(0.9, 2.2, 7.2, 1.35, { name: "!!sentBox", fill: { color: C.white }, line: { color: C.white } });
    words.forEach(([wd, w], i) => {
      if (i === 1) shape(pres.shapes.ROUNDED_RECTANGLE, { name: "!!hlAmt", x: x - 0.08, y: 2.45, w: hl ? w + 0.16 : 0.05, h: 0.85, rectRadius: 0.1, fill: { color: C.goldBg, transparency: hl ? 0 : 100 }, line: { color: C.gold, width: hl ? 2 : 0.5, transparency: hl ? 0 : 100 } });
      if (i === 3) shape(pres.shapes.ROUNDED_RECTANGLE, { name: "!!hlPay", x: x - 0.08, y: 2.45, w: hl ? w + 0.16 : 0.05, h: 0.85, rectRadius: 0.1, fill: { color: C.mintBg, transparency: hl ? 0 : 100 }, line: { color: C.teal, width: hl ? 2 : 0.5, transparency: hl ? 0 : 100 } });
      text(wd, { name: "!!w" + i, x, y: 2.5, w, h: 0.75, fontFace: HEAD, fontSize: 40, bold: true, color: C.ink, align: "center", valign: "middle" });
      x += w + 0.22;
    });
  };
  newSlide(3800, 1200);
  eye(11.2, 3.9, 2.2);
  title("Understanding one sentence");
  kicker("Step 1 · normalise and tokenise");
  sentence(false);
  text("normalised →  transfer  <num>  to  mom", { name: "!!norm", x: 0.95, y: 3.85, w: 7.5, h: 0.5, fontFace: "Courier New", fontSize: 18, color: C.mint }, ["fade", 0.6]);
  shape(pres.shapes.ROUNDED_RECTANGLE, { name: "!!bar", x: 0.95, y: 5.75, w: 0.05, h: 0.22, rectRadius: 0.1, fill: { color: C.gold, transparency: 100 } });
  notes("Nova first cleans the text: lower-case, expands slang, masks numbers so '40k' and '5000' look alike to the classifier.");

  newSlide(7000, 1600);
  eye(11.2, 3.9, 2.2);
  title("Understanding one sentence", {}, []);
  text("Step 2 · classify intent and extract entities", { x: 0.7, y: 1.45, w: 10, h: 0.45, fontSize: 16, color: C.mint });
  sentence(true);
  text("normalised →  transfer  <num>  to  mom", { name: "!!norm", x: 0.95, y: 3.85, w: 7.5, h: 0.5, fontFace: "Courier New", fontSize: 18, color: C.muted });
  chip("amount = ₹40,000", 3.35, 4.45, 2.3, C.gold, ["zoom", 0.9]);
  chip("payee = Sunita Sharma  (alias “mom”)", 5.8, 4.45, 3.6, C.mint, ["zoom", 1.2]);
  text("intent", { x: 0.95, y: 5.3, w: 1.2, h: 0.35, fontSize: 14, color: C.muted });
  text("transfer_money", { x: 2.0, y: 5.25, w: 3, h: 0.4, fontFace: "Courier New", fontSize: 18, bold: true, color: C.gold }, ["fade", 1.5]);
  shape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.95, y: 5.75, w: 7.1, h: 0.22, rectRadius: 0.1, fill: { color: C.panel2 } });
  shape(pres.shapes.ROUNDED_RECTANGLE, { name: "!!bar", x: 0.95, y: 5.75, w: 7.09, h: 0.22, rectRadius: 0.1, fill: { color: C.gold } });
  text("99.99% confidence · 0.3 ms · runs on the server, no external API", { x: 0.95, y: 6.15, w: 7.5, h: 0.4, fontSize: 14, color: C.text2 }, ["fade", 1.8]);
  notes("Morph grows the entity highlights and the confidence bar. The classifier returns transfer_money; the extractor finds the amount and resolves 'mom' to a saved payee.");

  // ── 5 · Architecture ─────────────────────────────────
  newSlide(7500);
  eye(12.45, 6.7, 0.6);
  title("Four modules, one turn");
  kicker("Every stage is its own file you can read, test and replace.");
  const boxes = [["Chat UI", "React · voice in/out", "msg", "!!ui"], ["NLU", "intent + entities", "brain", "!!nlu"], ["Dialogue manager", "frames · slots · rules", "branch", "!!dm"], ["Core banking", "mock ledger + APIs", "db", "!!cbs"], ["NLG", "acts → text + cards", "sparkles", "!!nlg"]];
  boxes.forEach(([h, sub, ic, n], i) => {
    const x = 0.7 + i * 2.47, d = 0.45 + i * 0.28;
    card(x, 2.55, 2.05, 2.1, { name: n, fill: { color: i === 1 || i === 4 ? C.panel2 : C.panel } }, ["zoom", d]);
    image(I[ic], { x: x + 0.3, y: 2.85, w: 0.5, h: 0.5 }, ["fade", d + 0.1]);
    text(h, { x: x + 0.3, y: 3.4, w: 1.7, h: 0.8, fontFace: HEAD, fontSize: 17, bold: true, valign: "bottom" }, ["fade", d + 0.15]);
    text(sub, { x: x + 0.3, y: 4.22, w: 1.7, h: 0.35, fontSize: 12, color: C.text2 }, ["fade", d + 0.15]);
    if (i < 4) arrow(x + 2.1, 3.6, x + 2.42, 3.6, ["wipe", d + 0.25]);
  });
  // return path
  shape(pres.shapes.LINE, { x: 11.4, y: 4.75, w: 0, h: 0.55, line: { color: C.gold, width: 1.75 } }, ["wipe", 2.0]);
  shape(pres.shapes.LINE, { x: 1.7, y: 5.3, w: 9.7, h: 0, line: { color: C.gold, width: 1.75 } }, ["wipe", 2.1]);
  shape(pres.shapes.LINE, { x: 1.7, y: 4.75, w: 0, h: 0.55, line: { color: C.gold, width: 1.75, beginArrowType: "triangle" } }, ["wipe", 2.3]);
  text("reply text + rich card + explainability trace", { x: 3.6, y: 5.45, w: 6, h: 0.4, fontSize: 14, color: C.gold, align: "center" }, ["fade", 2.4]);
  text("Next.js 15 server (Node runtime) · JWT-guarded API · zero third-party AI calls", { x: 0.7, y: 6.45, w: 11, h: 0.4, fontSize: 14, color: C.muted }, ["fade", 2.6]);
  notes("Architecture. The browser sends a message; the server runs NLU, then the dialogue manager, which calls the mock core banking system, then NLG produces text and a rich card.");

  // ── 6 · NLU inside ───────────────────────────────────
  newSlide(7500, 1500);
  eye(12.45, 0.9, 0.7);
  title("NLU, built from scratch");
  card(0.7, 1.7, 7.3, 5.15, { name: "!!nlu", fill: { color: C.panel2 } });
  [["Normalise", "contractions, slang (“bal”, “txn”), ₹ / rs / inr, numbers → <num>"],
   ["Featurise", "stemmed word uni- + bigrams and character 3–5-grams (typo-proof)"],
   ["Weight", "TF-IDF with sublinear term frequency, L2-normalised"],
   ["Classify", "softmax regression, AdaGrad + L2, int8-quantised weights"],
   ["Extract", "regex + gazetteers + Levenshtein: amount, payee, date, city, tenure…"]].forEach(([h, b], i) => {
    const y = 2.0 + i * 0.95, d = 0.5 + i * 0.25;
    shape(pres.shapes.OVAL, { x: 1.05, y: y + 0.05, w: 0.48, h: 0.48, fill: { color: C.gold } }, ["zoom", d]);
    text(String(i + 1), { x: 1.05, y: y + 0.05, w: 0.48, h: 0.48, fontFace: HEAD, fontSize: 16, bold: true, color: C.bg, align: "center", valign: "middle" }, ["zoom", d]);
    text(h, { x: 1.75, y, w: 5.9, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true }, ["fade", d + 0.1]);
    text(b, { x: 1.75, y: y + 0.4, w: 6.0, h: 0.45, fontSize: 14, color: C.text2 }, ["fade", d + 0.15]);
  });
  [["25", "intents across 8 banking domains"], [metrics.trainSize.toLocaleString("en-IN"), "training utterances from a 364-template grammar"], [metrics.features.toLocaleString("en-IN"), "features, ≈330 KB model file"]].forEach(([v, l], i) => {
    const y = 1.75 + i * 1.75, d = 1.8 + i * 0.3;
    text(v, { x: 8.6, y, w: 4.2, h: 0.95, fontFace: HEAD, fontSize: 50, bold: true, color: i === 0 ? C.gold : C.white }, ["float", d]);
    text(l, { x: 8.6, y: y + 0.95, w: 4.2, h: 0.55, fontSize: 15, color: C.text2 }, ["fade", d + 0.1]);
  });
  notes("The NLU is about 300 lines of dependency-free JavaScript. Training takes about five seconds.");

  // ── 7 · Results ──────────────────────────────────────
  newSlide(8000);
  eye(12.45, 6.7, 0.6);
  title("Measured on phrases it never saw");
  const acc = (metrics.accuracy * 100).toFixed(1) + "%";
  text(acc, { x: 0.7, y: 1.75, w: 4.8, h: 1.5, fontFace: HEAD, fontSize: 88, bold: true, color: C.gold }, ["zoom", 0.4, 800]);
  text(`hold-out accuracy on ${metrics.testSize} hand-written test phrases (typos, Indian English, unseen wording) · macro-F1 ${(metrics.macroF1 * 100).toFixed(1)}%`, { x: 0.7, y: 3.3, w: 4.9, h: 1.1, fontSize: 16, color: C.text2 }, ["fade", 0.8]);
  text("Still misread", { x: 0.7, y: 4.75, w: 4.5, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: C.mint }, ["fade", 1.1]);
  text([{ text: "“when is my emi due” → card_info", options: { breakLine: true } }, { text: "“who is virat kohli” → bot_capabilities", options: { breakLine: true } }, { text: "“give me a mini statment” → out_of_scope" }], { x: 0.7, y: 5.2, w: 5, h: 1.3, fontFace: "Courier New", fontSize: 13, color: C.text2, paraSpaceAfter: 6 }, ["fade", 1.3]);
  const dom = { Accounts: ["check_balance", "mini_statement", "spending_analysis"], Payments: ["transfer_money", "pay_bill"], Cards: ["block_card", "card_info"], Loans: ["loan_emi_calc", "loan_eligibility", "loan_status"], Services: ["interest_rates", "kyc_documents", "open_account", "find_branch", "find_atm"], Support: ["human_agent", "report_fraud"], "Small talk": ["greet", "goodbye", "thanks", "affirm", "deny", "cancel", "bot_capabilities"], "Out of scope": ["out_of_scope"] };
  const labels = Object.keys(dom).reverse();
  const vals = labels.map((k) => +(dom[k].reduce((s, i) => s + metrics.perIntent[i].f1, 0) / dom[k].length * 100).toFixed(1));
  const chartName = nm();
  S.addChart(pres.charts.BAR, [{ name: "F1 %", labels, values: vals }], {
    objectName: chartName, x: 6.1, y: 1.65, w: 6.6, h: 5.2, barDir: "bar", chartColors: [C.teal],
    showTitle: true, title: "F1 score by banking domain (%)", titleColor: C.white, titleFontFace: BODY, titleFontSize: 15,
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: C.white, dataLabelFontSize: 12, dataLabelFormatCode: "0.0",
    catAxisLabelColor: C.text2, catAxisLabelFontSize: 13, catAxisLabelFontFace: BODY, valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 115,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineShow: false, showLegend: false, barGapWidthPct: 45,
  });
  anim(chartName, "wipe", 0.6, 900);
  notes("Honest evaluation: the test phrases are written separately from the training grammar. Cards is weakest because 'when is my … due' is ambiguous between credit card and EMI.");

  // ── 8 · Dialogue manager ─────────────────────────────
  newSlide(8500, 1500);
  eye(12.45, 0.9, 0.7);
  title("Remembering what's missing");
  kicker("Frame-based dialogue: fill slots across turns, then apply bank rules.");
  const st = [["Payee?", C.panel], ["Amount?", C.panel], ["Rules ✓", C.panel], ["Confirm", C.panel2], ["OTP > ₹25k", C.panel2], ["Done", C.green]];
  st.forEach(([t, col], i) => {
    const x = 0.7 + i * 2.05, d = 0.4 + i * 0.22;
    const n = card(x, 2.25, 1.7, 0.8, { name: i === 0 ? "!!dm" : undefined, fill: { color: col }, line: { color: i === 4 ? C.gold : C.panel2, width: 1 } }, ["zoom", d]);
    text(t, { x, y: 2.25, w: 1.7, h: 0.8, fontFace: HEAD, fontSize: 16, bold: true, align: "center", valign: "middle" }, ["zoom", d]);
    if (i < 5) arrow(x + 1.72, 2.65, x + 2.03, 2.65, ["wipe", d + 0.15]);
  });
  text("cancel · deny · 3 wrong OTPs · digression → nothing is sent", { x: 0.7, y: 3.2, w: 8, h: 0.4, fontSize: 14, color: C.muted }, ["fade", 1.8]);
  [["send money to rohan", true], ["Got it, Rohan. What amount?", false], ["3000", true], ["Ready to send ₹3,000 to Rohan Mehta. Shall I go ahead?", false]].forEach(([t, u], i) => {
    const d = 2.0 + i * 0.45, w = u ? Math.max(1.3, t.length * 0.12 + 0.5) : 5.2;
    bubble(t, u ? 6.2 - w : 0.7, 3.95 + i * 0.72, w, 0.58, u, ["float", d], 14);
  });
  card(7.0, 3.95, 5.65, 2.85, {}, ["fade", 2.2]);
  text("Policies", { x: 7.3, y: 4.15, w: 5, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: C.gold }, ["fade", 2.3]);
  text([["Slot filling", "a bare “3000” fills the awaited amount"], ["Context carry-over", "“what about this month?” reuses the last intent"], ["Business rules", "saved payee, balance, ₹2 L daily limit"], ["Explainability", "every turn returns a decision trace"]].flatMap(([b, r], i, arr) => [
    { text: b + " — ", options: { bold: true, color: C.white } }, { text: r, options: { color: C.text2, breakLine: i < arr.length - 1 } }]), { x: 7.3, y: 4.6, w: 5.1, h: 2.1, fontSize: 14, paraSpaceAfter: 7 }, ["fade", 2.5]);
  notes("The dialogue manager keeps a frame per task and asks only for what's missing. High-value transfers need an OTP.");

  // ── 9 · NLG ──────────────────────────────────────────
  newSlide(8000, 1500);
  eye(8.45, 0.95, 0.7);
  title("Turning results into words");
  kicker("dialogue act → template choice → surface realisation");
  card(0.7, 2.3, 3.6, 2.6, { name: "!!nlg", fill: { color: C.panel2 } }, []);
  text("Dialogue act", { x: 1.0, y: 2.5, w: 3, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: C.gold }, ["fade", 0.4]);
  text("transfer_done {\n  amount: 40000,\n  payee: \"Sunita Sharma\",\n  ref: \"NXB504201173\",\n  balance: 322528 }", { x: 1.0, y: 2.95, w: 3.2, h: 1.9, fontFace: "Courier New", fontSize: 13, color: C.text2 }, ["fade", 0.5]);
  arrow(4.4, 3.6, 4.85, 3.6, ["wipe", 0.8]);
  card(4.95, 2.3, 3.6, 2.6, {}, ["zoom", 0.9]);
  text("Template (1 of 2)", { x: 5.25, y: 2.5, w: 3, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: C.gold }, ["fade", 1.0]);
  text("Done! {amount} sent to {payee}. Reference {ref}. Your new balance is {balance}.", { x: 5.25, y: 2.95, w: 3.1, h: 1.8, fontFace: "Courier New", fontSize: 13, color: C.text2 }, ["fade", 1.1]);
  arrow(8.65, 3.6, 9.1, 3.6, ["wipe", 1.3]);
  bubble("Done! ₹40,000 sent to Sunita Sharma. Reference NXB504201173. Your new balance is ₹3,22,528.", 9.2, 2.45, 3.45, 2.3, false, ["float", 1.45], 16);
  ["₹3,22,528 · en-IN digits", "₹28.7 lakh · spoken scale", "“in 6 days” · relative dates", "hedges below 65% confidence", "16 rich card types", "text-to-speech"].forEach((t, i) => chip(t, 0.7 + (i % 3) * 4.0, 5.35 + Math.floor(i / 3) * 0.6, 3.7, i % 2 ? C.mint : C.gold, ["fade", 1.8 + i * 0.12]));
  notes("NLG: 47 dialogue acts, most with multiple phrasings, and Indian number formatting.");

  // ── 10 · Security ────────────────────────────────────
  newSlide(7500);
  eye(2.3, 4.6, 2.6);
  title("Friendly to talk to.\nStrict about money.", { h: 1.6, w: 5.5, fontSize: 36 });
  text("Nova never acts on a guess. The dialogue manager enforces what a teller would.", { x: 0.7, y: 2.35, w: 4.6, h: 1.0, fontSize: 16, color: C.text2 }, ["fade", 0.4]);
  [["badge", "Confirm before every payment", "a summary of exactly what will happen"], ["key", "OTP above ₹25,000", "three wrong tries cancel the transfer"], ["user", "Saved payees only", "closes a common social-engineering route"], ["timer", "Limits and short sessions", "₹2 lakh a day · 30-minute sessions"], ["lock", "Hardened sign-in", "scrypt hashes · httpOnly JWT · 5-try lock-out"]].forEach(([ic, h, b], i) => {
    const y = 1.0 + i * 1.18, d = 0.6 + i * 0.25;
    shape(pres.shapes.OVAL, { x: 6.0, y, w: 0.8, h: 0.8, fill: { color: C.panel2 } }, ["zoom", d]);
    image(I[ic], { x: 6.18, y: y + 0.18, w: 0.44, h: 0.44 }, ["zoom", d]);
    text(h, { x: 7.05, y: y + 0.02, w: 5.6, h: 0.42, fontFace: HEAD, fontSize: 18, bold: true }, ["fade", d + 0.1]);
    text(b, { x: 7.05, y: y + 0.42, w: 5.6, h: 0.4, fontSize: 14, color: C.text2 }, ["fade", d + 0.15]);
  });
  notes("Security is part of the dialogue design, not an afterthought.");

  // ── 11 · Product (stylised UI) ───────────────────────
  newSlide(8000, 1500);
  eye(12.45, 0.9, 0.7);
  title("The product");
  kicker("Dashboard · chat with rich cards · “Under the hood” inspector");
  card(0.7, 2.1, 3.3, 4.85, { fill: { color: C.panel2 } }, ["float", 0.4]);
  text("Total balance", { x: 0.95, y: 2.3, w: 2.8, h: 0.3, fontSize: 12, color: C.muted }, ["fade", 0.5]);
  text("₹3,65,528", { x: 0.95, y: 2.6, w: 2.9, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true }, ["fade", 0.55]);
  ["Send money", "Pay a bill", "Spending", "Cards", "Loans", "Find ATM"].forEach((t, i) => chip(t, 0.95 + (i % 2) * 1.45, 3.45 + Math.floor(i / 2) * 0.55, 1.35, C.text2, ["fade", 0.65 + i * 0.05], { fontSize: 11, h: 0.4 }));
  text("Spent this month", { x: 0.95, y: 5.25, w: 2.8, h: 0.3, fontSize: 12, color: C.muted }, ["fade", 0.9]);
  [[2.6, C.teal], [1.9, C.gold], [1.3, C.mint], [0.8, C.teal7]].forEach(([w, col], i) => shape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.95, y: 5.65 + i * 0.3, w, h: 0.14, rectRadius: 0.07, fill: { color: col } }, ["wipe", 1.0 + i * 0.1]));
  card(4.2, 2.1, 5.1, 4.85, { fill: { color: C.white }, line: { color: C.white } }, ["float", 0.55]);
  const b1 = nm(); S.addText("transfer 40k to mom", { isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.15, x: 6.6, y: 2.4, w: 2.45, h: 0.5, fontSize: 13, fontFace: BODY, color: C.white, fill: { color: C.panel2 }, margin: [4, 10, 4, 10], valign: "middle", objectName: b1 }); anim(b1, "float", 1.0);
  const b2 = nm(); S.addText("Ready to send ₹40,000 to Sunita Sharma. Shall I go ahead?", { isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.15, x: 4.45, y: 3.1, w: 3.9, h: 0.75, fontSize: 13, fontFace: BODY, color: C.ink, fill: { color: "EEF3F3" }, margin: [4, 10, 4, 10], valign: "middle", objectName: b2 }); anim(b2, "float", 1.3);
  shape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.45, y: 4.0, w: 3.9, h: 1.7, rectRadius: 0.12, fill: { color: C.white }, line: { color: "DBE4E5", width: 1 } }, ["zoom", 1.6]);
  text("To Sunita Sharma · SBI XXXX0452", { x: 4.65, y: 4.1, w: 3.5, h: 0.35, fontSize: 11, color: "56686F" }, ["fade", 1.7]);
  text("₹40,000", { x: 4.65, y: 4.4, w: 3.5, h: 0.6, fontFace: HEAD, fontSize: 26, bold: true, color: C.ink }, ["fade", 1.7]);
  const b3 = nm(); S.addText("Send ₹40,000", { isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, x: 4.65, y: 5.1, w: 2.2, h: 0.42, fontSize: 12, bold: true, fontFace: BODY, color: C.white, fill: { color: C.panel2 }, align: "center", valign: "middle", margin: 0, objectName: b3 }); anim(b3, "zoom", 1.85);
  ["Balance", "Spending this month", "Show my cards"].forEach((t, i) => chip(t, 4.45 + i * 1.5, 6.25, 1.4, "56686F", ["fade", 2.0 + i * 0.08], { fontSize: 10, h: 0.36, line: { color: "DBE4E5", width: 1 } }));
  card(9.5, 2.1, 3.15, 4.85, { fill: { color: C.panel } }, ["float", 0.7]);
  text("Under the hood", { x: 9.75, y: 2.3, w: 2.8, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true }, ["fade", 0.8]);
  [["transfer_money", 2.55, C.gold], ["pay_bill", 0.12, C.panel2], ["mini_statement", 0.06, C.panel2]].forEach(([t, w, col], i) => {
    text(t, { x: 9.75, y: 2.85 + i * 0.6, w: 2.6, h: 0.28, fontFace: "Courier New", fontSize: 11, color: i ? C.muted : C.white }, ["fade", 1.2 + i * 0.1]);
    shape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.75, y: 3.15 + i * 0.6, w, h: 0.1, rectRadius: 0.05, fill: { color: col } }, ["wipe", 1.3 + i * 0.1]);
  });
  text("amount = 40000\npayee = Sunita Sharma\n→ awaiting confirmation\n→ OTP required", { x: 9.75, y: 4.75, w: 2.8, h: 1.8, fontFace: "Courier New", fontSize: 11, color: C.mint }, ["fade", 1.8]);
  notes("The dashboard: accounts on the left, chat in the middle, and the explainability panel on the right that shows intent scores, entities and the dialogue trace for every turn.");

  // ── 12 · Web experience ──────────────────────────────
  newSlide(7500);
  eye(9.2, 0.95, 0.7);
  title("A website that shows its work");
  [["scan", "Live parse hero", "The landing page types a request, highlights its entities, fills an intent bar and writes Nova's reply."],
   ["layers", "Scroll-told architecture", "One request travels Understand → Decide → Act → Respond as you scroll."],
   ["click", "Crafted sign-in", "3D tilt card, inline errors, lock-out, and a smooth hand-off to the dashboard."],
   ["mic", "Voice in, voice out", "Speak to Nova in Indian English; replies can be read aloud."]].forEach(([ic, h, b], i) => {
    const x = 0.7 + (i % 2) * 6.1, y = 1.9 + Math.floor(i / 2) * 2.3, d = 0.4 + i * 0.25;
    card(x, y, 5.85, 1.95, {}, ["float", d]);
    image(I[ic], { x: x + 0.35, y: y + 0.35, w: 0.55, h: 0.55 }, ["zoom", d + 0.1]);
    text(h, { x: x + 1.15, y: y + 0.35, w: 4.4, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true }, ["fade", d + 0.15]);
    text(b, { x: x + 1.15, y: y + 0.9, w: 4.4, h: 1.2, fontSize: 15, color: C.text2 }, ["fade", d + 0.2]);
  });
  notes("Next.js 15, React 19, Tailwind v4 and Framer Motion. Motion is used to explain, not decorate, and respects reduced-motion settings.");

  // ── 13 · Stack & learnings ───────────────────────────
  newSlide(7500);
  eye(12.45, 0.9, 0.7);
  title("Stack and what I learned");
  text("Stack", { x: 0.7, y: 1.7, w: 5, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: C.gold }, ["fade", 0.3]);
  ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS v4", "Framer Motion", "jose (JWT)", "Node crypto", "Web Speech API", "Vanilla JS NLU", "Mermaid docs"].forEach((t, i) => chip(t, 0.7 + (i % 2) * 2.7, 2.25 + Math.floor(i / 2) * 0.62, 2.5, i % 3 ? C.mint : C.gold, ["zoom", 0.4 + i * 0.07]));
  card(6.2, 1.7, 6.45, 4.2, {}, ["float", 0.9]);
  text("Learnings", { x: 6.55, y: 1.95, w: 5.8, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: C.gold }, ["fade", 1.0]);
  text([
    { text: "Evaluation needs data the model never saw. ", options: { bold: true, color: C.white } }, { text: "Template-generated test sets hit 100% and prove nothing.", options: { color: C.text2, breakLine: true } },
    { text: "Dialogue design is where safety lives. ", options: { bold: true, color: C.white } }, { text: "Confirmation, OTP and payee rules matter more than a better classifier.", options: { color: C.text2, breakLine: true } },
    { text: "Character n-grams are a cheap typo fix. ", options: { bold: true, color: C.white } }, { text: "“trasnfer”, “balnce” and “swigy” still land.", options: { color: C.text2, breakLine: true } },
    { text: "Explainability builds trust. ", options: { bold: true, color: C.white } }, { text: "Showing the intent scores and trace made debugging and demos easier.", options: { color: C.text2 } },
  ], { x: 6.55, y: 2.5, w: 5.8, h: 3.6, fontSize: 16, paraSpaceAfter: 12 }, ["fade", 1.2]);
  notes("Key takeaways from building it.");

  // ── 14 · Roadmap ─────────────────────────────────────
  newSlide(7500);
  eye(12.45, 6.7, 0.6);
  title("Where it goes next");
  kicker("Same interfaces, production-grade parts behind them.");
  shape(pres.shapes.LINE, { x: 1.0, y: 2.95, w: 11.3, h: 0, line: { color: C.panel2, width: 3 } }, ["wipe", 0.3, 1200]);
  [["Persistent data", "PostgreSQL ledger, Redis sessions, horizontal scaling"], ["Transformer NLU", "Fine-tuned DistilBERT / IndicBERT behind the same parse() API"], ["Indian languages", "Hindi and Tamil with transliteration-aware features"], ["Real OTP + devices", "SMS gateway, device binding, active learning from logs"]].forEach(([h, b], i) => {
    const x = 1.0 + i * 3.0, d = 0.6 + i * 0.35;
    shape(pres.shapes.OVAL, { x: x - 0.02, y: 2.7, w: 0.5, h: 0.5, fill: { color: i === 0 ? C.gold : C.teal } }, ["zoom", d]);
    text(String(i + 1), { x: x - 0.02, y: 2.7, w: 0.5, h: 0.5, fontFace: HEAD, fontSize: 15, bold: true, color: C.bg, align: "center", valign: "middle" }, ["zoom", d]);
    text(h, { x, y: 3.55, w: 2.7, h: 0.45, fontFace: HEAD, fontSize: 18, bold: true }, ["fade", d + 0.1]);
    text(b, { x, y: 4.05, w: 2.65, h: 1.5, fontSize: 15, color: C.text2 }, ["fade", d + 0.15]);
  });
  notes("Roadmap. The NLU interface is stable, so a transformer model can replace the linear model without touching the dialogue manager.");

  // ── 15 · Close ───────────────────────────────────────
  newSlide(0, 1600);
  eye(W / 2, 3.1, 3.1);
  text("Just ask Nova.", { name: "!!title", x: 1.5, y: 5.05, w: W - 3, h: 1.0, fontFace: HEAD, fontSize: 48, bold: true, align: "center" }, ["float", 0.5, 800]);
  text("npm install  ·  npm run dev  ·  sign in with aarav@nexabank.demo", { x: 1.5, y: 6.1, w: W - 3, h: 0.45, fontSize: 16, color: C.mint, align: "center" }, ["fade", 1.0]);
  text("Thank you", { x: 1.5, y: 6.6, w: W - 3, h: 0.4, fontSize: 15, color: C.gold, align: "center", bold: true }, ["fade", 1.3]);
  notes("Close. Offer a live demo.");

  await pres.writeFile({ fileName: path.join(OUT, "raw.pptx") });
  fs.writeFileSync(path.join(OUT, "anim.json"), JSON.stringify(ANIM, null, 1));
  console.log("slides:", ANIM.length);
})();
