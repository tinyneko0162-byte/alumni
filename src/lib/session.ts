import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { RoleKey } from "@/lib/db";

export const STAFF_COOKIE = "alumni-staff";
const secret = () => process.env.TICKET_SECRET ?? "demo-secret-change-me";
const sign = (v: string) => createHmac("sha256", secret()).update(`staff:${v}`).digest("hex").slice(0, 24);

export async function setStaffSession(role: RoleKey) {
  (await cookies()).set(STAFF_COOKIE, `${role}.${sign(role)}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function clearStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

/** Role of the signed-in staff member, or null when not signed in / cookie tampered with. */
export async function getStaffRole(): Promise<RoleKey | null> {
  const raw = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  if (i < 1) return null;
  const role = raw.slice(0, i);
  const a = Buffer.from(sign(role));
  const b = Buffer.from(raw.slice(i + 1));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return role as RoleKey;
}
