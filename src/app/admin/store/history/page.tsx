import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { getStoreSales } from "@/lib/admin-data";
import { getStaff } from "@/lib/session";
import { SalesView } from "./sales-view";

/** Figma: admin / Store Operator · ประวัติการขาย (4214:1561) */
export default async function StoreHistoryPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams;
  const staff = await getStaff();
  const own = staff?.role === "store" ? staff.storeId : undefined; // Store Operators see only their store
  const data = await getStoreSales(own ?? store ?? (await cookies()).get("alumni-store")?.value);
  return (
    <AdminShell role="store" active="/admin/store/history" title="ประวัติการขาย">
      <SalesView key={data.store.id} data={data} />
    </AdminShell>
  );
}
