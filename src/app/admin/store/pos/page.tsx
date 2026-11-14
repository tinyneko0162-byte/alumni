import { AdminShell } from "@/components/admin/AdminShell";
import { getStorePos } from "@/lib/admin-data";
import { PosView } from "./pos-view";

/** Figma: admin / Store Operator · ขายสินค้าและตะกร้า (4192:278, 4192:447, 4191:76, 4192:549 — one per store) */
export default async function PosPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [{ store }, data] = await Promise.all([searchParams, getStorePos()]);
  const current = data.stores.find((s) => s.id === store) ?? data.stores.find((s) => s.id === data.defaultStore)!;
  return (
    <AdminShell role="store" active="/admin/store/pos" title="ขายสินค้า">
      <PosView boothName={data.boothName} store={current} stores={data.stores.map((s) => ({ id: s.id, name: s.name }))} />
    </AdminShell>
  );
}
