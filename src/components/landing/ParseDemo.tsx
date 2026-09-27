"use client";
// Hero demo: shows Nova literally understanding a sentence —
// type → entities light up → intent resolved → NLG reply → action card.
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Seg = { t: string; e?: "amount" | "payee" | "date" | "merchant" | "loan" | "tenure" };
interface Script { segs: Seg[]; intent: string; conf: number; reply: string; card: React.ReactNode }

const ENT_STYLE: Record<string, string> = {
  amount: "bg-marigold-500/25 text-marigold-400 ring-marigold-500/60",
  payee: "bg-peacock-500/25 text-peacock-300 ring-peacock-500/70",
  date: "bg-white/10 text-white ring-white/40",
  merchant: "bg-peacock-500/25 text-peacock-300 ring-peacock-500/70",
  loan: "bg-white/10 text-white ring-white/40",
  tenure: "bg-marigold-500/25 text-marigold-400 ring-marigold-500/60",
};

const SCRIPTS: Script[] = [
  {
    segs: [{ t: "Send " }, { t: "₹2,500", e: "amount" }, { t: " to " }, { t: "Rohan", e: "payee" }, { t: " for dinner" }],
    intent: "transfer_money", conf: 0.98,
    reply: "Ready to send ₹2,500 to Rohan Mehta (HDFC ••2231). Shall I go ahead?",
    card: (
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-white/50">To Rohan Mehta · IMPS</p><p className="num font-display text-2xl font-bold text-white">₹2,500</p></div>
        <div className="flex gap-2"><span className="rounded-full bg-marigold-500 px-3 py-1.5 text-xs font-semibold text-peacock-950">Confirm</span><span className="rounded-full px-3 py-1.5 text-xs text-white/60 ring-1 ring-white/20">Cancel</span></div>
      </div>
    ),
  },
  {
    segs: [{ t: "How much did I spend on " }, { t: "Swiggy", e: "merchant" }, { t: " " }, { t: "last month", e: "date" }, { t: "?" }],
    intent: "spending_analysis", conf: 0.99,
    reply: "Last month, Swiggy cost you ₹1,871 across 4 payments.",
    card: (
      <div className="flex h-14 items-end gap-1.5">
        {[38, 62, 24, 80, 46, 30, 55].map((h, i) => (
          <motion.span key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={`w-full rounded-sm ${i === 3 ? "bg-marigold-500" : "bg-peacock-500/60"}`} />
        ))}
      </div>
    ),
  },
  {
    segs: [{ t: "EMI for " }, { t: "20 lakh", e: "amount" }, { t: " " }, { t: "home loan", e: "loan" }, { t: " over " }, { t: "15 years", e: "tenure" }],
    intent: "loan_emi_calc", conf: 0.98,
    reply: "EMI comes to ₹19,636 a month (₹20 lakh, 8.45% p.a., 15 years).",
    card: (
      <div className="grid grid-cols-3 gap-3 text-white">
        {[["Monthly EMI", "₹19,636"], ["Interest", "₹15.3 L"], ["Total", "₹35.3 L"]].map(([k, v]) => (
          <div key={k}><p className="text-[11px] text-white/50">{k}</p><p className="num font-display text-lg font-bold">{v}</p></div>
        ))}
      </div>
    ),
  },
];

type Phase = "typing" | "entities" | "intent" | "reply" | "hold";

export function ParseDemo() {
  const [i, setI] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const s = SCRIPTS[i];
  const full = useMemo(() => s.segs.map((x) => x.t).join(""), [s]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (chars < full.length) t = setTimeout(() => setChars((c) => c + 1), 38 + Math.random() * 40);
      else t = setTimeout(() => setPhase("entities"), 350);
    } else if (phase === "entities") t = setTimeout(() => setPhase("intent"), 900);
    else if (phase === "intent") t = setTimeout(() => setPhase("reply"), 1100);
    else if (phase === "reply") t = setTimeout(() => setPhase("hold"), 900);
    else t = setTimeout(() => { setI((v) => (v + 1) % SCRIPTS.length); setChars(0); setPhase("typing"); }, 3200);
    return () => clearTimeout(t);
  }, [phase, chars, full.length]);

  // render typed text, splitting into entity spans
  let left = chars;
  const shown = phase !== "typing";
  const ents = s.segs.filter((x) => x.e);

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-peacock-900/70 p-5 ring-1 ring-white/10 backdrop-blur sm:p-7" aria-label="Animated demo of Nova understanding a request">
      <div className="dot-field pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between text-xs text-white/50">
          <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Nova · live parse</span>
          <span className="num">{i + 1} / {SCRIPTS.length}</span>
        </div>

        {/* user utterance */}
        <div className="ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-[15px] leading-relaxed text-ink shadow-lg shadow-black/20 sm:text-base">
          {s.segs.map((seg, k) => {
            const take = Math.max(0, Math.min(seg.t.length, left));
            left -= seg.t.length;
            if (!take) return null;
            const txt = seg.t.slice(0, take);
            return seg.e && shown ? (
              <motion.mark key={k} initial={{ backgroundColor: "rgba(0,0,0,0)" }} animate={{ backgroundColor: seg.e === "amount" || seg.e === "tenure" ? "#fdf0d6" : seg.e === "payee" || seg.e === "merchant" ? "#d7f0ee" : "#eef2f3" }} transition={{ delay: k * 0.08 }} className="rounded-md px-1 text-ink">
                {txt}
              </motion.mark>
            ) : <span key={k}>{txt}</span>;
          })}
          {phase === "typing" && <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-1 animate-pulse bg-peacock-600" />}
        </div>

        {/* NLU readout */}
        <div className="mt-5 min-h-[92px] space-y-3">
          <AnimatePresence>
            {shown && (
              <motion.div key={"e" + i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2">
                {ents.map((e, k) => (
                  <motion.span key={k} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + k * 0.12 }} className={`rounded-full px-2.5 py-1 text-xs ring-1 ${ENT_STYLE[e.e!]}`}>
                    {e.e}: <b className="font-semibold">{e.t}</b>
                  </motion.span>
                ))}
              </motion.div>
            )}
            {(phase === "intent" || phase === "reply" || phase === "hold") && (
              <motion.div key={"i" + i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-sm text-white">
                <span className="shrink-0 text-white/50">intent</span>
                <code className="shrink-0 font-semibold text-marigold-400">{s.intent}</code>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.span className="block h-full rounded-full bg-marigold-500" initial={{ width: 0 }} animate={{ width: `${s.conf * 100}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
                </span>
                <span className="num w-10 text-right text-white/70">{Math.round(s.conf * 100)}%</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NLG reply */}
        <div className="mt-4 min-h-[150px]">
          <AnimatePresence mode="wait">
            {(phase === "reply" || phase === "hold") && (
              <motion.div key={"r" + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="max-w-[94%] space-y-3">
                <p className="rounded-2xl rounded-bl-md bg-peacock-700 px-4 py-3 text-[15px] leading-relaxed text-white">{s.reply}</p>
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }} className="rounded-2xl bg-peacock-950/80 p-4 ring-1 ring-white/10">{s.card}</motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
