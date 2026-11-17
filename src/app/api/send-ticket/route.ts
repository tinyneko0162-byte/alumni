import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { entryPayload } from "@/lib/qr-payload";
import { signTicket } from "@/lib/ticket-token";

export const runtime = "nodejs";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** POST { ticketId, to, subject, name } → sends the personal ticket link + QR by email. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { ticketId?: string; to?: string; subject?: string; name?: string } | null;
  const ticketId = body?.ticketId?.trim();
  const to = body?.to?.trim();
  if (!ticketId || !to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return Response.json({ ok: false, error: "อีเมลผู้รับไม่ถูกต้อง" }, { status: 400 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return Response.json({ ok: false, error: "ยังไม่ได้ตั้งค่าอีเมลของระบบ (SMTP_HOST / SMTP_USER / SMTP_PASS ใน .env.local)" }, { status: 503 });
  }

  const base = (process.env.APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const link = `${base}/t/${signTicket(ticketId)}`;
  const qr = await QRCode.toBuffer(entryPayload(ticketId), { margin: 2, width: 360, errorCorrectionLevel: "M" });
  const name = esc(body?.name ?? "ผู้ร่วมงาน");

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 465),
      secure: Number(SMTP_PORT ?? 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: MAIL_FROM ?? SMTP_USER,
      to,
      subject: body?.subject?.trim() || "ลิงก์เข้างาน งานเลี้ยงรุ่นศิษย์เก่า",
      text: `สวัสดีคุณ ${body?.name ?? ""}\nเปิดบัตรเข้างานและ QR ของคุณที่ลิงก์นี้: ${link}\nกรุณาไม่ส่งต่อลิงก์ให้ผู้อื่น`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#1b2140">
        <h2 style="color:#e82c87;margin:0 0 12px">งานเลี้ยงรุ่นศิษย์เก่า</h2>
        <p>สวัสดีคุณ ${name}</p>
        <p>เราได้รับชำระค่าบัตรเรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเปิดบัตรเข้างานและ Wallet ของคุณ</p>
        <p><a href="${link}" style="display:inline-block;background:#e82c87;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">เปิดลิงก์ส่วนตัวของคุณ</a></p>
        <p style="margin:16px 0 4px">หรือแสดง QR นี้ที่หน้างาน (บัตร ${esc(ticketId)})</p>
        <img src="cid:entry-qr" width="180" height="180" alt="QR เข้างาน">
        <p style="font-size:12px;color:#6b7090">กรุณาไม่ส่งต่อลิงก์นี้ให้ผู้อื่น</p></div>`,
      attachments: [{ filename: `${ticketId}.png`, content: qr, cid: "entry-qr" }],
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("send-ticket failed", e);
    return Response.json({ ok: false, error: "ส่งอีเมลไม่สำเร็จ ตรวจอีเมล/รหัสผ่านแอปใน .env.local แล้วลองใหม่" }, { status: 502 });
  }
}
