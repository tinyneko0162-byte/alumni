import "server-only";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { entryPayload } from "@/lib/qr-payload";
import { signTicket } from "@/lib/ticket-token";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Real email needs SMTP_HOST / SMTP_USER / SMTP_PASS in .env.local (see .env.example). */
export const mailReady = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

/** Personal ticket link (signed, cannot be guessed) + entry QR, sent to one ticket holder. */
export async function sendTicketEmail(input: { ticketId: string; to: string; name: string; base: string; subject?: string }): Promise<{ ok: boolean; link: string; error?: string }> {
 const link = `${input.base.replace(/\/$/, "")}/login`;
  if (!mailReady()) return { ok: false, link, error: "ยังไม่ได้ตั้งค่าอีเมลของระบบ" };
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  try {
    const qr = await QRCode.toBuffer(entryPayload(input.ticketId), { margin: 2, width: 360, errorCorrectionLevel: "M" });
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT ?? 465), secure: Number(SMTP_PORT ?? 465) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transport.sendMail({
      from: MAIL_FROM ?? SMTP_USER,
      to: input.to,
      subject: input.subject?.trim() || "ลิงก์เข้างาน งานเลี้ยงรุ่นศิษย์เก่า",
      text: `สวัสดีคุณ ${input.name}\nเปิดบัตรเข้างานและ QR ของคุณที่ลิงก์นี้: ${link}\nกรุณาไม่ส่งต่อลิงก์ให้ผู้อื่น`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#1b2140">
        <h2 style="color:#e82c87;margin:0 0 12px">งานเลี้ยงรุ่นศิษย์เก่า</h2>
        <p>สวัสดีคุณ ${esc(input.name)}</p>
        <p>เราได้รับชำระค่าบัตรเรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเปิดบัตรเข้างานและกระเป๋า Token ของคุณ</p>
        <p><a href="${link}" style="display:inline-block;background:#e82c87;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">เปิดบัตรของคุณ</a></p>
        <p style="margin:16px 0 4px">หรือแสดง QR นี้ที่หน้างาน (บัตร ${esc(input.ticketId)})</p>
        <img src="cid:entry-qr" width="180" height="180" alt="QR เข้างาน">
        <p style="font-size:12px;color:#6b7090">กรุณาไม่ส่งต่อลิงก์นี้ให้ผู้อื่น</p></div>`,
      attachments: [{ filename: `${input.ticketId}.png`, content: qr, cid: "entry-qr" }],
    });
    return { ok: true, link };
  } catch (e) {
    console.error("send ticket email failed", e);
    return { ok: false, link, error: "ส่งอีเมลไม่สำเร็จ ตรวจอีเมลและรหัสผ่านแอปใน .env.local" };
  }
}
