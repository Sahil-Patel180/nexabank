import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { findUserByLogin, verifyPassword } from "@/lib/bank/data";
import { SESSION_COOKIE, createSession } from "@/lib/auth";

export const runtime = "nodejs";

// naive in-memory brute-force guard: 5 failures / 10 min per login id
const g = globalThis as unknown as { __nexaFails?: Map<string, { n: number; t: number }> };
const fails = (g.__nexaFails ??= new Map());

export async function POST(req: Request) {
  const { login, password } = (await req.json().catch(() => ({}))) as { login?: string; password?: string };
  if (!login || !password) return NextResponse.json({ error: "Enter your customer ID or email and your password." }, { status: 400 });
  const key = login.trim().toLowerCase();
  const f = fails.get(key);
  if (f && f.n >= 5 && Date.now() - f.t < 600_000) return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });

  const user = findUserByLogin(login);
  if (!user || !verifyPassword(user, password)) {
    fails.set(key, { n: (f?.n ?? 0) + 1, t: Date.now() });
    return NextResponse.json({ error: "Customer ID or password is incorrect." }, { status: 401 });
  }
  fails.delete(key);
  const token = await createSession({ sub: user.id, name: user.name, sid: randomUUID() });
  const res = NextResponse.json({ ok: true, name: user.firstName });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 1800 });
  return res;
}
