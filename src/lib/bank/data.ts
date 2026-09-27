// ─────────────────────────────────────────────────────────────
// Mock Core Banking System (CBS)
// In-memory store standing in for a real CBS / ledger. Seeded
// deterministically relative to "now" so date queries always work.
// A globalThis singleton keeps state across hot reloads in dev.
// ─────────────────────────────────────────────────────────────
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

export type Category = "food" | "groceries" | "shopping" | "travel" | "fuel" | "entertainment" | "bills" | "salary" | "transfer" | "emi" | "cash";

export interface Txn {
  id: string;
  date: string; // ISO
  description: string;
  merchant?: string;
  category: Category;
  amount: number; // +credit / -debit (₹)
  mode: "UPI" | "NEFT" | "IMPS" | "CARD" | "ATM" | "ACH" | "BILLPAY";
  balanceAfter: number;
}
export interface Account { id: string; type: "savings" | "current"; number: string; ifsc: string; balance: number; branch: string; txns: Txn[] }
export interface Card { id: string; type: "debit" | "credit"; network: "Visa" | "RuPay" | "Mastercard"; last4: string; status: "active" | "blocked"; limit?: number; outstanding?: number; dueDate?: string; minDue?: number; linkedAccount?: string }
export interface Loan { id: string; type: "home" | "car" | "personal"; principal: number; outstanding: number; rate: number; emi: number; emisLeft: number; nextEmiDate: string }
export interface Payee { id: string; name: string; aliases: string[]; bank: string; account: string }
export interface User {
  id: string; name: string; firstName: string; email: string; passwordHash: string; salt: string;
  segment: string; monthlyIncome: number; creditScore: number; kycStatus: "complete" | "due";
  accounts: Account[]; cards: Card[]; loans: Loan[]; payees: Payee[]; dailyTransferred: number;
}

function hash(pw: string, salt: string) { return scryptSync(pw, salt, 32).toString("hex"); }
export function verifyPassword(u: User, pw: string) {
  const a = Buffer.from(hash(pw, u.salt), "hex"), b = Buffer.from(u.passwordHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// deterministic PRNG so the seeded data is identical on every boot
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

const MERCHANTS: [string, Category, number, number][] = [
  ["Swiggy", "food", 180, 850], ["Zomato", "food", 220, 900], ["BigBasket", "groceries", 600, 3200], ["Blinkit", "groceries", 150, 1200],
  ["Amazon", "shopping", 300, 6500], ["Flipkart", "shopping", 400, 5200], ["Myntra", "shopping", 700, 3800], ["Uber", "travel", 120, 650],
  ["Ola", "travel", 110, 540], ["IRCTC", "travel", 450, 2800], ["Indian Oil", "fuel", 500, 3000], ["HP Petrol", "fuel", 600, 2600],
  ["BookMyShow", "entertainment", 250, 1400], ["Netflix", "entertainment", 649, 649], ["Spotify", "entertainment", 119, 119],
];

function seedTxns(r: () => number, opening: number, salary: number, emi: number): Txn[] {
  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 95);
  const raw: Omit<Txn, "balanceAfter" | "id">[] = [];
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const iso = (h: number) => { const x = new Date(d); x.setHours(h, Math.floor(r() * 60)); return x.toISOString(); };
    if (d.getDate() === 1) raw.push({ date: iso(9), description: "Salary credit · Innovent Tech Pvt Ltd", category: "salary", amount: salary, mode: "NEFT" });
    if (d.getDate() === 5 && emi) raw.push({ date: iso(7), description: "Home loan EMI · NexaBank", category: "emi", amount: -emi, mode: "ACH" });
    if (d.getDate() === 3) raw.push({ date: iso(11), description: "Rent · Suresh Iyer", category: "transfer", amount: -18000, mode: "IMPS" });
    if (d.getDate() === 12) raw.push({ date: iso(18), description: "Electricity bill · State DISCOM", category: "bills", amount: -Math.round(1200 + r() * 1400), mode: "BILLPAY" });
    if (d.getDate() === 20) raw.push({ date: iso(10), description: "Airtel postpaid", category: "bills", amount: -599, mode: "BILLPAY" });
    const n = r() < 0.55 ? 1 : r() < 0.5 ? 2 : 0;
    for (let i = 0; i < n; i++) {
      const [m, cat, lo, hi] = MERCHANTS[Math.floor(r() * MERCHANTS.length)];
      raw.push({ date: iso(9 + Math.floor(r() * 13)), description: m, merchant: m, category: cat, amount: -Math.round(lo + r() * (hi - lo)), mode: r() < 0.6 ? "UPI" : "CARD" });
    }
    if (r() < 0.04) raw.push({ date: iso(16), description: "ATM withdrawal", category: "cash", amount: -[2000, 3000, 5000][Math.floor(r() * 3)], mode: "ATM" });
  }
  raw.sort((a, b) => a.date.localeCompare(b.date));
  let bal = opening;
  return raw.map((t, i) => { bal += t.amount; return { ...t, id: "TXN" + (900000 + i), balanceAfter: bal }; });
}

