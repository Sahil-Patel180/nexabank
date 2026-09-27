"use client";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import metrics from "@nlu/model/metrics.json";
import { ScrollTrigger, gsap, prefersReducedMotion, registerGSAP } from "@/lib/motion";
import { SplitText } from "../site/Reveal";

const m = metrics as { accuracy: number; macroF1: number; trainSize: number; testSize: number; features: number };
const STATS = [
  { v: m.accuracy * 100, d: 1, s: "%", label: `accuracy on ${m.testSize} hand-written test phrases the model never saw` },
  { v: 25, d: 0, s: "", label: "intents recognised across eight banking domains" },
  { v: m.trainSize, d: 0, s: "", label: "training utterances generated from a template grammar" },
  { v: m.features, d: 0, s: "", label: "word and character features, int8-quantised" },
];
const fmt = (n: number, d: number) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

export function Metrics() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    registerGSAP();
    const nums = ref.current!.querySelectorAll<HTMLElement>("[data-count]");
    if (prefersReducedMotion()) return;
    nums.forEach((el) => {
      const to = Number(el.dataset.count), d = Number(el.dataset.dec);
      const o = { v: 0 };
      el.textContent = fmt(0, d) + (el.dataset.suffix ?? "");
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true,
        onEnter: () => gsap.to(o, { v: to, duration: 2, ease: "expo.out", onUpdate: () => { el.textContent = fmt(o.v, d) + (el.dataset.suffix ?? ""); } }) });
    });
    gsap.from(ref.current!.querySelectorAll(".js-line"), { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "power4.inOut", stagger: 0.1, scrollTrigger: { trigger: ref.current, start: "top 75%", once: true } });
  }, { scope: ref });

  return (
    <section id="numbers" ref={ref} className="bg-void py-32 sm:py-40">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SplitText as="h2" text="Trained here, measured honestly" className="max-w-3xl font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[1] tracking-[-0.025em] text-ivory" />
        <p className="mt-6 max-w-xl text-mist">No third-party AI API. The model is trained from scratch with <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-ivory">npm run train</code> and tested on phrases kept out of training.</p>
        <dl className="mt-20 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="js-line h-px bg-edge"><div className="h-px w-10 bg-marigold-500" /></div>
              {/* fixed min-width via tabular figures keeps the count-up from reflowing */}
              <dt className="num mt-6 font-serif text-[clamp(3.5rem,6vw,5.5rem)] leading-none text-ivory" data-count={s.v} data-dec={s.d} data-suffix={s.s}>{fmt(s.v, s.d)}{s.s}</dt>
              <dd className="mt-4 max-w-[16rem] text-sm leading-relaxed text-mist">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
