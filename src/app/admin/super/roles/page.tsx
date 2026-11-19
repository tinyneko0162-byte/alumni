import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminConfig } from "@/lib/admin-data";
import { RolesView } from "./roles-view";
import { StaffAccounts } from "./staff-accounts";
import { readDb } from "@/lib/db";
import { getStaff } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const cfg = await getAdminConfig();
  const roles = Object.entries(cfg.roles).map(([key, r]) => ({
    key,
    label: r.label,
    pages: r.menu.map((m) => m.label),
    enabled: cfg.enabled[key as keyof typeof cfg.enabled],
    locked: key === "super",
  }));
  const db = readDb();
  const me = await getStaff();
  const staff = db.staff.map((x) => ({ id: x.id, username: x.username, name: x.name, role: x.role, active: x.active, storeId: x.storeId, station: x.station }));
  return (
    <AdminShell role="super" active="/admin/super/roles" title="จัดการบทบาทและบัญชี">
      <RolesView initial={roles} />
      <StaffAccounts
        staff={staff}
        me={me?.id ?? ""}
        roles={roles.map((r) => ({ key: r.key, label: r.label }))}
        stores={db.stores.map((x) => ({ id: x.id, name: x.name }))}
      />
    </AdminShell>
  );
}
