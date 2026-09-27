"use client";
// "Under the hood" panel — makes the NLU → DM → NLG pipeline visible per turn.
import { motion } from "framer-motion";
import type { ChatResponse } from "@/lib/types";

const ENT_COLOR: Record<string, string> = { amount: "#f2a93b", payee: "#16939a", date_range: "#7fcfcf", category: "#11767f", city: "#0f5d6c", tenure_months: "#f6bf61", bill_type: "#16939a", card_type: "#0c4555", loan_type: "#11767f" };

function Highlighted({ text, ents }: { text: string; ents: ChatResponse["nlu"]["entities"] }) {
  const parts: React.ReactNode[] = [];
  let pos = 0;
  const sorted = [...ents].filter((e) => e.start >= 0).sort((a, b) => a.start - b.start);
  for (const e of sorted) {
    if (e.start < pos) continue;
    parts.push(text.slice(pos, e.start));
    parts.push(<mark key={e.start} className="rounded px-1 text-ink" style={{ background: (ENT_COLOR[e.entity] ?? "#dbe4e5") + "40", boxShadow: `inset 0 -2px 0 ${ENT_COLOR[e.entity] ?? "#56686f"}` }} title={e.entity}>{text.slice(e.start, e.end)}</mark>);
    pos = e.end;
  }
  parts.push(text.slice(pos));
  return <p className="leading-loose">{parts}</p>;
}

export function Inspector({ last }: { last: ChatResponse | null }) {
  if (!last) return <p className="p-5 text-sm text-slate">Send a message to see how Nova reads it: the intent it picks, the entities it pulls out, and the decisions the dialogue manager makes.</p>;
  const { nlu, trace, state } = last;
  return (
    <div className="space-y-6 p-5 text-sm">
      <section>
        <h3 className="mb-2 font-semibold">Your message, as Nova read it</h3>
        <div className="rounded-xl bg-paper p-3"><Highlighted text={nlu.text} ents={nlu.entities} /></div>
        <p className="mt-2 font-mono text-xs text-slate">normalised: {nlu.normalized}</p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Intent ranking</h3>
        <ul className="space-y-2">{nlu.ranking.map((r, i) => (
          <li key={r.intent}>
            <div className="mb-1 flex justify-between font-mono text-xs"><span className={i === 0 ? "font-semibold text-ink" : "text-slate"}>{r.intent}</span><span className="num">{(r.confidence * 100).toFixed(1)}%</span></div>
            <div className="h-1.5 rounded-full bg-paper"><motion.div key={nlu.text + r.intent} initial={{ width: 0 }} animate={{ width: `${Math.max(1, r.confidence * 100)}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} className={`h-full rounded-full ${i === 0 ? "bg-peacock-600" : "bg-line"}`} /></div>
          </li>))}</ul>
        {nlu.fallback && <p className="mt-2 text-xs text-danger">Below the 40% confidence threshold → treated as out of scope unless context resolves it.</p>}
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Entities</h3>
        {nlu.entities.length ? (
          <table className="w-full text-xs"><tbody>{nlu.entities.map((e, i) => (
            <tr key={i} className="border-b border-line last:border-0"><td className="py-1.5 font-mono" style={{ color: ENT_COLOR[e.entity] ?? undefined }}>{e.entity}</td><td className="py-1.5 text-slate">“{e.raw}”</td><td className="num py-1.5 text-right font-semibold">{String(e.value)}</td></tr>))}</tbody></table>
        ) : <p className="text-xs text-slate">None found.</p>}
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Dialogue manager</h3>
        <ol className="space-y-1.5 border-l-2 border-peacock-100 pl-3 font-mono text-xs">{trace.map((t, i) => <motion.li key={i + t} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>{t}</motion.li>)}</ol>
        <div className="mt-3 rounded-xl bg-paper p-3 font-mono text-xs">
          <p>active frame: <b>{state.active ?? "—"}</b></p>
          <p>awaiting: <b>{state.awaiting ?? "—"}</b></p>
          {Object.keys(state.slots).length > 0 && <p>slots: {Object.entries(state.slots).map(([k, v]) => `${k}=${String(v)}`).join(", ")}</p>}
        </div>
      </section>
      <p className="font-mono text-xs text-slate">NLU latency {nlu.latencyMs} ms · on-server, no external API</p>
    </div>
  );
}
