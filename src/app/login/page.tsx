"use client";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/ui/Logo";

const DEMO = [
  { name: "Aarav Sharma", login: "aarav@nexabank.demo", note: "Home loan, higher balance" },
  { name: "Priya Menon", login: "priya@nexabank.demo", note: "No loans, KYC due" },
];

function TiltCard() {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 150, damping: 15 });
  const shine = useTransform(mx, [-0.5, 0.5], ["20%", "80%"]);
  return (
    <div className="grid place-items-center" style={{ perspective: 1000 }}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, y: 30, rotateZ: -6 }} animate={{ opacity: 1, y: 0, rotateZ: -4 }} transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative aspect-[1.586] w-[340px] max-w-full overflow-hidden rounded-2xl bg-gradient-to-br from-peacock-600 via-peacock-800 to-peacock-950 p-6 text-white shadow-2xl shadow-black/40 ring-1 ring-white/15">
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: useTransform(shine, (s) => `linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) ${s}, transparent 70%)`) }} />
        <svg className="absolute -bottom-16 -right-12 h-56 w-56 opacity-30" viewBox="0 0 32 32" aria-hidden><ellipse cx="16" cy="17" rx="12" ry="14" fill="#16939a" /><ellipse cx="16" cy="18" rx="7.5" ry="9" fill="#06222b" /><ellipse cx="16" cy="19" rx="3.6" ry="4.4" fill="#f2a93b" /></svg>
        <div className="relative flex h-full flex-col justify-between" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-start justify-between"><span className="font-serif text-2xl">NexaBank</span><span className="text-xs text-white/60">Privé</span></div>
          <div className="h-8 w-11 rounded-md bg-gradient-to-br from-marigold-400 to-marigold-500" />
          <div>
            <p className="num font-mono text-lg tracking-[0.18em]">4821 •••• •••• 9034</p>
            <div className="mt-2 flex justify-between text-xs text-white/70"><span>AARAV SHARMA</span><span>09/30</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/dashboard";
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password }) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setLoading(false);
    if (!res?.ok) { setError(data?.error ?? "Couldn't reach NexaBank. Check your connection and try again."); setShake((s) => s + 1); return; }
    setSuccess(true);
    setTimeout(() => router.push(next.startsWith("/") ? next : "/dashboard"), 750);
  }

  const fill = (l: string) => { setLogin(l); setPassword("Nova@123"); setError(""); };
  const field = "w-full rounded-2xl border border-edge bg-surface px-4 py-3.5 text-ivory outline-none placeholder:text-mist/50 transition-[border-color,box-shadow,background-color] duration-300 [transition-timing-function:var(--ease-out-expo)] hover:border-peacock-700 focus:border-marigold-500 focus:bg-raised focus:shadow-[0_0_0_4px_rgb(242_169_59/0.15)]";
  const rise = (i: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.35 + i * 0.07, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } });

  return (
    <motion.form key={shake} onSubmit={submit} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.45, ease: [0.4, 0, 0.6, 1] }} className="w-full max-w-[400px]" noValidate>
      <motion.h1 {...rise(0)} className="font-serif text-5xl leading-none tracking-tight text-ivory sm:text-6xl">Welcome back</motion.h1>
      <motion.p {...rise(1)} className="mt-4 text-mist">Sign in to NetBanking. Nova is ready when you are.</motion.p>

      <motion.div {...rise(2)}>
        <label className="mt-10 block text-sm text-mist" htmlFor="login">Customer ID or email</label>
        <input id="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="NB1001 or you@email.com" className={`mt-2 ${field}`} />
      </motion.div>

      <motion.div {...rise(3)}>
        <label className="mt-5 block text-sm text-mist" htmlFor="pw">Password</label>
        <div className="relative mt-2">
          <input id="pw" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} pr-12`} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mist transition-colors hover:text-ivory">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && <motion.p role="alert" initial={{ opacity: 0, height: 0, y: -6 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="mt-4 rounded-xl bg-danger/15 px-4 py-2.5 text-sm text-[#f3a29d]">{error}</motion.p>}
      </AnimatePresence>

      <motion.div {...rise(4)}>
        <button disabled={loading || success} className={`btn mt-8 h-14 w-full text-[15px] ${success ? "bg-success text-ivory" : "btn-primary"}`}>
          <AnimatePresence mode="wait" initial={false}>
            {success ? <motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 18 }} className="flex items-center gap-2"><ShieldCheck size={18} /> Signed in</motion.span>
              : loading ? <motion.span key="l" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Verifying</motion.span>
                : <motion.span key="s" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>Sign in</motion.span>}
          </AnimatePresence>
        </button>
      </motion.div>

      <motion.div {...rise(5)} className="mt-12">
        <p className="text-sm text-mist">Use a demo customer</p>
        <div className="mt-3 grid gap-2">
          {DEMO.map((d) => (
            <button type="button" key={d.login} onClick={() => fill(d.login)} className={`group flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-[border-color,background-color,transform] duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 active:scale-[0.98] ${login === d.login ? "border-marigold-500 bg-marigold-500/10" : "border-edge bg-surface hover:border-peacock-600"}`}>
              <span><span className="block text-ivory">{d.name}</span><span className="text-sm text-mist">{d.note}</span></span>
              <span className={`text-xs transition-colors ${login === d.login ? "text-marigold-400" : "text-mist group-hover:text-ivory"}`}>{login === d.login ? "Filled" : "Fill in"}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-mist/80">Password for both: <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-ivory">Nova@123</code></p>
      </motion.div>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-[100svh] bg-void text-ivory lg:grid-cols-[1fr_1.05fr]">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <Logo light />
        <div className="flex flex-1 items-center justify-center py-14">
          <Suspense><LoginForm /></Suspense>
        </div>
        <p className="text-xs text-mist/70">Demo project. NexaBank will never ask for your OTP, PIN or password over chat or phone.</p>
      </section>
      <aside className="grain relative m-3 hidden flex-col justify-between overflow-hidden rounded-[32px] bg-abyss p-12 lg:flex">
        <div aria-hidden className="glow -right-32 -top-32 h-[520px] w-[520px] bg-[radial-gradient(circle,rgba(43,192,180,0.3),transparent_62%)]" />
        <div aria-hidden className="glow -bottom-40 -left-24 h-[460px] w-[460px] bg-[radial-gradient(circle,rgba(242,169,59,0.16),transparent_62%)]" />
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="relative max-w-md font-serif text-4xl leading-[1.1] text-ivory">“Block my debit card.” Done in one line, and confirmed before it happens.</motion.p>
        <div className="relative"><TiltCard /></div>
        <ul className="relative space-y-3 text-sm text-mist">
          {["Session signed and stored in an httpOnly cookie", "Locked for 10 minutes after 5 wrong passwords", "Signed out automatically after 30 minutes"].map((t, i) => (
            <motion.li key={t} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-3"><ShieldCheck size={16} className="text-marigold-500" />{t}</motion.li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
