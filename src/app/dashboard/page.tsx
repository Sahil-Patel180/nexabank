import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSession } from "@/lib/auth";
import { findUserById } from "@/lib/bank/data";
import { toSummary } from "@/lib/bank/summary";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  const u = s && findUserById(s.sub);
  if (!u) redirect("/login?next=/dashboard");
  return <Dashboard initial={toSummary(u)} />;
}
