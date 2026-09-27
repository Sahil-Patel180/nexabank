"use client";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import { EASE, gsap, prefersReducedMotion, registerGSAP } from "@/lib/motion";
import { Magnetic } from "../site/Magnetic";
import { SplitText } from "../site/Reveal";
import { ParseDemo } from "./ParseDemo";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    registerGSAP();
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(ref);
    // start states are applied immediately (behind the preloader), never at reveal time
    gsap.set(q("[data-fade]"), { y: 24, opacity: 0 });
    gsap.set(q(".js-demo"), { yPercent: 12, opacity: 0, rotateX: 8 });
    gsap.set(q(".js-rule"), { scaleX: 0 });
    const intro = () => gsap.timeline()
      .to(q(".js-rule"), { scaleX: 1, duration: 1.4, ease: EASE.inOut }, 0.2)
      .to(q(".js-demo"), { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.6, ease: EASE.out }, 0.4)
      .to(q("[data-fade]"), { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: EASE.out }, 0.55);
    if (document.documentElement.classList.contains("loaded")) intro();
    else window.addEventListener("nexa:preload-done:opening", intro, { once: true });
    // ambient light: slow drift + scroll parallax (transform only)
    gsap.to(q(".js-glow-a"), { x: -80, y: 60, duration: 14, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(q(".js-glow-b"), { x: 70, y: -40, duration: 18, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(q(".js-parallax"), { yPercent: -18, ease: "none", scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(q(".js-headline"), { yPercent: 22, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true } });
    return () => window.removeEventListener("nexa:preload-done:opening", intro);
  }, { scope: ref });

  return (
    <section ref={ref} className="grain relative overflow-hidden bg-void pb-20 pt-32 sm:pt-40 lg:min-h-[100svh]">
      <div aria-hidden className="js-glow-a glow -right-40 -top-56 h-[720px] w-[720px] bg-[radial-gradient(circle,rgba(43,192,180,0.34),transparent_62%)]" />
      <div aria-hidden className="js-glow-b glow -bottom-72 -left-40 h-[620px] w-[620px] bg-[radial-gradient(circle,rgba(242,169,59,0.2),transparent_62%)]" />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <p data-fade className="mb-8 flex items-center gap-3 text-[15px] text-mist">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-peacock-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-peacock-400" /></span>
          Meet Nova, NexaBank&apos;s assistant
        </p>
        <div className="js-headline will-change-transform">
          <SplitText as="h1" trigger="preload" lines={["Banking you", "can just ask for."]} stagger={0.07} delay={0.15}
            className="font-serif text-[clamp(3.4rem,10.5vw,10.5rem)] font-normal leading-[0.92] tracking-[-0.035em] text-ivory" />
        </div>
        <div className="js-rule mt-12 h-px origin-left bg-edge" />

        <div className="mt-10 grid items-start gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p data-fade className="max-w-md text-lg leading-relaxed text-mist">
              Type the way you talk — “send 2k to Rohan”, “what did I spend on fuel in August”. Nova finds the amounts, people and dates, checks the rules, and gets it done.
            </p>
            <div data-fade className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic><Link href="/login" data-cursor="Try it" className="btn btn-primary h-14 px-7 text-[15px]">Try Nova with a demo account</Link></Magnetic>
              <a href="#how" className="btn btn-ghost h-14 px-7 text-[15px]">See how it works</a>
            </div>
            <p data-fade className="mt-10 max-w-sm text-sm text-mist/70">NexaBank is a fictional bank built for a learning project. No real money moves.</p>
          </div>
          <div className="js-parallax" style={{ perspective: 1400 }}>
            <div className="js-demo"><ParseDemo /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
