import { AdminShell } from "@/components/admin/AdminShell";
import { getStoreSales } from "@/lib/admin-data";
import { SalesView } from "./sales-view";

/** Figma: admin / Store Operator · ประวัติการขาย (4214:1561) */
export default async function StoreHistoryPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams;
  const data = await getStoreSales(store);
  return (
    <AdminShell role="store" active="/admin/store/history" title="ประวัติการขาย">
      <SalesView key={data.store.id} data={data} />
    </AdminShell>
  );
}
