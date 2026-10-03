import { requireUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { ReminderWatcher } from "@/components/ReminderWatcher";
import { countDueNow } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const due = countDueNow(user.org_id, user.id);
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Nav user={{ name: user.name, role: user.role }} dueCount={due} />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <ReminderWatcher />
    </div>
  );
}
