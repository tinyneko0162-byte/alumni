import { nowTime, updateDb } from "@/lib/db";
import { mailReady, sendTicketEmail } from "@/lib/mailer";
import { getStaffRole } from "@/lib/session";

export const runtime = "nodejs";

/**
 * POST { ticketId, to, subject, name } → emails the personal ticket link + QR.
 * Without SMTP settings (.env.local) it records a simulated send and returns the link so the demo still works.
 */
export async function POST(req: Request) {
  const role = await getStaffRole();
  if (role !== "ticketing" && role !== "super") return Response.json({ ok: false, error: "เฉพาะเจ้าหน้าที่ตั๋วเท่านั้น กรุณาเข้าสู่ระบบ" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { ticketId?: string; to?: string; subject?: string; name?: string } | null;
  const ticketId = body?.ticketId?.trim();
  const to = body?.to?.trim();
  if (!ticketId || !to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return Response.json({ ok: false, error: "อีเมลผู้รับไม่ถูกต้อง" }, { status: 400 });
  }
  const base = process.env.APP_URL || new URL(req.url).origin;
  const simulated = !mailReady();
  const res = simulated ? { ok: true, link: (await sendTicketEmail({ ticketId, to, name: body?.name ?? "", base })).link } : await sendTicketEmail({ ticketId, to, name: body?.name ?? "ผู้ร่วมงาน", base, subject: body?.subject });
  if (!res.ok) return Response.json({ ok: false, error: "error" in res ? res.error : "ส่งอีเมลไม่สำเร็จ" }, { status: 502 });
  updateDb((db) => {
    db.linkHistory.unshift({ ticketId, email: to, time: nowTime().slice(0, 5), status: simulated ? "จำลอง (ยังไม่ตั้งค่าอีเมล)" : "ส่งแล้ว" });
    db.orders.forEach((o) => {
      if (o.id === ticketId || o.ticketIds.includes(ticketId)) o.linkSent = true;
    });
  });
  return Response.json({ ok: true, simulated, link: res.link });
}
