"use client";
// Text & block reveal primitives.
//  <SplitText>  words slide up out of clip masks (on scroll or after preload)
//  <ScrubText>  words brighten as you scroll through the paragraph
//  <Reveal>     block fades/lifts in; data-speed children get parallax
import { useGSAP } from "@gsap/react";
import { createElement, useRef } from "react";
import { DUR, EASE, ScrollTrigger, gsap, onPreloadDone, prefersReducedMotion, registerGSAP } from "@/lib/motion";

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div";

function words(text: string, cls = "") {
  return text.split(/(\s+)/).map((w, i) =>
    /^\s+$/.test(w) ? w : <span key={i} className="split-mask"><span className={`split-word ${cls}`}>{w}</span></span>,
  );
}

export function SplitText({ as = "h2", text, className = "", lines, delay = 0, stagger = 0.06, trigger = "scroll" }:
  { as?: Tag; text?: string; lines?: string[]; className?: string; delay?: number; stagger?: number; trigger?: "scroll" | "preload" }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    registerGSAP();
    if (prefersReducedMotion()) return;
    const targets = ref.current!.querySelectorAll(".split-word");
    // CSS start state is translate3d(0,110%,0); hand it to GSAP as yPercent so no px residue remains
    gsap.set(targets, { y: 0, yPercent: 110 });
    let played = false;
    const play = () => { if (played) return; played = true; gsap.to(targets, { yPercent: 0, y: 0, duration: DUR.reveal, ease: EASE.out, stagger, delay }); };
    if (trigger === "preload") { const off = onPreloadDone(play); const early = () => play(); window.addEventListener("nexa:preload-done:opening", early, { once: true }); return () => { off(); window.removeEventListener("nexa:preload-done:opening", early); }; }
    ScrollTrigger.create({ trigger: ref.current, start: "top 88%", once: true, onEnter: play });
  }, { scope: ref });
  const content = lines ? lines.map((l, i) => <span key={i} className="block">{words(l)}</span>) : words(text ?? "");
  return createElement(as, { ref, className }, content);
}

export function ScrubText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(() => {
    registerGSAP();
    if (prefersReducedMotion()) return;
    gsap.to(ref.current!.querySelectorAll("[data-scrub-word]"), {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
    });
  }, { scope: ref });
  return (
    <p ref={ref} className={className}>
      {text.split(/(\s+)/).map((w, i) => (/^\s+$/.test(w) ? w : <span key={i} data-scrub-word>{w}</span>))}
    </p>
  );
}

export function Reveal({ children, className = "", as = "div", stagger = 0.08 }: { children: React.ReactNode; className?: string; as?: Tag; stagger?: number }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    registerGSAP();
    if (prefersReducedMotion()) return;
    const items = ref.current!.querySelectorAll("[data-fade]");
    if (items.length) gsap.to(items, { opacity: 1, y: 0, duration: DUR.slow, ease: EASE.out, stagger, scrollTrigger: { trigger: ref.current, start: "top 85%", once: true } });
    ref.current!.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
      const speed = Number(el.dataset.speed);
      gsap.fromTo(el, { yPercent: -speed * 50 }, { yPercent: speed * 50, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }, { scope: ref });
  return createElement(as, { ref, className }, children);
}
