// Types shared by server (dialogue manager) and client (chat UI)

export interface NluEntity { entity: string; value: string | number; raw: string; start: number; end: number; known?: boolean }
export interface NluResult {
  text: string; normalized: string; intent: string; confidence: number; fallback: boolean;
  ranking: { intent: string; confidence: number }[]; entities: NluEntity[]; latencyMs: number;
}

export type RichCard =
  | { kind: "balance"; accounts: { type: string; masked: string; balance: number; ifsc: string }[] }
  | { kind: "statement"; title: string; txns: { id: string; date: string; description: string; amount: number; category: string; mode: string }[] }
  | { kind: "spending"; period: string; total: number; breakdown: { category: string; amount: number; pct: number }[]; merchants: { name: string; amount: number }[] }
  | { kind: "transfer_confirm"; payee: string; bank: string; account: string; amount: number; from: string; mode: string }
  | { kind: "otp"; phone: string; demoOtp: string }
  | { kind: "receipt"; title: string; reference: string; rows: [string, string][]; amount: number }
  | { kind: "bill_confirm"; biller: string; amount: number; dueDate: string }
  | { kind: "cards"; cards: { type: string; network: string; last4: string; status: string; limit?: number; outstanding?: number; dueDate?: string; minDue?: number }[] }
  | { kind: "emi"; principal: number; rate: number; months: number; emi: number; interest: number; total: number; loanType: string }
  | { kind: "eligibility"; loanType: string; maxLoan: number; rate: number; maxEmi: number; tenureYears: number; score: number }
  | { kind: "loans"; loans: { type: string; outstanding: number; principal: number; emi: number; emisLeft: number; nextEmiDate: string; rate: number }[] }
  | { kind: "rates"; title: string; headers: string[]; rows: string[][]; note?: string }
  | { kind: "branches"; items: { name: string; city: string; address: string; ifsc: string; hours: string; atm: boolean }[]; type: "branch" | "atm" }
  | { kind: "checklist"; title: string; items: string[] }
  | { kind: "alert"; tone: "danger" | "success" | "info"; title: string; body: string }
  | { kind: "handoff"; ticket: string; eta: string };

export interface BotMessage { text: string; card?: RichCard }

export interface ChatResponse {
  messages: BotMessage[];
  suggestions: string[];
  nlu: NluResult;
  trace: string[]; // dialogue-policy trace for the explainability panel
  state: { active?: string; awaiting?: string; slots: Record<string, unknown> };
  balance?: number;
}
