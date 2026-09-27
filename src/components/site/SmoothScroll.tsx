"use client";
// Lenis inertia scrolling driven by GSAP's ticker so ScrollTrigger and
// the scroll position always agree (no double RAF loops, no jitter).
import Lenis from "lenis";
import { useEffect } from "react";
import { ScrollTrigger, gsap, prefersReducedMotion, registerGSAP } from "@/lib/motion";

let instance: Lenis | null = null;
export const getLenis = () => instance;

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerGSAP();
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, touchMultiplier: 1.4 });
    instance = lenis;
    if (document.documentElement.classList.contains("is-loading")) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // in-page anchors scroll through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (el) { e.preventDefault(); lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.6 }); }
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); gsap.ticker.remove(tick); lenis.destroy(); instance = null; };
  }, []);
  return <>{children}</>;
}
