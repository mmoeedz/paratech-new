import { getUser } from "@/lib/auth";
import { dueReminders } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ reminders: [] }, { status: 401 });
  const rows = dueReminders(user.org_id, user.id);
  return Response.json(
    { reminders: rows.map((r) => ({ id: r.id, title: r.title, business_name: r.business_name, lead_id: r.lead_id, type: r.type })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
