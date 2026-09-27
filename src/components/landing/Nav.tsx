"use client";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import { EASE, ScrollTrigger, gsap, onPreloadDone, prefersReducedMotion, registerGSAP } from "@/lib/motion";
import { Magnetic } from "../site/Magnetic";
import { Logo } from "../ui/Logo";

export function Nav() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    registerGSAP();
    const el = ref.current!;
    if (!prefersReducedMotion()) {
      gsap.set(el, { yPercent: -100, autoAlpha: 0 });
      onPreloadDone(() => gsap.to(el, { yPercent: 0, autoAlpha: 1, duration: 1, ease: EASE.out, delay: 0.5 }));
    }
    // hide on scroll down, reveal on scroll up; frosted once past the hero top
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        el.dataset.solid = y > 40 ? "1" : "0";
        if (prefersReducedMotion()) return;
        gsap.to(el, { yPercent: self.direction === 1 && y > 500 ? -110 : 0, duration: 0.6, ease: EASE.out, overwrite: "auto" });
      },
    });
  });
  return (
    <header ref={ref} data-solid="0" className="group/nav fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-500 data-[solid=1]:bg-void/70 data-[solid=1]:backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 sm:px-8" aria-label="Main">
        <Logo light />
        <div className="hidden items-center gap-9 text-[15px] text-mist md:flex">
          <a href="#how" className="link-draw pb-0.5 hover:text-ivory">How it works</a>
          <a href="#ask" className="link-draw pb-0.5 hover:text-ivory">What to ask</a>
          <a href="#security" className="link-draw pb-0.5 hover:text-ivory">Security</a>
          <a href="#numbers" className="link-draw pb-0.5 hover:text-ivory">The model</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost hidden h-11 px-5 text-sm sm:inline-flex">Sign in</Link>
          <Magnetic strength={0.25}><Link href="/login" className="btn btn-primary h-11 px-5 text-sm">Open NetBanking</Link></Magnetic>
        </div>
      </nav>
    </header>
  );
}
