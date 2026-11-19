import { getStaffRole } from "@/lib/session";
import { readSlip } from "@/lib/slips";

export const runtime = "nodejs";

/** Slip image for staff who check payments (Ticketing, Token Staff, Super Admin). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = await getStaffRole();
  if (role !== "ticketing" && role !== "token" && role !== "super") return new Response("ไม่มีสิทธิ์ดูสลิป", { status: 403 });
  const slip = readSlip((await params).id);
  if (!slip) return new Response("ไม่พบสลิป", { status: 404 });
  return new Response(new Uint8Array(slip.body), { headers: { "Content-Type": slip.type, "Cache-Control": "private, no-store" } });
}
