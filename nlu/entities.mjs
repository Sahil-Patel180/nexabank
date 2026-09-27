// ─────────────────────────────────────────────────────────────
// Nova NLU · entity extraction
// Rule + gazetteer extractor with fuzzy (Levenshtein) matching.
// Output: [{ entity, value, raw, start, end }]
// ─────────────────────────────────────────────────────────────

export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

const MULT = { k: 1e3, thousand: 1e3, l: 1e5, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7 };

export const GAZETTEER = {
  account_type: { savings: ["savings", "saving", "sb"], current: ["current"], salary: ["salary"] },
  card_type: { debit: ["debit", "atm card", "debit card"], credit: ["credit", "credit card", "cc"] },
  loan_type: { home: ["home", "housing"], car: ["car", "auto", "vehicle"], personal: ["personal"], education: ["education", "student"], two_wheeler: ["two wheeler", "bike"] },
  bill_type: {
    electricity: ["electricity", "electric", "power", "eb", "bescom", "tneb"], mobile: ["mobile", "phone", "postpaid", "prepaid", "recharge"],
    broadband: ["broadband", "wifi", "internet", "fibre", "fiber"], dth: ["dth", "tata play", "dish"], gas: ["gas", "lpg", "piped gas"], water: ["water"],
  },
  category: {
    food: ["food", "swiggy", "zomato", "dining", "restaurant", "restaurants", "eating out", "dining out"], groceries: ["grocery", "groceries", "bigbasket", "blinkit", "zepto", "dmart"],
    shopping: ["shopping", "amazon", "flipkart", "myntra", "ajio"], travel: ["travel", "uber", "ola", "flights", "irctc", "makemytrip", "cab", "cabs"],
    fuel: ["fuel", "petrol", "diesel"], entertainment: ["entertainment", "movies", "movie", "netflix", "bookmyshow", "spotify"], bills: ["bills", "utilities", "utility"],
  },
  product: { fd: ["fd", "fixed deposit", "fixed deposits"], rd: ["rd", "recurring deposit"], savings: ["savings account", "savings interest", "savings"], home_loan: ["home loan"], personal_loan: ["personal loan"], car_loan: ["car loan"] },
  city: {
    Mumbai: ["mumbai", "bombay", "andheri", "bandra"], Delhi: ["delhi", "new delhi", "connaught place", "gurgaon", "noida"], Bengaluru: ["bengaluru", "bangalore", "koramangala", "indiranagar"],
    Chennai: ["chennai", "madras", "t nagar", "adyar"], Hyderabad: ["hyderabad", "hitech city", "secunderabad"], Pune: ["pune", "hinjewadi"], Kolkata: ["kolkata", "calcutta", "salt lake"],
  },
};

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function push(out, entity, value, raw, start) {
  if (out.some((e) => start < e.end && start + raw.length > e.start && e.entity === entity)) return;
  out.push({ entity, value, raw, start, end: start + raw.length });
}

/**
 * @param {string} text
 * @param {{ payees?: string[] }} ctx  known beneficiaries for fuzzy payee matching
 */
