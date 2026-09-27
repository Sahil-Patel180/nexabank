import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSession } from "@/lib/auth";
import { findUserById } from "@/lib/bank/data";
import { handleMessage, resetSession } from "@/lib/bank/dialogue";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  const user = session && findUserById(session.sub);
  if (!session || !user) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { message?: string; reset?: boolean };
  if (body.reset) { resetSession(user.id, session.sid); return NextResponse.json({ ok: true }); }
  const message = String(body.message ?? "").slice(0, 500).trim();
  if (!message) return NextResponse.json({ error: "Type a message for Nova." }, { status: 400 });
  return NextResponse.json(handleMessage(user, session.sid, message));
}
