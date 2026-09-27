// ─────────────────────────────────────────────────────────────
// Nova Dialogue Manager
// Frame-based (slot-filling) policy with:
//   • per-session dialogue state (active intent, slots, awaiting)
//   • context carry-over for follow-ups ("what about last week?")
//   • confirmation + step-up OTP for high-value transfers
//   • digression handling and safe cancellation
//   • business rules: balance, daily limit, known-payee check
// Output = dialogue acts rendered by the NLG layer.
// ─────────────────────────────────────────────────────────────
import modelJson from "@nlu/model/model.json";
import { createNLU } from "@nlu/index.mjs";
import { entityMap } from "@nlu/entities.mjs";
import type { BotMessage, ChatResponse, NluResult, RichCard } from "../types";
import {
  BILLERS, BRANCHES, DAILY_LIMIT, OTP_THRESHOLD, RATES, executeTransfer, payBill, type Category, type Payee, type Txn, type User,
} from "./data";
import { INTENT_LABEL, fmtDate, hedge, inr, inrWords, joinList, mask, pick, plural, relDay, say } from "./nlg";

const nlu = createNLU(modelJson as never);

interface Frame { intent: string; slots: Record<string, any>; awaiting?: string; otp?: string; otpTries?: number }
interface Session { frame?: Frame; last?: { intent: string; ents: Record<string, any> }; turns: number }
const g = globalThis as unknown as { __novaSessions?: Map<string, Session> };
const sessions = (g.__novaSessions ??= new Map());

const CARRY = new Set(["spending_analysis", "mini_statement", "find_branch", "find_atm", "interest_rates", "loan_emi_calc", "check_balance"]);
const HOME = ["What's my balance?", "Spending on food last month", "Send ₹2,000 to Rohan", "Block my debit card"];

// ── helpers ─────────────────────────────────────────────────
function resolveRange(v?: string): { from: Date; to: Date; label: string } {
  const now = new Date(), s = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = s(now);
  switch (true) {
    case v === "today": return { from: today, to: now, label: "today" };
    case v === "yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: y, to: today, label: "yesterday" }; }
    case v === "this_week": { const f = new Date(today); f.setDate(f.getDate() - ((f.getDay() + 6) % 7)); return { from: f, to: now, label: "this week" }; }
    case v === "last_week": { const t = new Date(today); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); const f = new Date(t); f.setDate(f.getDate() - 7); return { from: f, to: t, label: "last week" }; }
    case v === "last_month": return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1), label: "last month" };
    case v === "this_year": return { from: new Date(now.getFullYear(), 0, 1), to: now, label: "this year" };
    case !!v && v.startsWith("month_"): {
      const m = Number(v!.split("_")[1]); const y = m > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 1), label: "in " + new Date(y, m, 1).toLocaleString("en-IN", { month: "long" }) };
    }
    case !!v && v.startsWith("last_"): {
      const [, n, unit] = v!.split("_"); const f = new Date(today);
      if (unit === "day") f.setDate(f.getDate() - +n); else if (unit === "week") f.setDate(f.getDate() - 7 * +n); else f.setMonth(f.getMonth() - +n);
      return { from: f, to: now, label: `in the last ${n} ${unit}s` };
    }
    default: return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now, label: "this month" };
  }
}
const inRange = (t: Txn, r: { from: Date; to: Date }) => { const d = new Date(t.date); return d >= r.from && d < r.to; };
const ticket = (p: string) => p + Math.floor(100000 + Math.random() * 900000);
const fakePhone = "+91 98XXXXX210";
function emiOf(P: number, annual: number, n: number) { const r = annual / 1200; return r === 0 ? P / n : (P * r * (1 + r) ** n) / ((1 + r) ** n - 1); }
const CAT_LABEL: Record<string, string> = { food: "food & dining", groceries: "groceries", shopping: "shopping", travel: "travel", fuel: "fuel", entertainment: "entertainment", bills: "bills & utilities", transfer: "transfers", emi: "EMIs", cash: "cash withdrawals" };

