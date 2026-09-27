"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, RotateCcw, SendHorizonal, Volume2, VolumeX } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { BotMessage, ChatResponse } from "@/lib/types";
import { CardView } from "./RichCards";

type Msg = { id: number; from: "user" | "bot"; text: string; card?: BotMessage["card"] };
export interface ChatHandle { ask: (t: string) => void }

// minimal typing for the Web Speech API (not in lib.dom for all TS versions)
type SR = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void };

let uid = 0;

export const ChatPanel = forwardRef<ChatHandle, { firstName: string; onResponse: (r: ChatResponse) => void }>(function ChatPanel({ firstName, onResponse }, ref) {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: uid++, from: "bot", text: `Hi ${firstName}, I'm Nova. Ask me about your balance, spending, transfers, cards or loans.` }]);
  const [chips, setChips] = useState<string[]>(["What's my balance?", "How much did I spend on food last month?", "Send ₹2,000 to Rohan", "EMI for 25 lakh for 20 years"]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [lastActionable, setLastActionable] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SR | null>(null);
  const heard = useRef("");

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  const send = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput(""); setChips([]);
    setMsgs((m) => [...m, { id: uid++, from: "user", text: t }]);
    setBusy(true);
    const started = Date.now();
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: t }) }).catch(() => null);
    if (res?.status === 401) { window.location.href = "/login?next=/dashboard"; return; }
    const data = (await res?.json().catch(() => null)) as ChatResponse | null;
    // keep the typing indicator up long enough to read as "thinking"
    await new Promise((r) => setTimeout(r, Math.max(0, 550 - (Date.now() - started))));
    setBusy(false);
    if (!data?.messages) { setMsgs((m) => [...m, { id: uid++, from: "bot", text: "I couldn't reach the server. Check your connection and send that again." }]); return; }
    for (const [i, m] of data.messages.entries()) {
      if (i) await new Promise((r) => setTimeout(r, 380));
      const msg: Msg = { id: uid++, from: "bot", text: m.text, card: m.card };
      setMsgs((prev) => [...prev, msg]);
      if (m.card && ["transfer_confirm", "bill_confirm", "otp"].includes(m.card.kind)) setLastActionable(msg.id);
      if (speak && "speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(m.text); u.lang = "en-IN"; window.speechSynthesis.speak(u); }
    }
    setChips(data.suggestions);
    onResponse(data);
  }, [busy, speak, onResponse]);

  useImperativeHandle(ref, () => ({ ask: send }), [send]);

  function toggleMic() {
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) { setMsgs((m) => [...m, { id: uid++, from: "bot", text: "Voice input needs Chrome or Edge. You can keep typing here." }]); return; }
    if (listening) { recRef.current?.stop(); return; }
    const r = new Ctor(); r.lang = "en-IN"; r.interimResults = true;
    heard.current = "";
    r.onresult = (e) => { heard.current = Array.from(e.results).map((x) => x[0].transcript).join(""); setInput(heard.current); };
    r.onend = () => { setListening(false); if (heard.current.trim()) void send(heard.current); };
    r.onerror = () => setListening(false);
    recRef.current = r; setListening(true); r.start();
  }

  async function reset() {
    await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset: true }) });
    setMsgs([{ id: uid++, from: "bot", text: "Fresh start. What can I do for you?" }]); setLastActionable(-1);
    setChips(["What's my balance?", "Show my cards", "Branch in Chennai"]);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-peacock-800">
            <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden><ellipse cx="16" cy="18" rx="7.5" ry="9" fill="#d7f0ee" /><ellipse cx="16" cy="19" rx="3.6" ry="4.4" fill="#f2a93b" /></svg>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success" />
          </span>
          <div><p className="font-display font-semibold leading-tight">Nova</p><p className="text-xs text-slate">{busy ? "typing…" : "Online · replies instantly"}</p></div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setSpeak((s) => !s)} aria-pressed={speak} aria-label={speak ? "Stop reading replies aloud" : "Read replies aloud"} className="rounded-lg p-2 text-slate hover:bg-paper hover:text-ink">{speak ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
          <button onClick={reset} aria-label="Start a new conversation" className="rounded-lg p-2 text-slate hover:bg-paper hover:text-ink"><RotateCcw size={18} /></button>
        </div>
      </div>

      <div className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={m.from === "user" ? "flex justify-end" : "max-w-[92%]"}>
              {m.from === "user"
                ? <p className="max-w-[85%] rounded-2xl rounded-br-md bg-peacock-800 px-4 py-2.5 text-white">{m.text}</p>
                : <div><p className="w-fit rounded-2xl rounded-bl-md bg-paper px-4 py-2.5 leading-relaxed">{m.text}</p>{m.card && <CardView card={m.card} onAction={send} disabled={busy || m.id !== lastActionable} />}</div>}
            </motion.div>
          ))}
          {busy && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-fit gap-1.5 rounded-2xl rounded-bl-md bg-paper px-4 py-3.5" aria-label="Nova is typing">
              {[0, 1, 2].map((i) => <motion.span key={i} className="h-2 w-2 rounded-full bg-peacock-500" animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />)}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="border-t border-line px-4 pb-4 pt-3 sm:px-5">
        <AnimatePresence>
          {chips.length > 0 && !busy && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="thin-scroll mb-3 flex gap-2 overflow-x-auto pb-1">
              {chips.map((c, i) => (
                <motion.button key={c} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => send(c)}
                  className="shrink-0 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm transition hover:border-peacock-500 hover:text-peacock-800">{c}</motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 rounded-2xl border border-line bg-white p-1.5 pl-4 transition focus-within:border-peacock-500 focus-within:ring-4 focus-within:ring-peacock-100">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Ask Nova anything about your money"} aria-label="Message Nova" className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-slate/70" />
          <button type="button" onClick={toggleMic} aria-label={listening ? "Stop voice input" : "Speak to Nova"} className={`rounded-xl p-2.5 transition ${listening ? "animate-pulse bg-danger text-white" : "text-slate hover:bg-paper"}`}>{listening ? <MicOff size={18} /> : <Mic size={18} />}</button>
          <motion.button whileTap={{ scale: 0.9 }} disabled={!input.trim() || busy} aria-label="Send" className="rounded-xl bg-marigold-500 p-2.5 text-peacock-950 transition disabled:opacity-40"><SendHorizonal size={18} /></motion.button>
        </form>
      </div>
    </div>
  );
});
