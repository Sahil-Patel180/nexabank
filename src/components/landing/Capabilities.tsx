"use client";
// Capability cards: scale + lift on hover, cursor-tracked light, inner parallax art.
import { ArrowLeftRight, CreditCard, Headset, Landmark, MapPin, PieChart, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Reveal, SplitText } from "../site/Reveal";

function Card({ icon: Icon, title, body, asks, wide = false }: { icon: typeof PieChart; title: string; body: string; asks: string[]; wide?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <Link ref={ref} href="/login" onPointerMove={onMove} data-fade data-cursor="Ask Nova"
      className={`group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] border border-edge bg-surface p-8 transition-[transform,border-color] duration-700 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-1.5 hover:scale-[1.015] hover:border-peacock-600 ${wide ? "md:col-span-2" : ""}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(420px circle at var(--x) var(--y), rgba(43,192,180,0.16), transparent 60%)" }} />
      <div className="relative">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-raised text-marigold-500 transition-transform duration-700 [transition-timing-function:var(--ease-spring)] group-hover:rotate-[-8deg] group-hover:scale-110"><Icon size={22} /></span>
        <h3 className="mt-8 font-serif text-[2.2rem] leading-none text-ivory">{title}</h3>
        <p className="mt-4 max-w-md leading-relaxed text-mist">{body}</p>
      </div>
      <div className="relative mt-8 flex flex-wrap gap-2">
        {asks.map((a, i) => (
          <span key={a} className="translate-y-0 rounded-full bg-void/60 px-3.5 py-1.5 text-sm text-ivory/85 ring-1 ring-edge transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-1" style={{ transitionDelay: `${i * 50}ms` }}>“{a}”</span>
        ))}
      </div>
    </Link>
  );
}

export function Capabilities() {
  return (
    <section id="ask" className="bg-void py-32 sm:py-40">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
          <SplitText as="h2" text="Ask for it in your own words" className="max-w-3xl font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[1] tracking-[-0.025em] text-ivory" />
          <p className="text-mist">25 intents across everyday banking. Hover a card to see what people actually type.</p>
        </div>
        <Reveal className="mt-16 grid gap-5 md:grid-cols-3" stagger={0.1}>
          <Card wide icon={ArrowLeftRight} title="Send money" body="Nova asks for anything missing, shows exactly what will happen, and adds an OTP step above ₹25,000." asks={["send 2k to Rohan", "pay my landlord 18,000", "transfer 1.5 lakh to mom"]} />
          <Card icon={PieChart} title="Spending insights" body="Category and merchant breakdowns for any period." asks={["Swiggy last month", "fuel in August"]} />
          <Card icon={CreditCard} title="Card controls" body="Block a lost card in one sentence; check limits and due dates." asks={["I lost my debit card"]} />
          <Card icon={Landmark} title="Loans & EMIs" body="EMI maths, eligibility from income and credit score, what's left to pay." asks={["EMI for 25 lakh for 20 years"]} />
          <Card icon={MapPin} title="Branches & ATMs" body="Addresses, IFSC codes and hours across seven cities." asks={["ATM in Chennai"]} />
          <Card icon={ShieldAlert} title="Fraud help" body="Report a transaction you didn't make: priority dispute, card blocking and the 1930 cybercrime helpline." asks={["I think I was scammed"]} />
          <Card wide icon={Headset} title="A person, when you need one" body="Say “talk to a human” at any point. Nova opens a ticket and books a call-back, so there are no dead ends." asks={["talk to a human", "raise a complaint"]} />
        </Reveal>
      </div>
    </section>
  );
}
