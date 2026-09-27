// Client-safe projection of a customer (no hashes, full account numbers or internals)
import type { User } from "./data";

export function toSummary(u: User) {
  const acc = u.accounts[0];
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const spent = acc.txns.filter((t) => t.amount < 0 && new Date(t.date) >= monthStart && !["transfer", "emi"].includes(t.category));
  const byCat: Record<string, number> = {};
  for (const t of spent) byCat[t.category] = (byCat[t.category] ?? 0) - t.amount;
  return {
    name: u.name, firstName: u.firstName, id: u.id, segment: u.segment,
    accounts: u.accounts.map((a) => ({ type: a.type, masked: "XX" + a.number.slice(-4), balance: a.balance })),
    recent: acc.txns.slice(-6).reverse().map(({ id, date, description, amount, category }) => ({ id, date, description, amount, category })),
    monthSpend: Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount })),
    cards: u.cards.map((c) => ({ type: c.type, network: c.network, last4: c.last4, status: c.status })),
  };
}
export type Summary = ReturnType<typeof toSummary>;
