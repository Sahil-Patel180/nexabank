"use client";
// Count-up preloader tied to real readiness (fonts + window load), then a
// split-curtain reveal. It is rendered in the server HTML, so content is
// covered from the first paint; the page underneath is fully laid out,
// which means zero layout shift when the curtain opens.
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { EASE, PRELOAD_DONE, gsap, prefersReducedMotion, registerGSAP } from "@/lib/motion";
import { getLenis } from "./SmoothScroll";

const WORDS = ["Understand", "Decide", "Act", "Respond"];

function finish() {
  const html = document.documentElement;
  html.classList.add("loaded");
  html.classList.remove("is-loading");
  getLenis()?.start();
  window.dispatchEvent(new Event(PRELOAD_DONE));
}

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    registerGSAP();
    const html = document.documentElement;
    if (html.classList.contains("loaded")) return; // client-side navigation: already done
    html.classList.add("is-loading");
    getLenis()?.stop();
    window.scrollTo(0, 0);

    if (prefersReducedMotion()) {
      gsap.to(root.current, { autoAlpha: 0, duration: 0.3, delay: 0.2, onComplete: finish });
      return;
    }

    const q = gsap.utils.selector(root);
    const counter = { v: 0 };
    const numEl = q(".js-count")[0] as HTMLElement;
    const barEl = q(".js-bar")[0] as HTMLElement;
    const render = () => { numEl.textContent = String(Math.round(counter.v)).padStart(3, "0"); gsap.set(barEl, { scaleX: counter.v / 100 }); };

    // real readiness signals
    let target = 12;
    const bump = (to: number) => { target = Math.max(target, to); gsap.to(counter, { v: target, duration: 0.9, ease: "power2.out", onUpdate: render, overwrite: true, onComplete: maybeOpen }); };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));
    fonts.then(() => bump(64));
    loaded.then(() => bump(88));
    Promise.all([fonts, loaded, new Promise((r) => setTimeout(r, 1400))]).then(() => bump(100));
    bump(40);

    // cycle the pipeline words while loading
    const words = q(".js-word");
    const cycle = gsap.timeline({ repeat: -1 });
    words.forEach((w) => cycle.fromTo(w, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: EASE.out }).to(w, { yPercent: -110, duration: 0.45, ease: "power3.in" }, "+=0.35"));

    let opened = false;
    function maybeOpen() {
      if (opened || counter.v < 100) return;
      opened = true;
      cycle.kill();
      gsap.timeline({ onComplete: finish, delay: 0.15 })
        .to(q(".preloader__content"), { autoAlpha: 0, y: -20, duration: 0.5, ease: "power2.in" })
        .to(q(".preloader__panel--top"), { yPercent: -100, duration: 1.1, ease: EASE.inOut }, "-=0.1")
        .to(q(".preloader__panel--bottom"), { yPercent: 100, duration: 1.1, ease: EASE.inOut }, "<")
        .add(() => window.dispatchEvent(new Event(PRELOAD_DONE + ":opening")), "<0.35");
    }
  }, { scope: root });

  return (
    <div ref={root} className="preloader" aria-hidden>
      <div className="preloader__panel preloader__panel--top" />
      <div className="preloader__panel preloader__panel--bottom" />
      <div className="preloader__content">
        <div className="flex items-center justify-between text-sm text-mist">
          <span className="font-serif text-2xl text-ivory">NexaBank</span>
          <span>Nova · conversational banking</span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div className="h-[1.1em] overflow-hidden font-serif text-[clamp(2.5rem,7vw,6rem)] leading-none">
            <div className="relative h-[1.1em] w-[6ch]">{WORDS.map((w) => <span key={w} className="js-word absolute left-0 top-0 translate-y-[110%]">{w}</span>)}</div>
          </div>
          <span className="js-count num font-mono text-[clamp(2.5rem,7vw,6rem)] leading-none text-marigold-500">000</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-edge"><div className="js-bar h-full origin-left scale-x-0 bg-marigold-500" /></div>
      </div>
    </div>
  );
}
