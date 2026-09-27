"use client";
// Pinned, scroll-scrubbed horizontal story: one request travels through
// Understand → Decide → Act → Respond. Desktop pins and slides a track;
// mobile / reduced motion get the same panels stacked vertically.
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, registerGSAP } from "@/lib/motion";
import { SplitText } from "../site/Reveal";

const STAGES = [
  {
    name: "Understand", tech: "NLU · intent classifier + entity extractor",
    body: "A TF-IDF + softmax model trained on 2,800+ banking phrases decides what you want. A rule-and-gazetteer extractor pulls out amounts, people, dates and places, typos included.",
    panel: (
      <div className="space-y-3 font-mono text-[13px]">
        <p className="text-mist">input</p>
        <p className="rounded-xl bg-void/60 p-4 text-ivory">transfer 40k to mom</p>
        <p className="text-mist">output</p>
        <pre className="overflow-x-auto rounded-xl bg-void/60 p-4 leading-relaxed text-peacock-300">{`intent   transfer_money  0.9999
amount   40000
payee    Sunita Sharma  ← "mom"`}</pre>
      </div>
    ),
  },
  {
    name: "Decide", tech: "Dialogue manager · frames, slots, policies",
    body: "Nova keeps a frame for the task, asks only for what's missing, and applies bank rules: saved payee, enough balance, daily limit, and an OTP above ₹25,000.",
    panel: (
      <ul className="space-y-2 text-sm">
        {[["payee", "Sunita Sharma", true], ["amount", "₹40,000", true], ["balance", "sufficient", true], ["daily limit", "₹1.6 L left", true], ["step-up OTP", "required", false]].map(([k, v, ok]) => (
          <li key={String(k)} className="flex items-center justify-between rounded-xl bg-void/60 px-4 py-3">
            <span className="text-mist">{k}</span>
            <span className={`flex items-center gap-2 ${ok ? "text-ivory" : "text-marigold-400"}`}>{v}<span className={`h-2 w-2 rounded-full ${ok ? "bg-peacock-400" : "bg-marigold-500"}`} /></span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    name: "Act", tech: "Core banking API · mock ledger",
    body: "Only after you confirm, and verify the OTP, does Nova call the core-banking layer. It posts the debit and returns a reference number.",
    panel: (
      <pre className="overflow-x-auto rounded-xl bg-void/60 p-5 font-mono text-[13px] leading-relaxed text-ivory/85">{`POST /cbs/transfers
{ "from": "SB-XX4821",
  "to":   "SBI-XX0452",
  "amount": 40000, "mode": "IMPS" }

201 Created
{ "reference": "NXB504201173" }`}</pre>
    ),
  },
  {
    name: "Respond", tech: "NLG · dialogue acts → words + cards",
    body: "The result becomes a dialogue act. NLG picks a phrasing, formats money the Indian way, personalises it and attaches a receipt card.",
    panel: (
      <div className="space-y-4">
        <p className="rounded-2xl rounded-bl-md bg-peacock-700 px-5 py-4 text-ivory">Done! ₹40,000 sent to Sunita Sharma. Reference NXB504201173. Your new balance is ₹3,22,528.</p>
        <div className="flex flex-wrap gap-2 text-xs text-mist">{["act: transfer_done", "variant 1 of 2", "en-IN money", "card: receipt"].map((t) => <span key={t} className="rounded-full px-3 py-1.5 ring-1 ring-edge">{t}</span>)}</div>
      </div>
    ),
  },
];

export function Pipeline() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    registerGSAP();
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const t = track.current!;
      const distance = () => t.scrollWidth - window.innerWidth;
      const tween = gsap.to(t, {
        x: () => -distance(), ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + distance(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      gsap.to(root.current!.querySelector(".js-progress"), { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + distance(), scrub: true } });
      // each panel's content lifts in as it slides into view
      gsap.utils.toArray<HTMLElement>(root.current!.querySelectorAll(".js-panel")).forEach((p) => {
        gsap.from(p.querySelectorAll(".js-in"), { y: 60, opacity: 0, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: p, containerAnimation: tween, start: "left 80%", end: "left 35%", scrub: true } });
      });
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section id="how" ref={root} className="relative overflow-hidden bg-abyss">
      <div className="lg:flex lg:h-[100svh] lg:flex-col lg:justify-center">
        <div className="mx-auto w-full max-w-[1400px] px-5 pt-28 sm:px-8 lg:pt-0">
          <p className="text-[15px] text-mist">How Nova works</p>
          <SplitText as="h2" text="What happens between your words and your money" className="mt-4 max-w-4xl font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[1] tracking-[-0.025em] text-ivory" />
          <div className="mt-8 hidden h-px w-full max-w-md bg-edge lg:block"><div className="js-progress h-full origin-left scale-x-0 bg-marigold-500" /></div>
        </div>
        <div ref={track} className="mt-12 flex flex-col gap-6 px-5 pb-28 sm:px-8 lg:w-max lg:flex-row lg:gap-8 lg:pb-0 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-[20vw]">
          {STAGES.map((s, i) => (
            <article key={s.name} className="js-panel grid shrink-0 gap-8 rounded-[28px] border border-edge bg-surface/70 p-7 sm:p-10 lg:w-[min(68vw,980px)] lg:grid-cols-[1fr_1.1fr]">
              <div className="js-in">
                <p className="font-mono text-sm text-marigold-500">Stage {i + 1} of 4</p>
                <h3 className="mt-3 font-serif text-5xl text-ivory sm:text-6xl">{s.name}</h3>
                <p className="mt-2 text-sm text-mist">{s.tech}</p>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/80">{s.body}</p>
              </div>
              <div className="js-in self-center">{s.panel}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
