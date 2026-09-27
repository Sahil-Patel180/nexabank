"use client";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Info, MapPin } from "lucide-react";
import type { RichCard } from "@/lib/types";

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const d = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const CAT: Record<string, string> = { food: "Food & dining", groceries: "Groceries", shopping: "Shopping", travel: "Travel", fuel: "Fuel", entertainment: "Entertainment", bills: "Bills", transfer: "Transfers", emi: "EMI", cash: "Cash", salary: "Salary" };
const PALETTE = ["#11767f", "#f2a93b", "#16939a", "#0c4555", "#f6bf61", "#7fcfcf", "#56686f"];

const Shell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className={`mt-2 overflow-hidden rounded-2xl border border-line bg-white ${className}`}>{children}</motion.div>
);

export function CardView({ card, onAction, disabled }: { card: RichCard; onAction: (t: string) => void; disabled?: boolean }) {
  switch (card.kind) {
    case "balance":
      return <Shell>{card.accounts.map((a) => (
        <div key={a.masked} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
          <div><p className="text-sm font-medium capitalize">{a.type} account</p><p className="text-xs text-slate">{a.masked} · {a.ifsc}</p></div>
          <p className="num font-display text-xl font-bold">{inr(a.balance)}</p>
        </div>))}</Shell>;

    case "statement":
      return <Shell>
        <p className="border-b border-line px-4 py-2 text-xs text-slate">{card.title}</p>
        <ul className="max-h-72 overflow-y-auto thin-scroll">{card.txns.map((t, i) => (
          <motion.li key={t.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.03 }} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0">
            <div className="min-w-0"><p className="truncate font-medium">{t.description}</p><p className="text-xs text-slate">{d(t.date)} · {t.mode} · {CAT[t.category] ?? t.category}</p></div>
            <p className={`num shrink-0 font-semibold ${t.amount > 0 ? "text-success" : ""}`}>{t.amount > 0 ? "+" : "−"}{inr(Math.abs(t.amount))}</p>
          </motion.li>))}</ul>
      </Shell>;

    case "spending": {
      return <Shell className="p-4">
        <div className="flex items-baseline justify-between"><p className="text-xs text-slate">Total spent {card.period}</p><p className="num font-display text-xl font-bold">{inr(card.total)}</p></div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-paper">{card.breakdown.map((b, i) => (
          <motion.span key={b.category} initial={{ width: 0 }} animate={{ width: `${b.pct}%` }} transition={{ delay: 0.25 + i * 0.06, duration: 0.6 }} style={{ background: PALETTE[i % PALETTE.length] }} title={`${CAT[b.category]} ${b.pct}%`} />))}</div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">{card.breakdown.slice(0, 6).map((b, i) => (
          <li key={b.category} className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{CAT[b.category] ?? b.category}</span><span className="num text-slate">{inr(b.amount)}</span></li>))}</ul>
        {card.merchants.length > 0 && <p className="mt-3 border-t border-line pt-2 text-xs text-slate">Top merchants: {card.merchants.map((m) => `${m.name} ${inr(m.amount)}`).join(", ")}</p>}
      </Shell>;
    }

    case "transfer_confirm":
      return <Shell className="p-4">
        <p className="text-xs text-slate">Sending to</p>
        <p className="font-medium">{card.payee} <span className="text-sm text-slate">· {card.bank} {card.account}</span></p>
        <p className="num mt-2 font-display text-3xl font-bold">{inr(card.amount)}</p>
        <p className="mt-1 text-xs text-slate">From {card.from} · {card.mode} · No charges</p>
        <div className="mt-4 flex gap-2">
          <button disabled={disabled} onClick={() => onAction("Confirm")} className="flex-1 rounded-xl bg-peacock-800 py-2.5 text-sm font-semibold text-white transition hover:bg-peacock-700 disabled:opacity-40">Send {inr(card.amount)}</button>
          <button disabled={disabled} onClick={() => onAction("Cancel")} className="rounded-xl px-4 py-2.5 text-sm ring-1 ring-line hover:bg-paper disabled:opacity-40">Cancel</button>
        </div>
      </Shell>;

    case "otp":
      return <Shell className="p-4">
        <p className="text-sm">OTP sent to {card.phone}</p>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("otp"); if (v) onAction(String(v)); }}>
          <input name="otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="6-digit OTP" disabled={disabled} className="num w-full rounded-xl border border-line px-3 py-2.5 tracking-[0.3em] outline-none focus:border-peacock-500" />
          <button disabled={disabled} className="rounded-xl bg-peacock-800 px-4 text-sm font-semibold text-white disabled:opacity-40">Verify</button>
        </form>
        <p className="mt-2 rounded-lg bg-marigold-100 px-3 py-2 text-xs text-peacock-900">Demo SMS: your NexaBank OTP is <b className="num tracking-widest">{card.demoOtp}</b></p>
      </Shell>;

    case "receipt":
      return <Shell>
        <div className="flex items-center gap-3 bg-success/10 px-4 py-3">
          <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.2 }}><CheckCircle2 className="text-success" /></motion.span>
          <div><p className="font-semibold">{card.title}</p><p className="num text-xs text-slate">Ref {card.reference}</p></div>
          <p className="num ml-auto font-display text-xl font-bold">{inr(card.amount)}</p>
        </div>
        <dl className="px-4 py-2 text-sm">{card.rows.map(([k, v]) => <div key={k} className="flex justify-between py-1"><dt className="text-slate">{k}</dt><dd className="num text-right">{v}</dd></div>)}</dl>
      </Shell>;

    case "bill_confirm":
      return <Shell className="p-4">
        <p className="font-medium">{card.biller}</p>
        <p className="num mt-1 font-display text-3xl font-bold">{inr(card.amount)}</p>
        <p className="text-xs text-slate">Due {d(card.dueDate)} · via Bharat BillPay</p>
        <div className="mt-4 flex gap-2">
          <button disabled={disabled} onClick={() => onAction("Yes, pay now")} className="flex-1 rounded-xl bg-peacock-800 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Pay {inr(card.amount)}</button>
          <button disabled={disabled} onClick={() => onAction("Cancel")} className="rounded-xl px-4 py-2.5 text-sm ring-1 ring-line disabled:opacity-40">Cancel</button>
        </div>
      </Shell>;

    case "cards":
      return <div className="mt-2 grid gap-2 sm:grid-cols-2">{card.cards.map((c, i) => (
        <motion.div key={c.last4} initial={{ opacity: 0, rotateY: -20 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
          className={`relative overflow-hidden rounded-2xl p-4 text-white ${c.type === "credit" ? "bg-gradient-to-br from-peacock-700 to-peacock-950" : "bg-gradient-to-br from-marigold-500 to-[#c9822a]"} ${c.status === "blocked" ? "grayscale" : ""}`}>
          <div className="flex justify-between text-xs"><span className="capitalize">{c.type} · {c.network}</span><span className={`rounded-full px-2 py-0.5 ${c.status === "active" ? "bg-white/20" : "bg-danger"}`}>{c.status}</span></div>
          <p className="num mt-5 font-mono tracking-widest">•••• {c.last4}</p>
          {c.limit && <p className="num mt-2 text-xs text-white/80">Limit {inr(c.limit)} · Due {inr(c.outstanding ?? 0)}{c.dueDate ? ` by ${d(c.dueDate)}` : ""}</p>}
        </motion.div>))}</div>;

    case "emi": {
      const pPct = Math.round((card.principal / card.total) * 100);
      return <Shell className="p-4">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#fdf0d6" strokeWidth="4" />
            <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="#11767f" strokeWidth="4" strokeLinecap="round" initial={{ strokeDasharray: "0 100" }} animate={{ strokeDasharray: `${pPct} 100` }} transition={{ delay: 0.3, duration: 0.9 }} />
          </svg>
          <div>
            <p className="text-xs text-slate">Monthly EMI</p>
            <p className="num font-display text-3xl font-bold">{inr(card.emi)}</p>
            <p className="text-xs text-slate">{card.rate}% p.a. · {card.months} months · {card.loanType.replace("_", " ")} loan</p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
          <div><dt className="flex items-center gap-1 text-slate"><span className="h-2 w-2 rounded-full bg-peacock-600" />Principal</dt><dd className="num font-semibold">{inr(card.principal)}</dd></div>
          <div><dt className="flex items-center gap-1 text-slate"><span className="h-2 w-2 rounded-full bg-marigold-100 ring-1 ring-marigold-500" />Interest</dt><dd className="num font-semibold">{inr(card.interest)}</dd></div>
          <div><dt className="text-slate">Total payable</dt><dd className="num font-semibold">{inr(card.total)}</dd></div>
        </dl>
      </Shell>;
    }

    case "eligibility":
      return <Shell className="p-4">
        <p className="text-xs capitalize text-slate">{card.loanType.replace("_", " ")} loan · pre-qualified up to</p>
        <p className="num font-display text-3xl font-bold text-peacock-800">{inr(card.maxLoan)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div><p className="text-slate">Rate</p><p className="font-semibold">{card.rate}%</p></div>
          <div><p className="text-slate">Max EMI</p><p className="num font-semibold">{inr(card.maxEmi)}</p></div>
          <div><p className="text-slate">Credit score</p><p className="font-semibold">{card.score}</p></div>
        </div>
        <p className="mt-3 text-xs text-slate">Assumes {card.tenureYears}-year tenure and 50% of monthly income for EMIs. Indicative only.</p>
      </Shell>;

    case "loans":
      return <Shell className="p-4">{card.loans.map((l) => {
        const paid = Math.round((1 - l.outstanding / l.principal) * 100);
        return <div key={l.type}>
          <div className="flex justify-between text-sm"><span className="font-medium capitalize">{l.type} loan · {l.rate}%</span><span className="num">{inr(l.outstanding)} left</span></div>
          <div className="mt-2 h-2 rounded-full bg-paper"><motion.div initial={{ width: 0 }} animate={{ width: `${paid}%` }} transition={{ delay: 0.3, duration: 0.8 }} className="h-full rounded-full bg-peacock-600" /></div>
          <p className="num mt-2 text-xs text-slate">{paid}% repaid · EMI {inr(l.emi)} · next on {d(l.nextEmiDate)} · {l.emisLeft} EMIs left</p>
        </div>;
      })}</Shell>;

    case "rates":
      return <Shell>
        <p className="border-b border-line px-4 py-2 text-sm font-medium">{card.title}</p>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate">{card.headers.map((h) => <th key={h} className="px-4 py-2 font-normal">{h}</th>)}</tr></thead>
          <tbody>{card.rows.map((r) => <tr key={r[0]} className="border-t border-line">{r.map((c, i) => <td key={i} className={`num px-4 py-2 capitalize ${i ? "font-semibold" : ""}`}>{c}</td>)}</tr>)}</tbody></table>
        {card.note && <p className="border-t border-line px-4 py-2 text-xs text-slate">{card.note}</p>}
      </Shell>;

    case "branches":
      return <div className="mt-2 space-y-2">{card.items.map((b, i) => (
        <motion.div key={b.ifsc} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }} className="flex gap-3 rounded-2xl border border-line bg-white p-3.5 text-sm">
          <MapPin size={18} className="mt-0.5 shrink-0 text-peacock-600" />
          <div><p className="font-medium">{card.type === "atm" ? "ATM · " : ""}NexaBank {b.name}</p><p className="text-slate">{b.address}</p>
            <p className="mt-1 text-xs text-slate">{card.type === "atm" ? "Open 24×7" : `${b.hours} · IFSC ${b.ifsc}`}</p></div>
        </motion.div>))}</div>;

    case "checklist":
      return <Shell className="p-4"><p className="text-sm font-medium">{card.title}</p>
        <ol className="mt-2 space-y-1.5 text-sm">{card.items.map((it, i) => <li key={it} className="flex gap-2.5"><span className="num grid h-5 w-5 shrink-0 place-items-center rounded-full bg-peacock-100 text-[11px] font-semibold text-peacock-800">{i + 1}</span>{it}</li>)}</ol></Shell>;

    case "alert": {
      const tone = { danger: ["bg-danger/10", "text-danger", AlertTriangle], success: ["bg-success/10", "text-success", CheckCircle2], info: ["bg-peacock-100", "text-peacock-700", Info] }[card.tone];
      const Icon = tone[2] as typeof Info;
      return <Shell className={`flex gap-3 p-4 ${tone[0]}`}><Icon className={`shrink-0 ${tone[1]}`} size={20} /><div><p className="font-semibold">{card.title}</p><p className="mt-0.5 text-sm text-slate">{card.body}</p></div></Shell>;
    }

    case "handoff":
      return <Shell className="flex items-center gap-3 p-4">
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-peacock-100"><Clock size={18} className="text-peacock-700" /><span className="absolute inset-0 animate-ping rounded-full bg-peacock-300/40" /></span>
        <div><p className="font-semibold">Call-back booked</p><p className="text-sm text-slate">Ticket {card.ticket} · expected within {card.eta}</p></div>
      </Shell>;
  }
  return <Shell className="p-4"><CreditCard /></Shell>;
}