// ── main entry ──────────────────────────────────────────────
export function handleMessage(user: User, sessionId: string, text: string): ChatResponse {
  const key = user.id + ":" + sessionId;
  const S: Session = sessions.get(key) ?? { turns: 0 };
  sessions.set(key, S);
  S.turns++;

  const parsed = nlu.parse(text, { payees: user.payees }) as NluResult;
  const ents = entityMap(parsed.entities) as Record<string, any>;
  const trace: string[] = [`NLU → ${parsed.intent} (${(parsed.confidence * 100).toFixed(1)}%)${parsed.fallback ? " [below threshold → fallback]" : ""}`];
  if (parsed.entities.length) trace.push("Entities → " + parsed.entities.map((e) => `${e.entity}=${e.value}`).join(", "));

  const out: BotMessage[] = [];
  let suggestions: string[] = [];
  const reply = (t: string, card?: RichCard) => out.push(card ? { text: t, card } : { text: t });
  let intent = parsed.intent;
  let carried = false;

  // 1 ── an OTP is awaited: a 6-digit number is always treated as the OTP
  if (S.frame?.awaiting === "otp") {
    const code = text.replace(/\D/g, "");
    if (/^\d{6}$/.test(code)) {
      trace.push("Policy → OTP verification");
      const f = S.frame;
      if (code === f.otp) { finishTransfer(); }
      else {
        f.otpTries = (f.otpTries ?? 0) + 1;
        if (f.otpTries >= 3) { S.frame = undefined; reply(say("otp_locked")); trace.push("OTP locked → frame dropped"); }
        else { reply(say("otp_wrong", { left: 3 - f.otpTries })); suggestions = ["Cancel"]; }
      }
      return done();
    }
  }

  // 2 ── inside an active frame: interpret affirm / deny / cancel / slot answers
  if (S.frame) {
    const f = S.frame;
    if (intent === "cancel" || (intent === "deny" && f.awaiting === "confirm")) {
      S.frame = undefined; trace.push("Policy → cancel active frame"); reply(say("cancelled")); suggestions = HOME; return done();
    }
    if (intent === "affirm" && f.awaiting === "confirm") { trace.push("Policy → user confirmed"); return confirmFrame(); }
    // slot answer? fill whatever the frame can use
    const filled = fillSlots(f, ents);
    const weak = parsed.confidence < 0.8 || ["affirm", "deny", "out_of_scope", f.intent].includes(intent);
    if (filled.length && weak) { trace.push("Slot-filling → " + filled.join(", ")); intent = f.intent; }
    else if (f.awaiting && weak && f.awaiting !== "confirm") {
      // free-text answer for a name slot ("Rohan")
      if (f.awaiting === "payee") { f.slots.payeeRaw = text.trim(); intent = f.intent; trace.push("Slot-filling → payee (raw)"); }
      else {
        const reask: Record<string, string> = { amount: "What amount should I use?", card: "Which card — debit or credit?", bill: "Which bill should I pay?", tenure: "For how many years?" };
        reply((intent === "out_of_scope" && !parsed.fallback ? "That's outside what I can help with. " : "Sorry, I didn't catch that. ") + (reask[f.awaiting] ?? "Could you rephrase?"));
        suggestions = ["Cancel"]; return done();
      }
    } else if (intent !== f.intent) {
      trace.push(`Digression → dropping '${f.intent}' frame`);
      reply(`Okay, I've stopped ${INTENT_LABEL[f.intent] ?? "that"}${f.intent === "transfer_money" || f.intent === "pay_bill" ? " — nothing was sent" : ""}.`);
      S.frame = undefined;
    }
  } else {
    if (intent === "cancel") { reply(say("nothing_to_cancel")); suggestions = HOME; return done(); }
    // 3 ── context carry-over: elliptical follow-up that only brings entities
    const onlyEntities = parsed.entities.length > 0 && (parsed.confidence < 0.75 || parsed.fallback);
    if (onlyEntities && S.last && CARRY.has(S.last.intent)) {
      trace.push(`Context carry-over → reusing '${S.last.intent}'`);
      intent = S.last.intent; carried = true;
      Object.assign(ents, { ...S.last.ents, ...ents });
    } else if (/^(rs )?<num>$/.test(parsed.normalized)) {
      // bare amount with no context → ask what to do with it
      trace.push("Policy → bare amount, clarify goal");
      reply(`What would you like to do with ${inr(Number(ents.amount ?? 0))}?`);
      suggestions = [`Send ${inr(Number(ents.amount ?? 0))} to Rohan`, "Pay a bill", `EMI for ${inr(Number(ents.amount ?? 0))}`];
      return done();
    }
  }

  route();
  return done();

  // ── intent router ───────────────────────────────────────
  function route() {
    const conf = carried ? 1 : parsed.confidence;
    const main = user.accounts[0];
    switch (intent) {
      case "greet": reply(say("greet", { name: user.firstName })); suggestions = HOME; break;
      case "goodbye": reply(say("goodbye", { name: user.firstName })); break;
      case "thanks": reply(say("thanks", { name: user.firstName })); suggestions = ["Show recent transactions", "Branch near me"]; break;
      case "affirm": case "deny": reply("Sure. What would you like to do next?"); suggestions = HOME; break;
      case "bot_capabilities": reply(say("capabilities")); suggestions = ["Check balance", "Analyse my spending", "EMI for 10 lakh for 5 years", "Talk to an agent"]; break;
      case "out_of_scope": reply(say("out_of_scope")); suggestions = HOME; break;

      case "check_balance": {
        const want = ents.account_type as string | undefined;
        const accs = want ? user.accounts.filter((a) => a.type === want) : user.accounts;
        const card: RichCard = { kind: "balance", accounts: accs.map((a) => ({ type: a.type, masked: mask(a.number), balance: a.balance, ifsc: a.ifsc })) };
        if (accs.length === 1) reply(hedge(conf, say("balance", { type: accs[0].type, masked: mask(accs[0].number), amount: inr(accs[0].balance) })), card);
        else reply(hedge(conf, say("balance_all", { count: accs.length, total: inr(accs.reduce((s, a) => s + a.balance, 0)) })), card);
        suggestions = ["Show last 5 transactions", "Spending this month", "Send money"];
        break;
      }

      case "mini_statement": {
        const n = Math.min(Number(ents.count ?? 5), 15);
        let txns = main.txns.slice().reverse();
        let label = `last ${n} transactions`;
        if (ents.date_range) { const r = resolveRange(ents.date_range); txns = txns.filter((t) => inRange(t, r)); label = `transactions ${r.label}`; }
        if (ents.category) { txns = txns.filter((t) => t.category === ents.category); label = `${CAT_LABEL[ents.category] ?? ents.category} ` + label; }
        if (!txns.length) { reply(say("statement_empty", { period: ents.date_range ? resolveRange(ents.date_range).label : "" })); break; }
        const shown = txns.slice(0, ents.date_range ? 15 : n);
        reply(hedge(conf, say("statement", { label: `${label}${txns.length > shown.length ? ` (showing ${shown.length} of ${txns.length})` : ""}` })),
          { kind: "statement", title: `Savings ${mask(main.number)}`, txns: shown.map(({ id, date, description, amount, category, mode }) => ({ id, date, description, amount, category, mode })) });
        suggestions = ["What about last week?", "Spending breakdown", "Download statement"];
        break;
      }

      case "spending_analysis": {
        const r = resolveRange(ents.date_range ?? "this_month");
        const debits = main.txns.filter((t) => t.amount < 0 && inRange(t, r) && !["transfer", "emi"].includes(t.category));
        const by = new Map<string, number>();
        for (const t of debits) by.set(t.category, (by.get(t.category) ?? 0) - t.amount);
        const total = [...by.values()].reduce((a, b) => a + b, 0);
        const breakdown = [...by.entries()].sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount, pct: Math.round((amount / (total || 1)) * 100) }));
        const merchantOf = (list: Txn[]) => { const m = new Map<string, number>(); for (const t of list) if (t.merchant) m.set(t.merchant, (m.get(t.merchant) ?? 0) - t.amount); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount })); };
        if (ents.category) {
          const cat = ents.category as Category;
          const merchantAsked = parsed.entities.find((e) => e.entity === "category")?.raw;
          let list = debits.filter((t) => t.category === cat);
          const isMerchant = merchantAsked && list.some((t) => t.merchant?.toLowerCase().startsWith(merchantAsked.toLowerCase().slice(0, 4)));
          if (isMerchant) list = list.filter((t) => t.merchant?.toLowerCase().startsWith(merchantAsked!.toLowerCase().slice(0, 4)));
          const sum = list.reduce((s, t) => s - t.amount, 0);
          const top = merchantOf(list)[0];
          const what = isMerchant ? list[0]?.merchant ?? merchantAsked : CAT_LABEL[cat] ?? cat;
          reply(hedge(conf, say("spending", { total: inr(sum), what, period: r.label, count: list.length, top: !isMerchant && top ? `${top.name} (${inr(top.amount)})` : "" })),
            { kind: "spending", period: r.label, total, breakdown, merchants: merchantOf(list).slice(0, 4) });
        } else if (breakdown.length) {
          reply(hedge(conf, say("spending_overview", { total: inr(total), period: r.label, lead: CAT_LABEL[breakdown[0].category], leadAmt: inr(breakdown[0].amount), leadPct: breakdown[0].pct })),
            { kind: "spending", period: r.label, total, breakdown, merchants: merchantOf(debits).slice(0, 4) });
        } else reply(`No spending recorded ${r.label}.`);
        suggestions = ["Compare with last month", "Food spending this month", "Show recent transactions"];
        break;
      }

      case "transfer_money": {
        const f: Frame = S.frame?.intent === "transfer_money" ? S.frame : { intent, slots: {} };
        S.frame = f; fillSlots(f, ents);
        advanceTransfer(f);
        break;
      }

      case "pay_bill": {
        const f: Frame = S.frame?.intent === "pay_bill" ? S.frame : { intent, slots: {} };
        S.frame = f; fillSlots(f, ents);
        if (!f.slots.bill) { f.awaiting = "bill"; reply(say("ask_bill")); suggestions = ["Electricity", "Mobile", "Broadband", "DTH"]; break; }
        const b = BILLERS[f.slots.bill];
        f.slots.amount ??= b.due;
        f.awaiting = "confirm";
        const due = new Date(); due.setDate(due.getDate() + 6);
        reply(say("confirm_bill", { biller: b.name, amount: inr(f.slots.amount) }), { kind: "bill_confirm", biller: b.name, amount: f.slots.amount, dueDate: due.toISOString() });
        suggestions = ["Yes, pay now", "Cancel"];
        break;
      }

      case "block_card": {
        const f: Frame = S.frame?.intent === "block_card" ? S.frame : { intent, slots: {} };
        S.frame = f; fillSlots(f, ents);
        if (!f.slots.card) { f.awaiting = "card"; reply(say("ask_card")); suggestions = ["Debit card", "Credit card"]; break; }
        const c = user.cards.find((x) => x.type === f.slots.card)!;
        const label = `${c.network} ${c.type} card •••• ${c.last4}`;
        if (c.status === "blocked") { S.frame = undefined; reply(say("already_blocked", { card: label })); suggestions = ["Talk to an agent"]; break; }
        f.awaiting = "confirm";
        reply(say("confirm_block", { card: label }), { kind: "alert", tone: "danger", title: "Block card", body: `${label} will be blocked instantly for all channels (POS, ATM, online, contactless).` });
        suggestions = ["Yes, block it", "Cancel"];
        break;
      }

      case "card_info": {
        const cc = user.cards.find((c) => c.type === "credit");
        reply(hedge(conf, say("cards", { count: user.cards.length, due: inr(cc?.outstanding ?? 0), dueWhen: cc?.dueDate ? relDay(cc.dueDate) : "" })),
          { kind: "cards", cards: user.cards.map(({ type, network, last4, status, limit, outstanding, dueDate, minDue }) => ({ type, network, last4, status, limit, outstanding, dueDate, minDue })) });
        suggestions = ["Pay credit card bill", "Block my credit card"];
        break;
      }

      case "loan_emi_calc": {
        const isNew = S.frame?.intent !== "loan_emi_calc";
        const f: Frame = isNew ? { intent, slots: {} } : S.frame!;
        S.frame = f;
        fillSlots(f, isNew && S.last?.intent === "loan_emi_calc" ? { ...S.last.ents, ...ents } : ents);
        const lt = (f.slots.loan ?? "home") as keyof typeof RATES.loans;
        const rate = RATES.loans[lt] ?? RATES.loans.home;
        if (!f.slots.amount) { f.awaiting = "amount"; reply(say("ask_emi_amount")); suggestions = ["₹10 lakh", "₹25 lakh", "₹50 lakh"]; break; }
        if (!f.slots.tenure) { f.awaiting = "tenure"; reply(say("ask_emi_tenure", { rate, loan: `${lt.replace("_", " ")} loan` })); suggestions = ["5 years", "10 years", "20 years"]; break; }
        const P = f.slots.amount, n = f.slots.tenure, emi = emiOf(P, rate, n);
        S.frame = undefined;
        S.last = { intent: "loan_emi_calc", ents: { amount: P, tenure_months: n, loan_type: lt } };
        reply(say("emi", { principal: inrWords(P), rate, tenure: n % 12 ? plural(n, "month") : plural(n / 12, "year"), emi: inr(Math.round(emi)), interest: inrWords(Math.round(emi * n - P)) }),
          { kind: "emi", principal: P, rate, months: n, emi: Math.round(emi), interest: Math.round(emi * n - P), total: Math.round(emi * n), loanType: lt });
        suggestions = ["What about 15 years?", "Am I eligible?", "Home loan rates"];
        return;
      }

      case "loan_eligibility": {
        const lt = (ents.loan_type ?? "home") as keyof typeof RATES.loans;
        const rate = RATES.loans[lt];
        const years = lt === "home" ? 20 : lt === "car" ? 7 : 5;
        const existing = user.loans.reduce((s, l) => s + l.emi, 0);
        const maxEmi = Math.max(0, user.monthlyIncome * 0.5 - existing) * (user.creditScore >= 750 ? 1 : 0.85);
        const r = rate / 1200, n = years * 12;
        const maxLoan = Math.floor((maxEmi * ((1 + r) ** n - 1)) / (r * (1 + r) ** n) / 10000) * 10000;
        reply(say(maxLoan > 500000 ? "eligibility" : "eligibility_low", { name: user.firstName, loan: `${lt.replace("_", " ")} loan`, max: inrWords(maxLoan), rate, score: user.creditScore }),
          { kind: "eligibility", loanType: lt, maxLoan, rate, maxEmi: Math.round(maxEmi), tenureYears: years, score: user.creditScore });
        suggestions = [`EMI for ${inrWords(Math.round(maxLoan / 2e5) * 1e5).replace("₹", "")} for ${years} years`, "Documents required", "Talk to an agent"];
        break;
      }

      case "loan_status": {
        if (!user.loans.length) { reply(say("no_loans")); suggestions = ["Check home loan eligibility"]; break; }
        const l = user.loans[0];
        reply(hedge(conf, say("loans", { type: l.type, outstanding: inrWords(l.outstanding), emi: inr(l.emi), when: relDay(l.nextEmiDate), left: l.emisLeft })),
          { kind: "loans", loans: user.loans.map(({ type, outstanding, principal, emi, emisLeft, nextEmiDate, rate }) => ({ type, outstanding, principal, emi, emisLeft, nextEmiDate, rate })) });
        suggestions = ["Prepayment options", "Home loan rates"];
        break;
      }

      case "interest_rates": {
        const p = ents.product ?? (ents.loan_type ? ents.loan_type + "_loan" : "fd");
        if (p === "fd" || p === "rd") {
          reply(say("rates", { what: "fixed deposit" }), { kind: "rates", title: "Fixed Deposit rates (% p.a.)", headers: ["Tenure", "General", "Senior citizen"], rows: RATES.fd.map((r) => [r.tenor, r.general.toFixed(2), r.senior.toFixed(2)]), note: `Recurring deposit: ${RATES.rd}% p.a. · Illustrative demo rates.` });
        } else if (p === "savings") {
          reply(say("rates", { what: "savings account" }), { kind: "rates", title: "Savings account interest", headers: ["Balance slab", "Rate % p.a."], rows: RATES.savings.map((r) => [r.slab, r.rate.toFixed(2)]), note: "Interest credited quarterly · Illustrative demo rates." });
        } else {
          reply(say("rates", { what: "loan" }), { kind: "rates", title: "Loan rates (starting, % p.a.)", headers: ["Loan", "Rate"], rows: Object.entries(RATES.loans).map(([k, v]) => [k.replace("_", " ") + " loan", v.toFixed(2)]), note: "Final rate depends on credit profile · Illustrative demo rates." });
        }
        suggestions = ["Open an FD", "EMI calculator", "Loan rates"];
        break;
      }

      case "kyc_documents":
        reply(say("kyc", { status: user.kycStatus === "complete" ? "up to date" : "due for periodic update", action: user.kycStatus === "complete" ? "update details" : "complete re-KYC" }),
          { kind: "checklist", title: "Officially Valid Documents (any one for ID/address)", items: ["Aadhaar (masked copy / offline e-KYC)", "PAN card (mandatory)", "Passport", "Voter ID", "Driving licence", "Recent passport-size photograph"] });
        suggestions = ["Start video KYC", "Open a new account"];
        break;

      case "open_account": {
        const p = ents.product ?? "savings";
        const name = p === "fd" ? "a fixed deposit" : p === "rd" ? "a recurring deposit" : "a savings account";
        reply(say("open_account", { product: name, time: p === "fd" || p === "rd" ? "2 minutes" : "10 minutes" }),
          { kind: "checklist", title: `Open ${name}`, items: p === "fd" || p === "rd"
            ? ["Choose amount (min ₹5,000) and tenure", "Pick payout: monthly, quarterly or on maturity", "Confirm with MPIN — funds are debited from savings", "Receipt & e-advice emailed instantly"]
            : ["Verify mobile & email with OTP", "PAN + Aadhaar e-KYC", "5-minute video KYC with an officer", "Account number issued instantly; debit card in 7 days"] });
        suggestions = ["FD rates", "KYC documents"];
        break;
      }

      case "find_branch": case "find_atm": {
        const kind = intent === "find_atm" ? "ATM" : "branch";
        const city = ents.city ?? (ents.location === "near_me" ? "Mumbai" : undefined);
        if (!city) { S.last = { intent, ents: {} }; reply(say("ask_city", { kind })); suggestions = ["Mumbai", "Bengaluru", "Chennai", "Delhi"]; return; }
        const list = BRANCHES.filter((b) => b.city === city && (kind === "branch" || b.atm));
        if (!list.length) { reply(say("no_branch", { kind, city, cities: joinList([...new Set(BRANCHES.map((b) => b.city))]) })); break; }
        const note = ents.location === "near_me" && !ents.city ? " (using your home branch city — tell me another city anytime)" : "";
        reply(say("branches", { count: list.length, kind, city }) + note, { kind: "branches", type: kind === "ATM" ? "atm" : "branch", items: list.map(({ name, city, address, ifsc, hours, atm }) => ({ name, city, address, ifsc, hours, atm })) });
        suggestions = [kind === "ATM" ? "Branches here" : "ATMs here", "Branch in Chennai"];
        break;
      }

      case "human_agent": {
        const t = ticket("SR");
        reply(say("handoff", { ticket: t, phone: fakePhone, eta: "15 minutes" }), { kind: "handoff", ticket: t, eta: "15 min" });
        break;
      }

      case "report_fraud": {
        const t = ticket("FRD");
        reply(say("fraud", { name: user.firstName, ticket: t }), { kind: "alert", tone: "danger", title: "Priority dispute raised · " + t, body: "Never share OTP, PIN, CVV or remote-access apps. Zero-liability applies if reported within 3 working days (RBI guidelines)." });
        suggestions = ["Block my debit card", "Block my credit card", "Talk to an agent"];
        break;
      }

      default: reply(say("out_of_scope")); suggestions = HOME;
    }
    S.last = { intent, ents };
  }

  // ── transfer sub-dialogue ──────────────────────────────
  function advanceTransfer(f: Frame) {
    if (f.slots.payeeRaw && !f.slots.payee) {
      const guess = user.payees.find((p) => p.name.toLowerCase().includes(String(f.slots.payeeRaw).toLowerCase()) || p.aliases.includes(String(f.slots.payeeRaw).toLowerCase()));
      if (guess) f.slots.payee = guess; else f.slots.unknownPayee = f.slots.payeeRaw;
      delete f.slots.payeeRaw;
    }
    if (f.slots.unknownPayee) {
      const name = f.slots.unknownPayee; delete f.slots.unknownPayee;
      f.awaiting = "payee";
      reply(say("unknown_payee", { name, list: joinList(user.payees.map((p) => p.name.split(" ")[0])) }));
      suggestions = user.payees.slice(0, 4).map((p) => p.name.split(" ")[0]);
      return;
    }
    if (!f.slots.payee) { f.awaiting = "payee"; reply(say("ask_payee")); suggestions = user.payees.slice(0, 4).map((p) => p.name.split(" ")[0]); return; }
    const p: Payee = f.slots.payee;
    if (!f.slots.amount) { f.awaiting = "amount"; reply(say("ask_amount", { payee: p.name.split(" ")[0] })); suggestions = ["₹500", "₹2,000", "₹5,000"]; return; }
    const amt: number = f.slots.amount, acc = user.accounts[0];
    if (amt > acc.balance) { f.slots.amount = undefined; f.awaiting = "amount"; reply(say("insufficient", { balance: inr(acc.balance) })); suggestions = ["Cancel"]; return; }
    if (user.dailyTransferred + amt > DAILY_LIMIT) { S.frame = undefined; reply(say("limit_exceeded", { limit: inr(DAILY_LIMIT), left: inr(DAILY_LIMIT - user.dailyTransferred) })); return; }
    f.awaiting = "confirm";
    const mode = amt >= 200000 ? "RTGS" : "IMPS";
    trace.push("Business rules ✓ balance ✓ daily-limit ✓ known payee → awaiting confirmation");
    reply(say("confirm_transfer", { amount: inr(amt), payee: p.name, bank: p.bank, acc: p.account, mode }),
      { kind: "transfer_confirm", payee: p.name, bank: p.bank, account: p.account, amount: amt, from: `Savings ${mask(acc.number)}`, mode });
    suggestions = ["Confirm", "Cancel"];
  }

  function confirmFrame() {
    const f = S.frame!;
    if (f.intent === "transfer_money") {
      if (f.slots.amount > OTP_THRESHOLD) {
        f.awaiting = "otp"; f.otp = String(Math.floor(100000 + Math.random() * 900000)); f.otpTries = 0;
        trace.push(`Step-up auth → amount > ${inr(OTP_THRESHOLD)} → OTP challenge`);
        reply(say("ask_otp", { limit: inr(OTP_THRESHOLD), phone: fakePhone }), { kind: "otp", phone: fakePhone, demoOtp: f.otp });
        suggestions = ["Cancel"];
        return done();
      }
      finishTransfer();
    } else if (f.intent === "pay_bill") {
      const b = BILLERS[f.slots.bill];
      const r = payBill(user, b.name, f.slots.amount);
      reply(say("bill_done", { amount: inr(f.slots.amount), biller: b.name, ref: r.reference }),
        { kind: "receipt", title: "Bill paid", reference: r.reference, amount: f.slots.amount, rows: [["Biller", b.name], ["Paid from", `Savings ${mask(user.accounts[0].number)}`], ["Date", fmtDate(r.txn.date)], ["Balance", inr(user.accounts[0].balance)]] });
      S.frame = undefined; suggestions = ["Show recent transactions"];
    } else if (f.intent === "block_card") {
      const c = user.cards.find((x) => x.type === f.slots.card)!;
      c.status = "blocked";
      const t = ticket("CB");
      reply(say("card_blocked", { card: `${c.type} card •••• ${c.last4}`, ticket: t }), { kind: "alert", tone: "success", title: "Card blocked", body: `${c.network} ${c.type} •••• ${c.last4} · Ticket ${t}` });
      S.frame = undefined; suggestions = ["Show my cards", "Report fraud"];
    }
    return done();
  }

  function finishTransfer() {
    const f = S.frame!;
    const r = executeTransfer(user, f.slots.payee, f.slots.amount);
    trace.push(`CBS → debit posted · ref ${r.reference}`);
    reply(say("transfer_done", { amount: inr(f.slots.amount), payee: f.slots.payee.name, ref: r.reference, balance: inr(r.account.balance) }),
      { kind: "receipt", title: "Money sent", reference: r.reference, amount: f.slots.amount, rows: [["To", `${f.slots.payee.name} · ${f.slots.payee.bank}`], ["Mode", f.slots.amount >= 200000 ? "RTGS" : "IMPS"], ["Date", fmtDate(r.txn.date)], ["New balance", inr(r.account.balance)]] });
    S.frame = undefined;
    suggestions = ["Show recent transactions", "Send more money"];
  }

  function fillSlots(f: Frame, e: Record<string, any>) {
    const filled: string[] = [];
    const set = (k: string, v: unknown) => { if (v !== undefined && v !== null) { f.slots[k] = v; filled.push(k); } };
    if (f.intent === "transfer_money") {
      if (e.payee) { const p = user.payees.find((x) => x.name === e.payee); if (p) set("payee", p); else set("unknownPayee", e.payee); }
      set("amount", e.amount);
    } else if (f.intent === "pay_bill") { set("bill", e.bill_type); set("amount", e.amount); }
    else if (f.intent === "block_card") set("card", e.card_type);
    else if (f.intent === "loan_emi_calc") { set("amount", e.amount); set("tenure", e.tenure_months); set("loan", e.loan_type); }
    if (filled.length && f.awaiting && f.awaiting !== "confirm") f.awaiting = undefined;
    return filled;
  }

  function done(): ChatResponse {
    if (!suggestions.length && !S.frame) suggestions = pick([HOME, ["Spending this month", "Loan status", "FD rates"]]);
    return {
      messages: out, suggestions, nlu: parsed, trace,
      state: { active: S.frame?.intent, awaiting: S.frame?.awaiting, slots: Object.fromEntries(Object.entries(S.frame?.slots ?? {}).map(([k, v]) => [k, (v as Payee)?.name ?? v])) },
      balance: user.accounts[0].balance,
    };
  }
}

export function resetSession(userId: string, sessionId: string) { sessions.delete(userId + ":" + sessionId); }
export const nluInfo = () => ({ intents: nlu.classes });
