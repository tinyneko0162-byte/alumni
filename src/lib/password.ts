import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** "scrypt$<salt>$<hash>" — passwords are never stored as plain text. */
export function hashPassword(plain: string, salt = randomBytes(12).toString("hex")): string {
  return `scrypt$${salt}$${scryptSync(plain, salt, 32).toString("hex")}`;
}

export function checkPassword(plain: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const a = Buffer.from(scryptSync(plain, salt, 32).toString("hex"));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Readable temporary password for new staff accounts, e.g. "ks7f-29qm". */
export function tempPassword(): string {
  const s = randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
}
