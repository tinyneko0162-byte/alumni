import { AdminShell } from "@/components/admin/AdminShell";
import { getStoreSales } from "@/lib/admin-data";
import { SalesView } from "./sales-view";

/** Figma: admin / Store Operator · ประวัติการขาย (4214:1561) */
export default async function StoreHistoryPage() {
  const data = await getStoreSales();
  return (
    <AdminShell role="store" active="/admin/store/history" title="ประวัติการขาย">
      <SalesView data={data} />
    </AdminShell>
  );
}
