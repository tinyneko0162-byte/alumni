import { AdminShell } from "@/components/admin/AdminShell";
import { LiveRefresh } from "@/components/admin/LiveRefresh";
import { getTicketSlips } from "@/lib/admin-data";
import { SlipsView } from "./slips-view";

/** Figma: admin / Ticketing Officer · ตรวจสลิปค่าบัตร (4011:37710) */
export default async function TicketSlipsPage() {
  const data = await getTicketSlips();
  return (
    <AdminShell role="ticketing" active="/admin/ticketing/slips" title="ตรวจสอบสลิปค่าบัตร">
      <LiveRefresh />
      <SlipsView key={data.requests.map((r) => r.id).join() + "|" + data.approved.length} data={data} />
    </AdminShell>
  );
}