function nextDate(day: number) {
  const d = new Date(); if (d.getDate() >= day) d.setMonth(d.getMonth() + 1); d.setDate(day); d.setHours(0, 0, 0, 0); return d.toISOString();
}

function makeUser(p: { id: string; name: string; email: string; pw: string; seed: number; salary: number; opening: number; loan: boolean; segment: string }): User {
  const r = rng(p.seed);
  const salt = randomBytes(8).toString("hex");
  const emi = p.loan ? 32450 : 0;
  const txns = seedTxns(r, p.opening, p.salary, emi);
  return {
    id: p.id, name: p.name, firstName: p.name.split(" ")[0], email: p.email, salt, passwordHash: hash(p.pw, salt),
    segment: p.segment, monthlyIncome: p.salary, creditScore: p.loan ? 782 : 741, kycStatus: p.loan ? "complete" : "due",
    accounts: [
      { id: "ACC1", type: "savings", number: `50100${p.seed}48214821`.slice(0, 14), ifsc: "NEXA0001204", balance: txns.at(-1)!.balanceAfter, branch: "Mumbai – Andheri West", txns },
      { id: "ACC2", type: "current", number: `50200${p.seed}77190034`.slice(0, 14), ifsc: "NEXA0001204", balance: 64210, branch: "Mumbai – Andheri West", txns: [] },
    ],
    cards: [
      { id: "CRD1", type: "debit", network: "RuPay", last4: "4821", status: "active", linkedAccount: "ACC1" },
      { id: "CRD2", type: "credit", network: "Visa", last4: "9034", status: "active", limit: 250000, outstanding: 46300, minDue: 2315, dueDate: nextDate(18) },
    ],
    loans: p.loan ? [{ id: "LN1", type: "home", principal: 3500000, outstanding: 2874500, rate: 8.45, emi, emisLeft: 146, nextEmiDate: nextDate(5) }] : [],
    payees: [
      { id: "P1", name: "Rohan Mehta", aliases: ["rohan"], bank: "HDFC Bank", account: "XXXX2231" },
      { id: "P2", name: "Neha Kapoor", aliases: ["neha"], bank: "ICICI Bank", account: "XXXX7810" },
      { id: "P3", name: "Sunita Sharma", aliases: ["mom", "mother", "maa", "mummy"], bank: "SBI", account: "XXXX0452" },
      { id: "P4", name: "Suresh Iyer", aliases: ["landlord", "suresh"], bank: "Axis Bank", account: "XXXX6619" },
      { id: "P5", name: "Arjun Nair", aliases: ["arjun", "brother", "bro"], bank: "NexaBank", account: "XXXX3307" },
    ],
    dailyTransferred: 0,
  };
}

interface Store { users: User[] }
const g = globalThis as unknown as { __nexaStore?: Store };
export const store: Store = (g.__nexaStore ??= {
  users: [
    makeUser({ id: "NB1001", name: "Aarav Sharma", email: "aarav@nexabank.demo", pw: "Nova@123", seed: 11, salary: 142000, opening: 186000, loan: true, segment: "Nexa Privé" }),
    makeUser({ id: "NB1002", name: "Priya Menon", email: "priya@nexabank.demo", pw: "Nova@123", seed: 23, salary: 96000, opening: 72000, loan: false, segment: "Nexa Classic" }),
  ],
});

export const findUserByLogin = (login: string) =>
  store.users.find((u) => u.email.toLowerCase() === login.trim().toLowerCase() || u.id.toLowerCase() === login.trim().toLowerCase());
export const findUserById = (id: string) => store.users.find((u) => u.id === id);

export const DAILY_LIMIT = 200000;
export const OTP_THRESHOLD = 25000;

export function executeTransfer(u: User, payee: Payee, amount: number, fromType: "savings" | "current" = "savings") {
  const acc = u.accounts.find((a) => a.type === fromType) ?? u.accounts[0];
  acc.balance -= amount;
  u.dailyTransferred += amount;
  const txn: Txn = {
    id: "TXN" + Math.floor(100000 + Math.random() * 899999), date: new Date().toISOString(),
    description: `${amount >= 200000 ? "RTGS" : "IMPS"} · ${payee.name}`, category: "transfer", amount: -amount, mode: "IMPS", balanceAfter: acc.balance,
  };
  acc.txns.push(txn);
  return { txn, account: acc, reference: "NXB" + Date.now().toString().slice(-9) };
}

