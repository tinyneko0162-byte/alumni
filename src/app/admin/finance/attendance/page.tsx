import { AdminShell } from "@/components/admin/AdminShell";
import { getFinanceAttendance } from "@/lib/admin-data";
import { AttendanceView } from "./attendance-view";

/** Figma: admin / Finance · ประวัติการเข้าร่วมและเวลาเช็กอิน (4011:38946) — shown inside the Super Admin workspace */
export default async function AttendancePage() {
  const data = await getFinanceAttendance();
  return (
    <AdminShell role="super" active="/admin/finance/attendance" title="ประวัติการเข้าร่วม" crumb="Finance">
      <AttendanceView data={data} />
    </AdminShell>
  );
}
