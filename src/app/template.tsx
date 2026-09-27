"use client";
// Route transition: a void-coloured curtain lifts off every new page
// (the landing page has its own preloader, so it skips this).
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { EASE, gsap, prefersReducedMotion, registerGSAP } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const curtain = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const skip = path === "/";
  useGSAP(() => {
    registerGSAP();
    if (skip || !curtain.current) return;
    if (prefersReducedMotion()) { gsap.set(curtain.current, { autoAlpha: 0 }); return; }
    gsap.fromTo(curtain.current, { scaleY: 1 }, { scaleY: 0, duration: 0.9, ease: EASE.inOut, delay: 0.05, onComplete: () => gsap.set(curtain.current, { display: "none" }) });
  }, [path]);
  return (
    <>
      {!skip && <div ref={curtain} className="route-curtain" aria-hidden />}
      {children}
    </>
  );
}
