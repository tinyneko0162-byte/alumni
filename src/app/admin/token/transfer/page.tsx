import { AdminShell } from "@/components/admin/AdminShell";
import { LiveRefresh } from "@/components/admin/LiveRefresh";
import { getTokenTransfers } from "@/lib/admin-data";
import { TransferView } from "./transfer-view";

/** Figma: admin / Token Staff · ตรวจเงินโอนและเติมผ่าน Wallet ID (4011:38276) */
export default async function TokenTransferPage() {
  const data = await getTokenTransfers();
  return (
    <AdminShell role="token" active="/admin/token/transfer" title="เติม Token จากเงินโอน">
      <LiveRefresh />
      <TransferView key={data.requests.map((r) => r.id + r.state).join()} data={data} />
    </AdminShell>
  );
}
