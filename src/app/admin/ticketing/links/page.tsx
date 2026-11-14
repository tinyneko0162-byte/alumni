import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminConfig, getTicketLinks } from "@/lib/admin-data";
import { LinksView } from "./links-view";

/** Figma: admin / Ticketing Officer · ส่งลิงก์จากอีเมลบริษัท (4011:37889) */
export default async function TicketLinksPage() {
  const [data, cfg] = await Promise.all([getTicketLinks(), getAdminConfig()]);
  return (
    <AdminShell role="ticketing" active="/admin/ticketing/links" title="ส่งลิงก์ทางอีเมล">
      <LinksView data={data} event={cfg.event} />
    </AdminShell>
  );
}
