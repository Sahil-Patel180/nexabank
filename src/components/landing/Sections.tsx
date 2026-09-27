"use client";
import { animate, motion, useInView } from "framer-motion";
import { ArrowLeftRight, BadgeCheck, CreditCard, Headset, KeyRound, Landmark, LockKeyhole, MapPin, PieChart, ShieldAlert, Timer, UserCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import metrics from "@nlu/model/metrics.json";

// ── capabilities (bento) ────────────────────────────────────
function Tile({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // cursor spotlight
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`group relative overflow-hidden rounded-3xl border border-line bg-white p-6 ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(360px circle at var(--x) var(--y), rgba(22,147,154,0.10), transparent 60%)" }} />
      <div className="relative">{children}</div>
    </div>
  );
}
const Ask = ({ children }: { children: React.ReactNode }) => <span className="inline-block rounded-full bg-paper px-3 py-1.5 text-sm text-ink ring-1 ring-line">“{children}”</span>;

export function Capabilities() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-28">
      <h2 className="max-w-xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Ask for it in your own words</h2>
      <p className="mt-4 max-w-lg text-slate">Nova covers 25 intents across everyday banking. A few things people ask most:</p>
      <div className="mt-12 grid gap-4 md:grid-cols-6">
        <Tile className="md:col-span-4">
          <ArrowLeftRight className="text-peacock-600" />
          <h3 className="mt-4 font-display text-2xl font-semibold">Send money to saved payees</h3>
          <p className="mt-2 max-w-md text-slate">Nova asks for anything missing, shows a confirmation, and adds an OTP step above ₹25,000.</p>
          <div className="mt-5 flex flex-wrap gap-2"><Ask>send 2k to Rohan</Ask><Ask>pay my landlord 18,000</Ask><Ask>transfer 1.5 lakh to mom</Ask></div>
        </Tile>
        <Tile className="md:col-span-2">
          <PieChart className="text-peacock-600" />
          <h3 className="mt-4 font-display text-2xl font-semibold">Spending insights</h3>
          <div className="mt-5 space-y-2">
            {[["Shopping", 34], ["Food & dining", 26], ["Travel", 18], ["Fuel", 12]].map(([k, v]) => (
              <div key={k} className="text-sm">
                <div className="mb-1 flex justify-between"><span>{k}</span><span className="num text-slate">{v}%</span></div>
                <div className="h-1.5 rounded-full bg-paper"><motion.div initial={{ width: 0 }} whileInView={{ width: `${Number(v) * 2.5}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-peacock-500" /></div>
              </div>
            ))}
          </div>
        </Tile>
        <Tile className="md:col-span-2">
          <CreditCard className="text-peacock-600" />
          <h3 className="mt-4 font-display text-xl font-semibold">Card controls</h3>
          <p className="mt-2 text-slate">Block a lost card in one sentence, check limits and due dates.</p>
          <div className="mt-4"><Ask>I lost my debit card</Ask></div>
        </Tile>
        <Tile className="md:col-span-2">
          <Landmark className="text-peacock-600" />
          <h3 className="mt-4 font-display text-xl font-semibold">Loans &amp; EMIs</h3>
          <p className="mt-2 text-slate">EMI maths, eligibility from your income and credit score, and what's left on your loan.</p>
          <div className="mt-4"><Ask>EMI for 25 lakh for 20 years</Ask></div>
        </Tile>
        <Tile className="md:col-span-2">
          <MapPin className="text-peacock-600" />
          <h3 className="mt-4 font-display text-xl font-semibold">Branches &amp; ATMs</h3>
          <p className="mt-2 text-slate">Addresses, IFSC codes and hours across seven cities.</p>
          <div className="mt-4"><Ask>ATM in Chennai</Ask></div>
        </Tile>
        <Tile className="md:col-span-3">
          <ShieldAlert className="text-danger" />
          <h3 className="mt-4 font-display text-xl font-semibold">Fraud help, fast</h3>
          <p className="mt-2 text-slate">Report a transaction you didn't make: Nova raises a priority dispute, offers to block your cards and points you to the 1930 cybercrime helpline.</p>
        </Tile>
        <Tile className="md:col-span-3">
          <Headset className="text-peacock-600" />
          <h3 className="mt-4 font-display text-xl font-semibold">A person when you need one</h3>
          <p className="mt-2 text-slate">Say “talk to a human” any time. Nova opens a ticket and books a call-back — no dead ends.</p>
        </Tile>
      </div>
    </section>
  );
}