export function extractEntities(text, ctx = {}) {
  const out = [];
  const t = String(text).toLowerCase().replace(/[’']/g, "'");

  // ── amount: ₹5,000 · rs 750 · 15k · 1.5 lakh · 20000 rupees
  const amtRe = /(?:(₹|rs\.?|inr)\s*)?(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|l|crores?|cr)?\b\s*(rupees?|rs|inr)?/g;
  for (const m of t.matchAll(amtRe)) {
    const [raw, cur, num, mult, cur2] = m;
    const after = t.slice(m.index + raw.length).trimStart();
    // skip tenures, counts and dates ("5 years", "last 10 transactions", "3 days")
    if (!cur && !cur2 && !mult && /^(years?|yrs?|months?|days?|weeks?|transactions?|txns?|emis?|%|percent|am|pm|st|nd|rd|th)\b/.test(after)) continue;
    let v = parseFloat(num.replace(/,/g, ""));
    if (mult) v *= MULT[mult] ?? MULT[mult.replace(/s$/, "")] ?? 1;
    if (!cur && !cur2 && !mult && v < 10) continue; // "top 5" etc.
    push(out, "amount", Math.round(v), raw.trim(), m.index);
  }

  // ── tenure: 5 years · 36 months
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b/g)) {
    const months = /^m/.test(m[2]) ? parseFloat(m[1]) : parseFloat(m[1]) * 12;
    push(out, "tenure_months", Math.round(months), m[0], m.index);
  }

  // ── count: last 10 transactions
  const cm = t.match(/\b(?:last|recent|latest|top)\s+(\d{1,2})\b/);
  if (cm) push(out, "count", parseInt(cm[1], 10), cm[0], cm.index);

  // ── date range (resolved later against "now")
  const dr = [
    [/\btoday\b/, "today"], [/\byesterday\b/, "yesterday"], [/\b(this|current) week\b/, "this_week"], [/\blast week\b|\bpast week\b|\bprevious week\b/, "last_week"],
    [/\b(this|current) month\b/, "this_month"], [/\blast month\b|\bprevious month\b|\bpast month\b/, "last_month"],
    [/\b(this|current) year\b/, "this_year"], [/\blast year\b/, "last_year"],
  ];
  for (const [re, v] of dr) { const m = t.match(re); if (m) push(out, "date_range", v, m[0], m.index); }
  const nd = t.match(/\b(?:last|past)\s+(\d+)\s+(days?|months?|weeks?)\b/);
  if (nd) push(out, "date_range", `last_${nd[1]}_${nd[2].replace(/s$/, "")}`, nd[0], nd.index);
  for (const [i, mo] of MONTHS.entries()) {
    const re = new RegExp(`\\b(${mo}|${mo.slice(0, 3)})\\b`);
    const m = t.match(re);
    if (m && !(mo === "may" && /\bmay (i|we|you)\b/.test(t))) push(out, "date_range", `month_${i}`, m[0], m.index);
  }

  // ── gazetteers (exact phrase, then fuzzy single-token)
  const tokens = [...t.matchAll(/[a-z]+/g)].map((m) => ({ w: m[0], i: m.index }));
  for (const [entity, values] of Object.entries(GAZETTEER)) {
    for (const [value, syns] of Object.entries(values)) {
      let hit = false;
      for (const s of syns) {
        const m = t.match(new RegExp(`\\b${s}\\b`));
        if (m) { push(out, entity, value, m[0], m.index); hit = true; break; }
      }
      if (hit || entity === "product") continue;
      for (const s of syns) {
        if (s.length < 6 || s.includes(" ")) continue;
        const tok = tokens.find(({ w }) => Math.abs(w.length - s.length) <= 1 && levenshtein(w, s) === 1);
        if (tok) { push(out, entity, value, tok.w, tok.i); break; }
      }
    }
  }
  // "bills" category vs bill_type: keep product only if explicit loan/deposit words
  // ── payee: gazetteer of saved beneficiaries (fuzzy), else "to <Name>"
  // payees: string[] or { name, aliases[] }[]
  const payees = (ctx.payees || []).map((p) => (typeof p === "string" ? { name: p, aliases: [] } : p));
  let payee = null;
  for (const p of payees) {
    const pl = p.name.toLowerCase();
    const names = [pl, ...p.aliases.map((a) => a.toLowerCase()), pl.split(" ")[0]];
    const m = t.match(new RegExp(`\\b(${names.join("|")})\\b`));
    if (m) { payee = { value: p.name, raw: m[0], i: m.index }; break; }
  }
  if (!payee) {
    for (const { name: p } of payees) {
      const first = p.toLowerCase().split(" ")[0];
      const tok = tokens.find(({ w }) => w.length >= 4 && Math.abs(w.length - first.length) <= 1 && levenshtein(w, first) <= 1);
      if (tok) { payee = { value: p, raw: tok.w, i: tok.i }; break; }
    }
  }
  if (!payee && !out.some((e) => e.entity === "bill_type" || e.entity === "card_type" || e.entity === "loan_type")) {
    const m = String(text).match(/\b(?:to|pay)\s+(?!my\b|the\b|a\b|an\b|me\b)([A-Za-z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const stop = /^(send|transfer|pay|check|see|know|open|talk|speak|block|find|get|show|make|bill|bills|electricity|mobile|the|someone|agent|human)$/i;
    if (m && !stop.test(m[1].split(" ")[0])) {
      const name = m[1].replace(/\b\w/g, (c) => c.toUpperCase());
      payee = { value: name, raw: m[1], i: m.index + m[0].indexOf(m[1]), unknown: true };
    }
  }
  if (payee) out.push({ entity: "payee", value: payee.value, raw: payee.raw, start: payee.i, end: payee.i + payee.raw.length, ...(payee.unknown ? { known: false } : { known: true }) });

  if (/\bnear me\b|\bnearby\b|\bclosest\b|\bnearest\b|\baround here\b/.test(t)) push(out, "location", "near_me", "near me", t.search(/near|clos|around/));

  return out.sort((a, b) => a.start - b.start);
}

/**
 * Convenience: first value per entity type.
 * @param {{ entity: string, value: any }[]} ents
 * @returns {Record<string, any>}
 */
export function entityMap(ents) {
  /** @type {Record<string, any>} */
  const m = {};
  for (const e of ents) if (!(e.entity in m)) m[e.entity] = e.value;
  return m;
}
