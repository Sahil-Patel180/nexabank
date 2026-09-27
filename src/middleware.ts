import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
    const url = new URL("/login", req.url); url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*", "/api/chat/:path*", "/api/me/:path*"] };
