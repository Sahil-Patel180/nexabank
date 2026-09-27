// Infinite ribbon of real requests Nova understands (CSS transform loop, pauses on hover).
const ASKS = ["send 2k to Rohan", "what did I spend on Swiggy last month", "EMI for 20 lakh over 15 years", "I lost my debit card", "ATM in Chennai", "pay my electricity bill", "am I eligible for a car loan", "transfer 40k to mom", "FD rates for senior citizens", "talk to a human"];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {ASKS.map((a) => (
        <span key={a} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-serif text-[clamp(2rem,4.2vw,4rem)] italic leading-none text-ivory/90">“{a}”</span>
          <svg width="22" height="26" viewBox="0 0 32 32" aria-hidden className="shrink-0"><ellipse cx="16" cy="17" rx="12" ry="14" fill="#0f5d6c" /><ellipse cx="16" cy="19" rx="3.6" ry="4.4" fill="#f2a93b" /></svg>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <section aria-label="Things you can ask Nova" className="marquee relative overflow-hidden border-y border-edge bg-abyss py-10">
      <div className="marquee-track"><Row /><Row /></div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-abyss to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-abyss to-transparent" />
    </section>
  );
}
