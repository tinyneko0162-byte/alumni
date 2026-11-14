import { AdminShell } from "@/components/admin/AdminShell";
import { getTokenHistory } from "@/lib/admin-data";
import { HistoryView } from "./history-view";

/** Figma: admin / Token Staff · ประวัติการเติม Token (4019:2615) */
export default async function TokenHistoryPage() {
  const data = await getTokenHistory();
  return (
    <AdminShell role="token" active="/admin/token/history" title="ประวัติการเติม Token">
      <HistoryView data={data} />
    </AdminShell>
  );
}
