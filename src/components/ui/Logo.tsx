import Link from "next/link";
// Mark: a stylised peacock-feather "eye" — concentric ovals, marigold core.
export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="NexaBank home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <ellipse cx="16" cy="17" rx="12" ry="14" fill={light ? "#16939a" : "#0f5d6c"} />
        <ellipse cx="16" cy="18" rx="7.5" ry="9" fill={light ? "#0a3140" : "#d7f0ee"} />
        <ellipse cx="16" cy="19" rx="3.6" ry="4.4" fill="#f2a93b" />
      </svg>
      <span className={`font-display text-[1.35rem] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>NexaBank</span>
    </Link>
  );
}
