// Shared motion vocabulary for GSAP (mirrors the CSS custom properties in globals.css)
"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const EASE = {
  out: "expo.out",          // ≈ cubic-bezier(0.16, 1, 0.3, 1)   entrances
  inOut: "power4.inOut",    // ≈ cubic-bezier(0.76, 0, 0.24, 1)  curtains
  spring: "back.out(1.7)",  // ≈ cubic-bezier(0.34, 1.56, 0.64, 1) pops
  elastic: "elastic.out(1, 0.35)", // magnetic return
} as const;

export const DUR = { fast: 0.18, base: 0.42, slow: 0.9, reveal: 1.2 } as const;

let registered = false;
export function registerGSAP() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE.out, duration: DUR.slow });
  registered = true;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fired once the preloader curtain has opened; hero choreography waits for it. */
export const PRELOAD_DONE = "nexa:preload-done";
export function onPreloadDone(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  if (document.documentElement.classList.contains("loaded")) { cb(); return () => {}; }
  window.addEventListener(PRELOAD_DONE, cb, { once: true });
  return () => window.removeEventListener(PRELOAD_DONE, cb);
}

export { gsap, ScrollTrigger };
