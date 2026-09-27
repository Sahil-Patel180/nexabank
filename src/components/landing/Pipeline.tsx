"use client";
// Scroll-told pipeline: one request travels Understand → Decide → Act → Respond.
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

const STAGES = [
  {
    name: "Understand", tech: "NLU · intent classifier + entity extractor",
    body: "A TF-IDF + softmax model trained on 2,800+ banking utterances finds what you want. A rule-and-gazetteer extractor pulls out amounts, people, dates and places — even with typos.",
    panel: (
      <div className="space-y-3 font-mono text-[13px]">
        <p className="text-white/50">input</p>
        <p className="rounded-lg bg-white/5 p-3 text-white">transfer 40k to mom</p>
        <p className="text-white/50">output</p>
        <pre className="overflow-x-auto rounded-lg bg-white/5 p-3 leading-relaxed text-peacock-300">{`intent:     transfer_money  (0.9999)
amount:     40000
payee:      Sunita Sharma  ← "mom"`}</pre>
      </div>
    ),
  },
  {
    name: "Decide", tech: "Dialogue manager · frames, slots, policies",
    body: "Nova keeps a frame for the task, fills slots across turns, asks only for what's missing, and applies bank rules: known payee, sufficient balance, daily limit, OTP above ₹25,000.",
    panel: (
      <div className="space-y-2.5 text-sm">
        {[["payee", "Sunita Sharma", true], ["amount", "₹40,000", true], ["balance check", "passed", true], ["daily limit", "₹1.6 L left", true], ["step-up OTP", "required (> ₹25,000)", false]].map(([k, v, ok]) => (
          <div key={String(k)} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
            <span className="text-white/60">{k}</span>
            <span className={`flex items-center gap-2 ${ok ? "text-white" : "text-marigold-400"}`}>{v}<span className={`h-2 w-2 rounded-full ${ok ? "bg-success" : "bg-marigold-500"}`} /></span>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: "Act", tech: "Core banking API · mock CBS ledger",
    body: "Only after you confirm (and verify the OTP) does Nova call the core-banking layer, which posts the debit and returns a reference.",
    panel: (
      <pre className="overflow-x-auto rounded-lg bg-white/5 p-4 font-mono text-[13px] leading-relaxed text-white/85">{`POST /cbs/transfers
{ "from": "SB-XX4821",
  "to":   "SBI-XX0452",
  "amount": 40000, "mode": "IMPS" }

201 Created
{ "reference": "NXB504201173",
  "balanceAfter": 322528 }`}</pre>
    ),
  },
  {
    name: "Respond", tech: "NLG · dialogue acts → templates → realisation",
    body: "The result becomes a dialogue act. NLG picks a phrasing, formats money the Indian way (₹3,22,528 · ₹28.7 lakh), personalises it and attaches a receipt card.",
    panel: (
      <div className="space-y-3">
        <p className="rounded-2xl rounded-bl-md bg-peacock-600 px-4 py-3 text-white">Done! ₹40,000 sent to Sunita Sharma. Reference NXB504201173. Your new balance is ₹3,22,528.</p>
        <div className="flex flex-wrap gap-2 text-xs text-white/60">
          {["act: transfer_done", "variant 1 of 2", "₹ en-IN format", "card: receipt"].map((t) => <span key={t} className="rounded-full px-2.5 py-1 ring-1 ring-white/15">{t}</span>)}
        </div>
      </div>
    ),
  },
];

export function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(STAGES.length - 1, Math.floor(v * STAGES.length))));
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how" ref={ref} className="relative bg-peacock-950 text-white" style={{ height: `${STAGES.length * 85 + 40}vh` }}>
      <div className="sticky top-0 flex min-h-screen items-center py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">What happens between your words and your money</h2>
          <p className="mt-4 max-w-xl text-white/60">Four stages, each one its own module. Scroll to follow one request through the system.</p>

          <div className="mt-12 grid gap-10 lg:grid-cols-[300px_1fr]">
            <ol className="relative space-y-1">
              <span className="absolute bottom-3 left-[15px] top-3 w-px bg-white/10" />
              <motion.span className="absolute left-[15px] top-3 w-px bg-marigold-500" style={{ height: fill }} />
              {STAGES.map((s, i) => (
                <li key={s.name} className="relative flex items-start gap-4 py-3">
                  <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors duration-300 ${i <= active ? "bg-marigold-500 text-peacock-950" : "bg-peacock-900 text-white/50 ring-1 ring-white/15"}`}>{i + 1}</span>
                  <div>
                    <p className={`font-display text-xl font-semibold transition-colors ${i === active ? "text-white" : "text-white/45"}`}>{s.name}</p>
                    <p className="text-sm text-white/45">{s.tech}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="relative min-h-[360px]">
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="grid gap-6 rounded-3xl bg-peacock-900/60 p-6 ring-1 ring-white/10 md:grid-cols-2 md:p-8">
                  <p className="text-lg leading-relaxed text-white/80">{STAGES[active].body}</p>
                  <div>{STAGES[active].panel}</div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
