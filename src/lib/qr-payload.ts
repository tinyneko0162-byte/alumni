/** What is written inside the QR codes. Kept tiny so the code stays easy to scan. */
const ENTRY = "ALUMNI-ENTRY:";
const WALLET = "ALUMNI-WALLET:";

export const entryPayload = (ticketId: string) => ENTRY + ticketId;
export const walletPayload = (walletId: string) => WALLET + walletId;

export type ParsedQr = { kind: "entry" | "wallet"; id: string };

export function parseQr(text: string): ParsedQr | null {
  const t = text.trim();
  if (t.startsWith(ENTRY) && t.length > ENTRY.length) return { kind: "entry", id: t.slice(ENTRY.length) };
  if (t.startsWith(WALLET) && t.length > WALLET.length) return { kind: "wallet", id: t.slice(WALLET.length) };
  return null;
}
