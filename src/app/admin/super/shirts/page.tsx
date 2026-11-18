import { AdminShell } from "@/components/admin/AdminShell";
import { getShirtOrders } from "@/lib/admin-data";
import { ShirtsView } from "./shirts-view";

/** Super Admin · ออเดอร์เสื้อรุ่น: sizes to prepare, who picks up at the event, where to ship */
export default async function ShirtsPage() {
  const data = await getShirtOrders();
  return (
    <AdminShell role="super" active="/admin/super/shirts" title="ออเดอร์เสื้อรุ่น">
      <ShirtsView data={data} />
    </AdminShell>
  );
}
