import { AdminShell } from "@/components/admin/AdminShell";
import { ScanView } from "./scan-view";

export default function ScanPage() {
  return (
    <AdminShell role="ticketing" active="/admin/ticketing/scan" title="สแกนบัตรเข้างาน">
      <ScanView />
    </AdminShell>
  );
}
