import { AdminShell } from "@/components/admin/AdminShell";
import { getStores } from "@/lib/admin-data";
import { StoresView } from "./stores-view";

/** Figma: admin / Super Admin · จัดการและสร้างร้านค้า (4011:37079) */
export default async function StoresPage() {
  const data = await getStores();
  return (
    <AdminShell role="super" active="/admin/super/stores" title="จัดการร้านค้า">
      <StoresView data={data} />
    </AdminShell>
  );
}
