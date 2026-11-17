import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Set TICKET_SECRET in .env.local for real use; the fallback is only for demos. */
const secret = () => process.env.TICKET_SECRET ?? "demo-secret-change-me";

/** "TKT-0400" → "TKT-0400.<16 hex>" — goes in the personal link /t/<token>. */
export function signTicket(ticketId: string): string {
  return `${ticketId}.${createHmac("sha256", secret()).update(ticketId).digest("hex").slice(0, 16)}`;
}

/** Returns the ticket id when the token is genuine, otherwise null. */
export function verifyTicket(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const id = token.slice(0, i);
  const a = Buffer.from(signTicket(id));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}
