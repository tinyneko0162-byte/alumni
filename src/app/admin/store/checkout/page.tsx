import { AdminShell } from "@/components/admin/AdminShell";
import { getStorePos } from "@/lib/admin-data";
import { getStaff } from "@/lib/session";
import { CheckoutView } from "./checkout-view";

/** Figma: admin / Store Operator · Workspace "ชำระค่าสินค้า" (4214:927, 4214:1094, 4214:1261, 4214:1428) */
export default async function StoreCheckoutPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [{ store }, data, staff] = await Promise.all([searchParams, getStorePos(), getStaff()]);
  // a Store Operator account only ever sees its own store; Super Admin can switch
  const own = staff?.role === "store" ? staff.storeId : undefined;
  const current = data.stores.find((s) => s.id === (own ?? store)) ?? data.stores.find((s) => s.id === data.defaultStore)!;
  return (
    <AdminShell role="store" active="/admin/store/pos" title="ชำระค่าสินค้า">
      <CheckoutView store={current} recent={current.recent} />
    </AdminShell>
  );
}