export function payBill(u: User, biller: string, amount: number) {
  const acc = u.accounts[0];
  acc.balance -= amount;
  const txn: Txn = { id: "TXN" + Math.floor(100000 + Math.random() * 899999), date: new Date().toISOString(), description: `${biller} · BBPS`, category: "bills", amount: -amount, mode: "BILLPAY", balanceAfter: acc.balance };
  acc.txns.push(txn);
  return { txn, reference: "BBPS" + Date.now().toString().slice(-8) };
}

// ── reference data ──────────────────────────────────────────
export const RATES = {
  fd: [
    { tenor: "7 – 45 days", general: 3.5, senior: 4.0 }, { tenor: "46 – 179 days", general: 5.75, senior: 6.25 },
    { tenor: "180 days – 1 yr", general: 6.5, senior: 7.0 }, { tenor: "1 – 2 yrs", general: 7.1, senior: 7.6 },
    { tenor: "2 – 3 yrs", general: 7.25, senior: 7.75 }, { tenor: "3 – 5 yrs", general: 7.0, senior: 7.5 },
  ],
  rd: 6.9, savings: [{ slab: "Up to ₹10 lakh", rate: 3.0 }, { slab: "Above ₹10 lakh", rate: 3.5 }],
  loans: { home: 8.45, car: 9.1, personal: 10.99, education: 9.5, two_wheeler: 11.25 },
};

export const BILLERS: Record<string, { name: string; due: number }> = {
  electricity: { name: "State DISCOM Electricity", due: 1846 }, mobile: { name: "Airtel Postpaid", due: 599 },
  broadband: { name: "JioFiber Broadband", due: 999 }, dth: { name: "Tata Play DTH", due: 350 }, gas: { name: "Mahanagar Gas", due: 742 }, water: { name: "Municipal Water Board", due: 410 },
};

export const BRANCHES = [
  { city: "Mumbai", name: "Andheri West", address: "Plot 14, Link Road, Andheri West, Mumbai 400053", ifsc: "NEXA0001204", hours: "Mon–Fri 9:30–16:30 · Sat 9:30–13:00 (1st/3rd/5th)", atm: true },
  { city: "Mumbai", name: "Bandra Kurla Complex", address: "G Block, BKC, Mumbai 400051", ifsc: "NEXA0001010", hours: "Mon–Fri 9:30–16:30", atm: true },
  { city: "Delhi", name: "Connaught Place", address: "N-22, Connaught Circus, New Delhi 110001", ifsc: "NEXA0002001", hours: "Mon–Fri 9:30–16:30 · Sat 9:30–13:00", atm: true },
  { city: "Bengaluru", name: "Koramangala", address: "80 Feet Rd, 4th Block, Koramangala, Bengaluru 560034", ifsc: "NEXA0003112", hours: "Mon–Fri 9:30–16:30", atm: true },
  { city: "Bengaluru", name: "Indiranagar", address: "100 Feet Rd, HAL 2nd Stage, Bengaluru 560038", ifsc: "NEXA0003140", hours: "Mon–Fri 9:30–16:30 · Sat 9:30–13:00", atm: false },
  { city: "Chennai", name: "T. Nagar", address: "42 Usman Road, T. Nagar, Chennai 600017", ifsc: "NEXA0004021", hours: "Mon–Fri 9:30–16:30 · Sat 9:30–13:00", atm: true },
  { city: "Chennai", name: "Adyar", address: "11 LB Road, Adyar, Chennai 600020", ifsc: "NEXA0004035", hours: "Mon–Fri 9:30–16:30", atm: true },
  { city: "Hyderabad", name: "HITEC City", address: "Cyber Towers Rd, HITEC City, Hyderabad 500081", ifsc: "NEXA0005008", hours: "Mon–Fri 9:30–16:30", atm: true },
  { city: "Pune", name: "Hinjewadi", address: "Phase 1, Rajiv Gandhi Infotech Park, Pune 411057", ifsc: "NEXA0006015", hours: "Mon–Fri 9:30–16:30", atm: true },
  { city: "Kolkata", name: "Salt Lake", address: "Sector V, Salt Lake City, Kolkata 700091", ifsc: "NEXA0007003", hours: "Mon–Fri 9:30–16:30 · Sat 9:30–13:00", atm: true },
];
