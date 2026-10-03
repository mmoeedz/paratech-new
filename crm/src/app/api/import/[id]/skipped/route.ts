import { getUser } from "@/lib/auth";
import { skippedCsv } from "@/lib/imports";
import { csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role === "caller") return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const csv = skippedCsv(user.org_id, Number(id));
  if (csv === null) return new Response("Not found", { status: 404 });
  return csvResponse(`skipped-rows-batch-${Number(id)}.csv`, csv);
}
