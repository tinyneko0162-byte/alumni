import { AdminShell } from "@/components/admin/AdminShell";
import { getEvents } from "@/lib/admin-data";
import { EventsView } from "./events-view";

export const dynamic = "force-dynamic";

/** Super Admin · จัดการงาน: one event open at a time; closing it ends its tickets and Token. */
export default async function EventsPage() {
  const data = await getEvents();
  return (
    <AdminShell role="super" active="/admin/super/events" title="จัดการงาน">
      <EventsView data={data} />
    </AdminShell>
  );
}
