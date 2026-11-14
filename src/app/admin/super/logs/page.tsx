import { AdminShell } from "@/components/admin/AdminShell";
import { getLogs } from "@/lib/admin-data";
import { LogsView } from "./logs-view";

/** Figma: admin / Super Admin · บันทึกระบบ (4011:37486) */
export default async function LogsPage() {
  const data = await getLogs();
  return (
    <AdminShell role="super" active="/admin/super/logs" title="บันทึกระบบ">
      <LogsView data={data} />
    </AdminShell>
  );
}
