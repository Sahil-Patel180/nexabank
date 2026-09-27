"use client";
import Link from "next/link";
import { Magnetic } from "../site/Magnetic";
import { Reveal, SplitText } from "../site/Reveal";
import { Logo } from "../ui/Logo";

export function Closing() {
  return (
    <>
      <section className="grain relative overflow-hidden bg-abyss py-36 sm:py-48">
        <div aria-hidden className="glow left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(242,169,59,0.18),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-start gap-14 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SplitText as="h2" lines={["Say hello", "to Nova."]} className="font-serif text-[clamp(3.4rem,10vw,10rem)] leading-[0.92] tracking-[-0.035em] text-ivory" />
            <Reveal><p data-fade className="mt-8 max-w-md text-lg text-mist">Two demo customers are ready with accounts, cards, a home loan and three months of transactions.</p></Reveal>
          </div>
          <Magnetic strength={0.45}>
            <Link href="/login" data-cursor="Sign in" className="btn btn-primary h-44 w-44 text-lg sm:h-52 sm:w-52">Sign in</Link>
          </Magnetic>
        </div>
      </section>
      <footer className="bg-void px-5 pb-10 pt-20 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col justify-between gap-10 border-b border-edge pb-12 md:flex-row">
            <Logo light />
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-[15px] text-mist">
              <a href="#how" className="link-draw w-fit hover:text-ivory">How it works</a>
              <Link href="/login" className="link-draw w-fit hover:text-ivory">Sign in</Link>
              <a href="#ask" className="link-draw w-fit hover:text-ivory">What to ask</a>
              <a href="#security" className="link-draw w-fit hover:text-ivory">Security</a>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-3 text-sm text-mist/70 sm:flex-row">
            <p>NexaBank and Nova are fictional — an ILP learning project on NLU, NLG and conversational AI.</p>
            <p>Next.js · GSAP · Lenis · in-house NLU/NLG</p>
          </div>
        </div>
      </footer>
    </>
  );
}
