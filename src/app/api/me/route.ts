import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSession } from "@/lib/auth";
import { findUserById } from "@/lib/bank/data";
import { toSummary } from "@/lib/bank/summary";

export const runtime = "nodejs";
export async function GET() {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  const u = s && findUserById(s.sub);
  if (!u) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  return NextResponse.json(toSummary(u));
}
