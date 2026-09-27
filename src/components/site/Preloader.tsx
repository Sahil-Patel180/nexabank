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
    const ringEl = q(".js-ring")[0]; // SVG circle; GSAP only needs an Element
    const CIRC = 2 * Math.PI * 46;
    const render = () => {
      numEl.textContent = String(Math.round(counter.v)).padStart(3, "0");
      gsap.set(barEl, { scaleX: counter.v / 100 });
      gsap.set(ringEl, { strokeDashoffset: CIRC * (1 - counter.v / 100) });
    };

    // logo intro: ovals bloom outward-in, core breathes, orbit turns
    gsap.fromTo(q(".js-eye"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: EASE.spring, stagger: 0.14 });
    gsap.fromTo(q(".js-logo-word"), { yPercent: 110 }, { yPercent: 0, duration: 1, ease: EASE.out, delay: 0.45 });
    const breathe = gsap.to(q(".js-core"), { scale: 1.18, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1 });
    const orbit = gsap.to(q(".js-orbit"), { rotation: 360, duration: 9, ease: "none", repeat: -1 });

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
      gsap.timeline({ onComplete: () => { breathe.kill(); orbit.kill(); finish(); }, delay: 0.15 })
        .to(q(".js-logo"), { scale: 1.25, autoAlpha: 0, duration: 0.7, ease: "power3.in" })
        .to(q(".preloader__content"), { autoAlpha: 0, y: -20, duration: 0.5, ease: "power2.in" }, "<0.1")
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
          <span>Nova · conversational banking</span>
          <span>Loading your bank</span>
        </div>
        {/* centred animated mark: three blooming ovals, breathing core, orbit + real progress ring */}
        <div className="js-logo pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <svg viewBox="0 0 100 100" className="h-[clamp(8rem,20vw,13rem)] w-[clamp(8rem,20vw,13rem)] overflow-visible" aria-hidden>
            <g className="js-orbit [transform-box:view-box] origin-center">
              <circle cx="50" cy="50" r="49" fill="none" stroke="#1a3a44" strokeWidth="0.6" strokeDasharray="1 4" />
              <circle cx="50" cy="1" r="1.6" fill="#2bc0b4" />
            </g>
            <circle cx="50" cy="50" r="46" fill="none" stroke="#1a3a44" strokeWidth="1.2" />
            <circle className="js-ring" cx="50" cy="50" r="46" fill="none" stroke="#f2a93b" strokeWidth="1.2" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46} strokeDashoffset={2 * Math.PI * 46} transform="rotate(-90 50 50)" />
            <ellipse className="js-eye [transform-box:fill-box] origin-center" cx="50" cy="52" rx="27" ry="32" fill="#0f5d6c" />
            <ellipse className="js-eye [transform-box:fill-box] origin-center" cx="50" cy="54.5" rx="17" ry="20.5" fill="#061a20" />
            <ellipse className="js-eye js-core [transform-box:fill-box] origin-center" cx="50" cy="57" rx="8.2" ry="10" fill="#f2a93b" />
          </svg>
          <div className="mt-6 overflow-hidden"><span className="js-logo-word block font-serif text-3xl text-ivory sm:text-4xl">NexaBank</span></div>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div className="overflow-hidden pb-[0.12em] font-serif text-[clamp(2.5rem,7vw,6rem)] leading-none">
            {/* invisible sizer = longest word, so no word is ever clipped */}
            <div className="relative whitespace-nowrap">
              <span className="invisible">{WORDS.reduce((a, b) => (b.length > a.length ? b : a))}</span>
              {WORDS.map((w) => <span key={w} className="js-word absolute left-0 top-0 translate-y-[110%]">{w}</span>)}
            </div>
          </div>
          <span className="js-count num font-mono text-[clamp(2.5rem,7vw,6rem)] leading-none text-marigold-500">000</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-edge"><div className="js-bar h-full origin-left scale-x-0 bg-marigold-500" /></div>
      </div>
    </div>
  );
}
