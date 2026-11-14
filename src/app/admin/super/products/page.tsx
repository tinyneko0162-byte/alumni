import { AdminShell } from "@/components/admin/AdminShell";
import { getProductCatalog } from "@/lib/admin-data";
import { ProductsView } from "./products-view";

/** Figma: admin / Super Admin · สินค้าและราคา Token (4011:37270) */
export default async function ProductsPage() {
  const data = await getProductCatalog();
  return (
    <AdminShell role="super" active="/admin/super/products" title={data.title}>
      <ProductsView data={data} />
    </AdminShell>
  );
}