// ── security band ───────────────────────────────────────────
const GUARDS = [
  [BadgeCheck, "Confirm before every payment", "Nothing moves until you say yes to a summary of exactly what will happen."],
  [KeyRound, "OTP above ₹25,000", "High-value transfers need a one-time password; three wrong tries cancel it."],
  [UserCheck, "Saved payees only", "New beneficiaries can't be paid from chat, closing a common social-engineering route."],
  [Timer, "Daily limits and short sessions", "₹2 lakh daily cap, and sessions expire after 30 minutes."],
  [LockKeyhole, "Signed, httpOnly sessions", "A signed token the page's scripts can't read, and login lock-out after 5 failures."],
] as const;

export function Security() {
  return (
    <section id="security" className="bg-peacock-900 py-24 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Friendly to talk to. Strict about money.</h2>
          <p className="mt-5 text-white/65">Understanding language is the easy part to get wrong. So Nova never acts on a guess: the dialogue manager enforces the same checks a teller would.</p>
        </div>
        <ul className="divide-y divide-white/10">
          {GUARDS.map(([Icon, t, d]) => (
            <li key={t} className="flex gap-5 py-5">
              <Icon className="mt-0.5 shrink-0 text-marigold-400" size={22} />
              <div><p className="font-semibold">{t}</p><p className="mt-1 text-white/60">{d}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── model metrics (read from the real training run) ─────────
function Count({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => { if (inView) { const c = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: setV }); return c.stop; } }, [inView, to]);
  return <span ref={ref} className="num">{v.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

export function Metrics() {
  const m = metrics as { accuracy: number; macroF1: number; trainSize: number; testSize: number; features: number };
  const stats = [
    { v: 25, label: "intents recognised" },
    { v: m.accuracy * 100, d: 1, s: "%", label: `accuracy on ${m.testSize} hand-written test phrases the model never saw` },
    { v: m.trainSize, label: "training utterances, generated from a template grammar" },
    { v: m.features, label: "word and character features after int8 quantisation" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Trained here, measured honestly</h2>
      <p className="mt-3 max-w-xl text-slate">No third-party AI API. The model is trained from scratch with <code className="rounded bg-white px-1.5 py-0.5 text-sm ring-1 ring-line">npm run train</code> and tested on phrases kept out of training.</p>
      <dl className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-t-2 border-peacock-600 pt-4">
            <dt className="font-display text-5xl font-bold tracking-tight text-peacock-800"><Count to={s.v} decimals={s.d} suffix={s.s} /></dt>
            <dd className="mt-2 text-sm leading-relaxed text-slate">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-5 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-marigold-500 px-8 py-16 text-peacock-950 sm:px-14">
        <svg aria-hidden className="absolute -right-10 -top-10 h-72 w-72 opacity-25" viewBox="0 0 32 32"><ellipse cx="16" cy="17" rx="12" ry="14" fill="#0a3140" /><ellipse cx="16" cy="18" rx="7.5" ry="9" fill="#f6bf61" /><ellipse cx="16" cy="19" rx="3.6" ry="4.4" fill="#0a3140" /></svg>
        <h2 className="relative max-w-xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Say hello to Nova.</h2>
        <p className="relative mt-4 max-w-md text-peacock-900/80">Two demo customers are ready with accounts, cards, a home loan and three months of transactions.</p>
        <Link href="/login" className="relative mt-8 inline-block rounded-full bg-peacock-950 px-6 py-3.5 font-semibold text-white transition hover:bg-peacock-800">Sign in with a demo account</Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line px-5 py-10 text-sm text-slate">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 sm:flex-row">
        <p>NexaBank and Nova are fictional, built as a learning project on NLU, NLG and conversational AI.</p>
        <p>Next.js · Framer Motion · in-house NLU/NLG</p>
      </div>
    </footer>
  );
}
