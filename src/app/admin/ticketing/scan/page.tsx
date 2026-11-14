import { AdminShell } from "@/components/admin/AdminShell";
import { Guidance, PageHeading, Panel } from "@/components/admin/ui";

/** Menu item exists in Figma, but the screen itself has not been designed yet. */
export default function ScanPage() {
  return (
    <AdminShell role="ticketing" active="/admin/ticketing/scan" title="สแกนบัตรเข้างาน">
      <PageHeading title="สแกนบัตรเข้างาน" description="สแกน QR บัตรเข้างานเพื่อบันทึกเวลาเช็กอิน" />
      <Panel>
        <Guidance tone="warn">หน้านี้ยังไม่มีดีไซน์ใน Figma — มีเฉพาะเมนู จะเพิ่มเมื่อได้ดีไซน์</Guidance>
      </Panel>
    </AdminShell>
  );
}
