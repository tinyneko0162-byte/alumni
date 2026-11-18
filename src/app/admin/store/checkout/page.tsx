import { AdminShell } from "@/components/admin/AdminShell";
import { getStorePos } from "@/lib/admin-data";
import { CheckoutView } from "./checkout-view";

/** Figma: admin / Store Operator · Workspace "ชำระค่าสินค้า" (4214:927, 4214:1094, 4214:1261, 4214:1428) */
export default async function StoreCheckoutPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [{ store }, data] = await Promise.all([searchParams, getStorePos()]);
  const current = data.stores.find((s) => s.id === store) ?? data.stores.find((s) => s.id === data.defaultStore)!;
  return (
    <AdminShell role="store" active="/admin/store/pos" title="ชำระค่าสินค้า">
      <CheckoutView store={current} recent={data.recent} />
    </AdminShell>
  );
}
