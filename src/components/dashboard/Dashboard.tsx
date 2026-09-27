"use client";
import { AnimatePresence, animate, motion } from "framer-motion";
import { ArrowLeftRight, Bug, CreditCard, Landmark, LogOut, MapPin, PieChart, ReceiptText, ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Summary } from "@/lib/bank/summary";
import type { ChatResponse } from "@/lib/types";
import { Logo } from "../ui/Logo";
import { ChatPanel, type ChatHandle } from "./ChatPanel";
import { Inspector } from "./Inspector";
import { inr } from "./RichCards";

const CAT: Record<string, string> = { food: "Food & dining", groceries: "Groceries", shopping: "Shopping", travel: "Travel", fuel: "Fuel", entertainment: "Entertainment", bills: "Bills", cash: "Cash", salary: "Salary", transfer: "Transfer", emi: "EMI" };

function Balance({ value }: { value: number }) {
  const [v, setV] = useState(value);
  const prev = useRef(value);
  useEffect(() => { const c = animate(prev.current === value ? 0 : prev.current, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: setV }); prev.current = value; return c.stop; }, [value]);
  return <span className="num">{inr(Math.round(v))}</span>;
}

const QUICK = [
  [ArrowLeftRight, "Send money", "I want to transfer money"],
  [ReceiptText, "Pay a bill", "Pay my electricity bill"],
  [PieChart, "Spending", "Analyse my spending this month"],
  [CreditCard, "Cards", "Show my cards"],
  [Landmark, "Loans", "Show my loans"],
  [MapPin, "Find ATM", "ATM near me"],
] as const;

export function Dashboard({ initial }: { initial: Summary }) {
  const router = useRouter();
  const [sum, setSum] = useState(initial);
  const [last, setLast] = useState<ChatResponse | null>(null);
  const [showInspector, setShowInspector] = useState(true);
  const chat = useRef<ChatHandle>(null);

  const refresh = useCallback(async () => { const r = await fetch("/api/me"); if (r.ok) setSum(await r.json()); }, []);
  const onResponse = useCallback((r: ChatResponse) => {
    setLast(r);
    if (r.messages.some((m) => m.card?.kind === "receipt" || (m.card?.kind === "alert" && m.card.tone === "success"))) refresh();
  }, [refresh]);

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }

  const savings = sum.accounts[0];
  const total = sum.accounts.reduce((s, a) => s + a.balance, 0);
  const spendTotal = sum.monthSpend.reduce((s, c) => s + c.amount, 0);
  const hour = new Date().getHours();

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-3">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInspector((s) => !s)} aria-pressed={showInspector} className={`hidden items-center gap-2 rounded-full px-3.5 py-2 text-sm transition lg:flex ${showInspector ? "bg-peacock-100 text-peacock-800" : "text-slate hover:bg-paper"}`}><Bug size={16} /> Under the hood</button>
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{sum.name}</p><p className="text-xs text-slate">{sum.segment} · {sum.id}</p></div>
          <button onClick={logout} aria-label="Sign out" className="rounded-full p-2.5 text-slate hover:bg-paper hover:text-ink"><LogOut size={18} /></button>
        </div>
      </header>

      <div className={`grid min-h-0 flex-1 gap-4 p-4 ${showInspector ? "lg:grid-cols-[340px_1fr_340px]" : "lg:grid-cols-[380px_1fr]"}`}>
        {/* ── accounts column ─────────────────────── */}
        <aside className="thin-scroll hidden min-h-0 space-y-4 overflow-y-auto lg:block">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-peacock-900 p-5 text-white">
            <div className="dot-field absolute inset-0 opacity-25" />
            <div className="relative">
              <p className="text-sm text-white/60">Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, {sum.firstName}</p>
              <p className="mt-4 text-xs text-white/50">Total balance</p>
              <p className="font-display text-4xl font-bold tracking-tight"><Balance value={total} /></p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {sum.accounts.map((a) => <div key={a.masked} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10"><p className="text-xs capitalize text-white/50">{a.type} {a.masked}</p><p className="num font-semibold"><Balance value={a.balance} /></p></div>)}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-3 gap-2">
            {QUICK.map(([Icon, label, prompt]) => (
              <button key={label} onClick={() => chat.current?.ask(prompt)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white px-2 py-3 text-xs transition hover:-translate-y-0.5 hover:border-peacock-500">
                <Icon size={18} className="text-peacock-700" />{label}
              </button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-3xl border border-line bg-white p-5">
            <div className="flex items-baseline justify-between"><h2 className="font-semibold">Spent this month</h2><p className="num font-display text-lg font-bold">{inr(spendTotal)}</p></div>
            <ul className="mt-3 space-y-2.5">{sum.monthSpend.slice(0, 5).map((c, i) => (
              <li key={c.category} className="text-sm">
                <div className="mb-1 flex justify-between"><span>{CAT[c.category] ?? c.category}</span><span className="num text-slate">{inr(c.amount)}</span></div>
                <div className="h-1.5 rounded-full bg-paper"><motion.div initial={{ width: 0 }} animate={{ width: `${(c.amount / (sum.monthSpend[0]?.amount || 1)) * 100}%` }} transition={{ delay: 0.3 + i * 0.07, duration: 0.7 }} className="h-full rounded-full bg-peacock-500" /></div>
              </li>))}</ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="rounded-3xl border border-line bg-white p-5">
            <div className="flex items-baseline justify-between"><h2 className="font-semibold">Recent activity</h2><button onClick={() => chat.current?.ask("Show my last 10 transactions")} className="text-xs text-peacock-700 hover:underline">Ask Nova for more</button></div>
            <ul className="mt-2"><AnimatePresence initial={false}>{sum.recent.map((t) => (
              <motion.li key={t.id} layout initial={{ opacity: 0, backgroundColor: "#fdf0d6" }} animate={{ opacity: 1, backgroundColor: "#ffffff" }} transition={{ duration: 1.2 }} className="flex justify-between gap-3 border-b border-line py-2.5 text-sm last:border-0">
                <div className="min-w-0"><p className="truncate">{t.description}</p><p className="text-xs text-slate">{new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div>
                <p className={`num shrink-0 font-medium ${t.amount > 0 ? "text-success" : ""}`}>{t.amount > 0 ? "+" : "−"}{inr(Math.abs(t.amount))}</p>
              </motion.li>))}</AnimatePresence></ul>
          </motion.div>

          <button onClick={() => chat.current?.ask("I think there's a fraudulent transaction on my account")} className="flex w-full items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-left text-sm text-danger transition hover:bg-danger/10">
            <ShieldAlert size={18} /> Report a transaction you didn't make
          </button>
        </aside>

        {/* ── chat ────────────────────────────────── */}
        <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="min-h-0 overflow-hidden rounded-3xl border border-line bg-white">
          <ChatPanel ref={chat} firstName={sum.firstName} onResponse={onResponse} />
        </motion.main>

        {/* ── inspector ───────────────────────────── */}
        <AnimatePresence>
          {showInspector && (
            <motion.aside initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.35 }} className="thin-scroll hidden min-h-0 overflow-y-auto rounded-3xl border border-line bg-white lg:block">
              <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white/90 px-5 py-3.5 backdrop-blur">
                <h2 className="font-display font-semibold">Under the hood</h2>
                <button onClick={() => setShowInspector(false)} aria-label="Close panel" className="rounded-lg p-1.5 text-slate hover:bg-paper"><X size={16} /></button>
              </div>
              <Inspector last={last} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
