import { requireUser } from "@/lib/auth";
import { listDeals, listStages } from "@/lib/deals";
import { optionLabels } from "@/lib/settings";
import { Kanban } from "@/components/Kanban";
import { Empty, Flash, PageHeader, money, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const stages = listStages(user.org_id);
  const deals = listDeals(user.org_id, user.role === "caller" ? user.id : undefined);
  const open = deals.filter((d) => d.stage_kind === "open");
  const won = deals.filter((d) => d.stage_kind === "won");
  return (
    <>
      <PageHeader
        title="Deals"
        subtitle={`Open pipeline ${money(open.reduce((a, d) => a + d.value, 0))} · Won ${money(won.reduce((a, d) => a + d.value, 0))}. Drag a card to move it — or use the dropdown on the card.`}
      />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      {deals.length === 0 ? (
        <Empty>No deals yet. A deal opens automatically when a call ends as “Interested” or “Meeting booked”.</Empty>
      ) : (
        <Kanban
          stages={stages.map((s) => ({ id: s.id, name: s.name, kind: s.kind }))}
          deals={deals.map((d) => ({ id: d.id, title: d.title, business: d.business_name, value: d.value, stageId: d.stage_id, owner: d.owner_name, service: d.service }))}
          lostReasons={optionLabels(user.org_id, "lost_reason")}
        />
      )}
    </>
  );
}
