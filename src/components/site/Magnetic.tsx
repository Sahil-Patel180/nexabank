"use client";
// Pulls its child toward the pointer (strength = fraction of the offset),
// then springs back elastically on leave. Transform-only → 60fps.
import { useEffect, useRef } from "react";
import { EASE, gsap, prefersReducedMotion } from "@/lib/motion";

export function Magnetic({ children, strength = 0.35, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" }), yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * strength); yTo((e.clientY - (r.top + r.height / 2)) * strength); };
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: EASE.elastic, overwrite: true });
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [strength]);
  return <span ref={ref} className={`inline-block will-change-transform ${className}`}>{children}</span>;
}
