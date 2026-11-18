import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminConfig } from "@/lib/admin-data";
import { RolesView } from "./roles-view";

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
  return (
    <AdminShell role="super" active="/admin/super/roles" title="จัดการบทบาท">
      <RolesView initial={roles} />
    </AdminShell>
  );
}
