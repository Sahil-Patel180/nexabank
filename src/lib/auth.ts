// Stateless sessions: HS256 JWT in an httpOnly, SameSite=Lax cookie.
// Edge-safe (used by middleware) — no Node-only imports here.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "nexa_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-secret-change-me-nexabank-nova-2026");

export interface Session { sub: string; name: string; sid: string }

export async function createSession(s: Session) {
  return new SignJWT({ name: s.name, sid: s.sid }).setProtectedHeader({ alg: "HS256" }).setSubject(s.sub).setIssuedAt().setExpirationTime("30m").sign(secret);
}

export async function readSession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { sub: String(payload.sub), name: String(payload.name), sid: String(payload.sid) };
  } catch { return null; }
}
