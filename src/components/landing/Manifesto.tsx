import { Reveal, ScrubText } from "../site/Reveal";

export function Manifesto() {
  return (
    <section className="relative bg-void py-32 sm:py-44">
      <Reveal className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-[220px_1fr]">
        <p data-fade className="pt-3 text-[15px] text-mist">Why Nova</p>
        <ScrubText
          className="font-serif text-[clamp(2rem,4.4vw,4.4rem)] leading-[1.08] tracking-[-0.02em] text-ivory"
          text="Most banking apps make you learn the bank's language. Nova learns yours — amounts in lakh, nicknames like mom, dates like last month — and still checks everything a teller would before a single rupee moves."
        />
      </Reveal>
    </section>
  );
}
