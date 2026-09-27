"use client";
import { motion, useMotionValueEvent, useScroll, type Variants } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "../ui/Logo";
import { ParseDemo } from "./ParseDemo";

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 400);
    setSolid(y > 40);
  });
  return (
    <motion.header animate={{ y: hidden ? -90 : 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? "bg-peacock-950/85 backdrop-blur-md" : ""}`}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo light />
        <div className="hidden items-center gap-8 text-sm text-white/75 md:flex">
          <a href="#how" className="hover:text-white">How Nova works</a>
          <a href="#features" className="hover:text-white">What you can ask</a>
          <a href="#security" className="hover:text-white">Security</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm text-white/85 hover:text-white">Sign in</Link>
          <Link href="/login" className="rounded-full bg-marigold-500 px-4 py-2 text-sm font-semibold text-peacock-950 transition hover:bg-marigold-400">Open NetBanking</Link>
        </div>
      </nav>
    </motion.header>
  );
}

const rise: Variants = { hidden: { opacity: 0, y: 28 }, show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }) };

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-peacock-950 pb-24 pt-32 text-white sm:pt-40">
      {/* slow marigold/peacock glow — the only ambient motion on the page */}
      <motion.div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(22,147,154,0.45),transparent_65%)] blur-2xl"
        animate={{ x: [0, -60, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="pointer-events-none absolute -bottom-52 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(242,169,59,0.22),transparent_65%)] blur-2xl"
        animate={{ x: [0, 50, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.p custom={0} variants={rise} initial="hidden" animate="show" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm text-peacock-300 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-marigold-500" /> Meet Nova, your banking assistant
          </motion.p>
          <h1 className="font-display text-[2.75rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[4.4rem]">
            {["Banking you can", "just ask for."].map((l, i) => (
              <motion.span key={l} custom={i + 1} variants={rise} initial="hidden" animate="show" className="block">{l}</motion.span>
            ))}
          </h1>
          <motion.p custom={3} variants={rise} initial="hidden" animate="show" className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
            Type the way you talk — “send 2k to Rohan”, “what did I spend on fuel in August”. Nova picks out the amounts, people and dates, checks the rules, and gets it done.
          </motion.p>
          <motion.div custom={4} variants={rise} initial="hidden" animate="show" className="mt-9 flex flex-wrap gap-3">
            <Link href="/login" className="group relative overflow-hidden rounded-full bg-marigold-500 px-6 py-3.5 font-semibold text-peacock-950 transition hover:shadow-[0_10px_40px_-8px_rgba(242,169,59,0.7)]">
              <span className="relative z-10">Try Nova with a demo account</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <a href="#how" className="rounded-full px-6 py-3.5 font-medium text-white ring-1 ring-white/25 transition hover:bg-white/5">See how it works</a>
          </motion.div>
          <motion.p custom={5} variants={rise} initial="hidden" animate="show" className="mt-8 text-sm text-white/45">
            NexaBank is a fictional bank built for a learning project. No real money moves.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, y: 40, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.45, duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ perspective: 1200 }}>
          <ParseDemo />
        </motion.div>
      </div>
    </section>
  );
}
