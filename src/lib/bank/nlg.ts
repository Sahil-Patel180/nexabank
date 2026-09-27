// ─────────────────────────────────────────────────────────────
// Nova NLG · Natural Language Generation
// Pipeline:  dialogue act + data  →  content selection  →
//            template choice (variation)  →  surface realisation
//            (₹ lakh/crore formatting, list joining, pluralisation,
//            relative dates, personalisation, confidence hedging)
// ─────────────────────────────────────────────────────────────

// ── surface realisation helpers ─────────────────────────────
export function inr(n: number, opts: { decimals?: boolean } = {}) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: opts.decimals ? 2 : 0, minimumFractionDigits: opts.decimals ? 2 : 0 }).format(n);
}
/** ₹28.7 lakh / ₹1.2 crore — how Indians say big numbers out loud */
export function inrWords(n: number) {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${+(n / 1e7).toFixed(2)} crore`;
  if (a >= 1e5) return `₹${+(n / 1e5).toFixed(2)} lakh`;
  return inr(n);
}
export function joinList(items: string[], conj = "and") {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + ` ${conj} ` + items.at(-1);
}
export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
export function relDay(iso: string) {
  const d = new Date(iso); const now = new Date();
  const days = Math.round((new Date(d.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / 864e5);
  if (days === 0) return "today"; if (days === 1) return "tomorrow"; if (days === -1) return "yesterday";
  if (days > 1 && days < 7) return `in ${days} days`;
  return fmtDate(iso);
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const mask = (acc: string) => "XX" + acc.slice(-4);
export function partOfDay() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

let seed = Date.now() % 9973;
/** pseudo-random template choice → responses don't feel canned */
export function pick<T>(arr: T[]): T { seed = (seed * 16807) % 2147483647; return arr[seed % arr.length]; }

/** Hedge phrasing when the classifier is unsure. */
export function hedge(confidence: number, text: string) {
  if (confidence >= 0.65) return text;
  return pick(["If I've understood you right — ", "I think you're asking about this — ", "Here's my best guess — "]) + text.charAt(0).toLowerCase() + text.slice(1);
}

// ── template bank, keyed by dialogue act ───────────────────
type Fn = (d: any) => string;
const T: Record<string, Fn[]> = {
  greet: [
    (d) => `Good ${partOfDay()}, ${d.name}! I'm Nova, your NexaBank assistant. How can I help today?`,
    (d) => `Hi ${d.name}, Nova here. Balance, transfers, cards, loans — just ask.`,
    (d) => `Hello ${d.name}! What can I do for you this ${partOfDay()}?`,
  ],
  goodbye: [(d) => `Take care, ${d.name}. Your session stays secure — I'll be here whenever you need me.`, () => `Goodbye! Remember: NexaBank will never ask for your OTP or PIN.`, (d) => `See you soon, ${d.name}. Have a great ${partOfDay()}!`],
  thanks: [() => `Anytime! Anything else I can help with?`, () => `Happy to help. Is there anything else?`, (d) => `You're welcome, ${d.name}!`],
  capabilities: [() => `I can check balances, show statements, analyse your spending, transfer money, pay bills, manage cards, calculate EMIs, check loan eligibility, find branches & ATMs, and connect you to a human. Try one of these:`],
  out_of_scope: [
    () => `That's outside what I can help with — I'm focused on your banking. Here's what I can do:`,
    () => `I'm not able to help with that one, but I'm great with money matters. Try:`,
  ],
  balance: [
    (d) => `Your ${d.type} account ${d.masked} has ${d.amount} available.`,
    (d) => `You have ${d.amount} in your ${d.type} account (${d.masked}).`,
    (d) => `Available balance in ${d.masked}: ${d.amount}.`,
  ],
  balance_all: [(d) => `Across your ${plural(d.count, "account")} you have ${d.total}. Here's the breakdown:`, (d) => `Here are your balances — ${d.total} in total.`],
  statement: [(d) => `Here are your ${d.label}.`, (d) => `Sure — your ${d.label}:`],
  statement_empty: [(d) => `I couldn't find any transactions ${d.period}.`],
  spending: [
    (d) => `You spent ${d.total} on ${d.what} ${d.period}${d.count ? ` across ${plural(d.count, "transaction")}` : ""}.${d.top ? ` Biggest: ${d.top}.` : ""}`,
    (d) => `${d.period.charAt(0).toUpperCase() + d.period.slice(1)}, ${d.what} cost you ${d.total}${d.count ? ` (${plural(d.count, "payment")})` : ""}.${d.top ? ` Most of it went to ${d.top}.` : ""}`,
  ],
  spending_overview: [
    (d) => `You spent ${d.total} ${d.period}. ${d.lead} was your top category at ${d.leadAmt} (${d.leadPct}%).`,
    (d) => `${d.period.charAt(0).toUpperCase() + d.period.slice(1)} your outflow was ${d.total} — led by ${d.lead} (${d.leadPct}%).`,
  ],
  ask_payee: [() => `Who would you like to send money to? Pick a saved beneficiary or type a name.`, () => `Sure — to whom?`],
  ask_amount: [(d) => `How much would you like to send to ${d.payee}?`, (d) => `Got it, ${d.payee}. What amount?`],
  unknown_payee: [(d) => `${d.name} isn't in your saved beneficiaries. For your security, new payees must be added (with a 30-min cooling period) before transfers. Your saved payees are: ${d.list}.`],
  confirm_transfer: [(d) => `Please confirm: send ${d.amount} to ${d.payee} (${d.bank} ${d.acc}) from your savings account via ${d.mode}.`, (d) => `Ready to send ${d.amount} to ${d.payee}. Shall I go ahead?`],
  ask_otp: [(d) => `For transfers above ${d.limit}, I need to verify it's you. Enter the 6-digit OTP sent to ${d.phone}.`],
  otp_wrong: [(d) => `That OTP doesn't match. ${plural(d.left, "attempt")} left.`],
  otp_locked: [() => `Too many incorrect OTP attempts — I've cancelled this transfer for your safety.`],
  transfer_done: [(d) => `Done! ${d.amount} sent to ${d.payee}. Reference ${d.ref}. Your new balance is ${d.balance}.`, (d) => `Transfer successful — ${d.amount} is on its way to ${d.payee} (ref ${d.ref}).`],
  insufficient: [(d) => `You don't have enough balance for that — available is ${d.balance}. Want to try a smaller amount?`],
  limit_exceeded: [(d) => `That would exceed your daily transfer limit of ${d.limit} (${d.left} left today).`],
  cancelled: [() => `Cancelled. Nothing was sent.`, () => `No problem — I've cancelled that.`],
  nothing_to_cancel: [() => `There's nothing in progress to cancel. What would you like to do?`],
  ask_bill: [() => `Which bill would you like to pay?`],
  confirm_bill: [(d) => `Your ${d.biller} bill is ${d.amount}. Pay it now from savings?`],
  bill_done: [(d) => `Paid! ${d.amount} to ${d.biller}. BBPS ref ${d.ref}.`],
  ask_card: [() => `Which card should I block — debit or credit?`],
  confirm_block: [(d) => `This will immediately block your ${d.card}. It can't be used until you request a replacement. Proceed?`],
  card_blocked: [(d) => `Your ${d.card} is now blocked. A replacement will reach your registered address in 5–7 working days. Ticket ${d.ticket}.`],
  already_blocked: [(d) => `Your ${d.card} is already blocked. Want me to raise a replacement request?`],
  cards: [(d) => `You have ${plural(d.count, "card")}. Credit card due: ${d.due} ${d.dueWhen}.`],
  emi: [(d) => `For ${d.principal} at ${d.rate}% over ${d.tenure}, your EMI would be ${d.emi}/month. Total interest: ${d.interest}.`, (d) => `EMI comes to ${d.emi} a month (${d.principal}, ${d.rate}% p.a., ${d.tenure}).`],
  ask_emi_amount: [() => `What loan amount should I calculate the EMI for?`],
  ask_emi_tenure: [(d) => `And for how long? (e.g. 5 years) — I'll use ${d.rate}% p.a. for a ${d.loan}.`],
  eligibility: [(d) => `Good news, ${d.name} — based on your income and credit score (${d.score}), you're pre-qualified for a ${d.loan} of up to ${d.max} at ${d.rate}% p.a.`],
  eligibility_low: [(d) => `Based on your existing obligations, your eligible ${d.loan} amount is around ${d.max}. Reducing current EMIs would raise it.`],
  loans: [(d) => `Your ${d.type} loan has ${d.outstanding} outstanding. Next EMI of ${d.emi} is due ${d.when}; ${plural(d.left, "EMI")} to go.`],
  no_loans: [() => `You don't have any active loans with us. Want to check your eligibility?`],
  rates: [(d) => `Here are our current ${d.what} rates.`],
  kyc: [(d) => `Your KYC is ${d.status}. To ${d.action}, keep these ready:`],
  open_account: [(d) => `Opening ${d.product} is fully digital and takes about ${d.time}. Here's how:`],
  branches: [(d) => `I found ${plural(d.count, d.kind, d.kind + (d.kind.endsWith("h") ? "es" : "s"))} in ${d.city}.`, (d) => `Here ${d.count === 1 ? "is" : "are"} ${plural(d.count, d.kind, d.kind + (d.kind.endsWith("h") ? "es" : "s"))} in ${d.city}:`],
  ask_city: [(d) => `Which city should I look in for ${d.kind}s?`],
  no_branch: [(d) => `We don't have a ${d.kind} in ${d.city} yet. We're in ${d.cities}.`],
  handoff: [(d) => `I've created ticket ${d.ticket} and a relationship manager will call you on ${d.phone} within ${d.eta}. You can also reach our 24×7 phone banking line.`],
  fraud: [(d) => `I'm sorry this happened, ${d.name}. Act fast: I've raised a priority dispute (${d.ticket}). I recommend blocking your cards now. Also report it on the national cybercrime helpline 1930 or cybercrime.gov.in within 24 hours.`],
  clarify: [(d) => `Did you mean ${d.a} or ${d.b}?`],
};

export function say(act: keyof typeof T | string, data: Record<string, unknown> = {}) {
  const fns = T[act];
  if (!fns) return act;
  return pick(fns)(data);
}

export const INTENT_LABEL: Record<string, string> = {
  check_balance: "your balance", mini_statement: "recent transactions", spending_analysis: "spending insights", transfer_money: "a transfer",
  pay_bill: "paying a bill", block_card: "blocking a card", card_info: "card details", loan_emi_calc: "an EMI calculation",
  loan_eligibility: "loan eligibility", loan_status: "your loans", interest_rates: "interest rates", find_branch: "branches", find_atm: "ATMs",
};
