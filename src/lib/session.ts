import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { readDb, type RoleKey, type Staff, type User } from "@/lib/db";

/**
 * Signed cookies: "<id>.<signature>". The id cannot be changed in the browser
 * without breaking the signature, so nobody can make themselves another account.
 */
export const STAFF_COOKIE = "alumni-staff";
export const USER_COOKIE = "alumni-user";
const secret = () => process.env.TICKET_SECRET ?? "demo-secret-change-me";
const sign = (kind: string, v: string) => createHmac("sha256", secret()).update(`${kind}:${v}`).digest("hex").slice(0, 24);
const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 12 };

async function readSigned(cookie: string, kind: string): Promise<string | null> {
  const raw = (await cookies()).get(cookie)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  if (i < 1) return null;
  const id = raw.slice(0, i);
  const a = Buffer.from(sign(kind, id));
  const b = Buffer.from(raw.slice(i + 1));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

// ---------- staff ----------

export async function setStaffSession(staffId: string) {
  (await cookies()).set(STAFF_COOKIE, `${staffId}.${sign("staff", staffId)}`, opts);
}

export async function clearStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

/** Signed-in staff account, or null when signed out, switched off, or the cookie was tampered with. */
export async function getStaff(): Promise<Staff | null> {
  const id = await readSigned(STAFF_COOKIE, "staff");
  if (!id) return null;
  const s = readDb().staff.find((x) => x.id === id);
  return s && s.active ? s : null;
}

/** Role of the signed-in staff member, or null. */
export async function getStaffRole(): Promise<RoleKey | null> {
  return (await getStaff())?.role ?? null;
}

// ---------- attendees ----------

export async function setUserSession(userId: string) {
  (await cookies()).set(USER_COOKIE, `${userId}.${sign("user", userId)}`, { ...opts, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearUserSession() {
  (await cookies()).delete(USER_COOKIE);
}

export async function getUser(): Promise<User | null> {
  const id = await readSigned(USER_COOKIE, "user");
  return id ? readDb().users.find((u) => u.id === id) ?? null : null;
}
