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
          <div className="flex items-start justify-between"><span className="font-display text-lg font-bold">NexaBank</span><span className="text-xs text-white/60">Privé</span></div>
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
    setTimeout(() => router.push(next.startsWith("/") ? next : "/dashboard"), 700);
  }

  const fill = (l: string) => { setLogin(l); setPassword("Nova@123"); setError(""); };

  return (
    <motion.form key={shake} onSubmit={submit} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} className="w-full max-w-sm" noValidate>
      <h1 className="font-display text-4xl font-bold tracking-tight">Sign in to NetBanking</h1>
      <p className="mt-2 text-slate">Welcome back. Nova is ready when you are.</p>

      <label className="mt-9 block text-sm font-medium" htmlFor="login">Customer ID or email</label>
      <input id="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="NB1001 or you@email.com"
        className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none transition focus:border-peacock-500 focus:ring-4 focus:ring-peacock-100" />

      <label className="mt-5 block text-sm font-medium" htmlFor="pw">Password</label>
      <div className="relative mt-2">
        <input id="pw" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-12 outline-none transition focus:border-peacock-500 focus:ring-4 focus:ring-peacock-100" />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate hover:text-ink">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {error && <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</motion.p>}
      </AnimatePresence>

      <button disabled={loading || success} className="relative mt-7 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-peacock-800 py-3.5 font-semibold text-white transition hover:bg-peacock-700 disabled:opacity-90">
        <AnimatePresence mode="wait" initial={false}>
          {success ? <motion.span key="ok" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2"><ShieldCheck size={18} /> Signed in</motion.span>
            : loading ? <motion.span key="l" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Verifying</motion.span>
              : <motion.span key="s" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>Sign in</motion.span>}
        </AnimatePresence>
      </button>

      <div className="mt-10">
        <p className="text-sm font-medium">Use a demo customer</p>
        <div className="mt-3 grid gap-2">
          {DEMO.map((d) => (
            <button type="button" key={d.login} onClick={() => fill(d.login)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:border-peacock-500 ${login === d.login ? "border-peacock-500 bg-peacock-100/50" : "border-line bg-white"}`}>
              <span><span className="block font-medium">{d.name}</span><span className="text-sm text-slate">{d.note}</span></span>
              <span className="text-xs text-peacock-700">Fill in</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate">Password for both: <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-line">Nova@123</code></p>
      </div>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">
          <Suspense><LoginForm /></Suspense>
        </div>
        <p className="text-xs text-slate">Demo project. NexaBank will never ask for your OTP, PIN or password over chat or phone.</p>
      </section>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-peacock-950 p-12 text-white lg:flex">
        <div className="dot-field absolute inset-0 opacity-30" />
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-semibold leading-snug">“Block my debit card.” Done in one line, confirmed before it happens.</p>
        </div>
        <div className="relative"><TiltCard /></div>
        <ul className="relative space-y-3 text-sm text-white/70">
          {["Session signed and stored in an httpOnly cookie", "Locked for 10 minutes after 5 wrong passwords", "Auto sign-out after 30 minutes"].map((t) => (
            <li key={t} className="flex items-center gap-3"><ShieldCheck size={16} className="text-marigold-400" />{t}</li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
