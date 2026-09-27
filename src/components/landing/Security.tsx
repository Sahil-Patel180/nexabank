import { BadgeCheck, KeyRound, LockKeyhole, Timer, UserCheck } from "lucide-react";
import { Reveal, SplitText } from "../site/Reveal";

const GUARDS = [
  [BadgeCheck, "Confirm before every payment", "Nothing moves until you approve a summary of exactly what will happen."],
  [KeyRound, "OTP above ₹25,000", "High-value transfers need a one-time password. Three wrong tries cancel them."],
  [UserCheck, "Saved payees only", "New beneficiaries can't be paid from chat, closing a common social-engineering route."],
  [Timer, "Daily limits, short sessions", "A ₹2 lakh daily cap, and sessions that end after 30 minutes."],
  [LockKeyhole, "Hardened sign-in", "scrypt password hashes, a signed httpOnly session cookie, and lock-out after 5 failures."],
] as const;

export function Security() {
  return (
    <section id="security" className="relative bg-abyss py-32 sm:py-40">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        {/* sticky column (plain CSS sticky; works with Lenis) */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-[15px] text-mist">Security</p>
          <SplitText as="h2" lines={["Friendly to talk to.", "Strict about money."]} className="mt-4 font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[1] tracking-[-0.025em] text-ivory" />
          <p className="mt-6 max-w-sm text-mist">Understanding language is the part most likely to go wrong, so Nova never acts on a guess. The dialogue manager enforces the checks a teller would.</p>
        </div>
        <Reveal as="div" className="divide-y divide-edge border-y border-edge" stagger={0.12}>
          {GUARDS.map(([Icon, t, d]) => (
            <div key={t} data-fade className="group flex gap-6 py-8">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-marigold-500 ring-1 ring-edge transition-[background-color,color] duration-500 group-hover:bg-marigold-500 group-hover:text-void"><Icon size={20} /></span>
              <div>
                <h3 className="font-serif text-3xl text-ivory">{t}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-mist">{d}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
