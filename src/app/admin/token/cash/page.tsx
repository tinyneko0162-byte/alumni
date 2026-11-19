import { AdminShell } from "@/components/admin/AdminShell";
import { getTokenCash } from "@/lib/admin-data";
import { CashView } from "./cash-view";

/** Figma: admin / Token Staff · เติมเงินสดด้วย Wallet (4011:38044) */
export default async function TokenCashPage() {
  const data = await getTokenCash();
  return (
    <AdminShell role="token" active="/admin/token/cash" title="เติม Token ด้วยเงินสด">
      <CashView data={data} />
    </AdminShell>
  );
}
