// ─────────────────────────────────────────────────────────────
// Nova NLU · text normalisation + tokenisation
// Shared by the trainer (Node) and the runtime (Next.js server).
// Zero dependencies on purpose: the whole pipeline is auditable.
// ─────────────────────────────────────────────────────────────

const CONTRACTIONS = [
  [/\bwhat's\b/g, "what is"], [/\bwhere's\b/g, "where is"], [/\bhow's\b/g, "how is"],
  [/\bi'm\b/g, "i am"], [/\bi've\b/g, "i have"], [/\bi'd\b/g, "i would"], [/\bi'll\b/g, "i will"],
  [/\bcan't\b/g, "can not"], [/\bcannot\b/g, "can not"], [/\bwon't\b/g, "will not"],
  [/\bdon't\b/g, "do not"], [/\bdoesn't\b/g, "does not"], [/\bdidn't\b/g, "did not"],
  [/\bisn't\b/g, "is not"], [/\bit's\b/g, "it is"], [/\bthat's\b/g, "that is"],
  [/\blet's\b/g, "let us"], [/\bwanna\b/g, "want to"], [/\bgonna\b/g, "going to"],
  [/\bpls\b|\bplz\b/g, "please"], [/\bu\b/g, "you"], [/\bur\b/g, "your"], [/\bacc\b|\ba\/c\b/g, "account"],
  [/\bbal\b/g, "balance"], [/\btxns?\b/g, "transaction"], [/\bstmt\b/g, "statement"],
];

/** Lower-case, expand contractions/slang, and mask numbers + currency. */
export function normalize(text) {
  let t = String(text || "").normalize("NFKC").toLowerCase();
  t = t.replace(/[’‘`]/g, "'");
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  t = t.replace(/₹/g, " rs ");
  t = t.replace(/\b(inr|rupees?|rs\.?)\b/g, " rs ");
  // numbers (incl. 1,50,000 / 2.5 / 5k / 2 lakh) → <num>
  t = t.replace(/\d[\d,]*(\.\d+)?\s*(k|l|cr|lakhs?|lacs?|crores?|thousand)?\b/g, " <num> ");
  t = t.replace(/[^a-z<>\s']/g, " ").replace(/'/g, "");
  return t.replace(/\s+/g, " ").trim();
}

/** Very light suffix stripper — enough to merge "transferring/transfers/transferred". */
export function stem(w) {
  if (w.length <= 4 || w.startsWith("<")) return w;
  if (w.endsWith("ies") && w.length > 5) return w.slice(0, -3) + "y";
  if (w.endsWith("ing") && w.length > 6) return w.slice(0, -3);
  if (w.endsWith("ed") && w.length > 5) return w.slice(0, -2);
  if (w.endsWith("es") && w.length > 5) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}
