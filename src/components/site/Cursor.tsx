"use client";
// Two-part follower: a dot that tracks 1:1 and a ring with inertia.
// Grows over anything interactive; shows a label for [data-cursor="Label"].
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = root.current!, dot = el.querySelector(".cursor__dot")!, ring = el.querySelector(".cursor__ring")!, lab = label.current!;
    document.documentElement.classList.add("has-cursor");
    gsap.set([dot, ring, lab], { x: -100, y: -100 });
    const dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" }), dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    const lx = gsap.quickTo(lab, "x", { duration: 0.45, ease: "power3" }), ly = gsap.quickTo(lab, "y", { duration: 0.45, ease: "power3" });

    const move = (e: PointerEvent) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); lx(e.clientX); ly(e.clientY); };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor], input, textarea, label");
      el.classList.toggle("is-hover", !!t && !t.dataset.cursor);
      const text = t?.dataset.cursor;
      el.classList.toggle("has-label", !!text);
      if (text) lab.textContent = text;
    };
    const down = () => el.classList.add("is-down"), up = () => el.classList.remove("is-down");
    const leave = () => gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 }), enter = () => gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 });
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", down); window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave); document.documentElement.addEventListener("pointerenter", enter);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move); document.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave); document.documentElement.removeEventListener("pointerenter", enter);
    };
  }, []);

  return (
    <div ref={root} className="cursor" aria-hidden>
      <span className="cursor__ring" />
      <span className="cursor__dot" />
      <span ref={label} className="cursor__label" />
    </div>
  );
}
