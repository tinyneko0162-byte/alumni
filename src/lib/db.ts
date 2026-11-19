import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import roles from "@/data/admin/roles.json";
import products from "@/data/admin/products.json";
import storesJson from "@/data/admin/stores.json";
import logs from "@/data/admin/logs.json";
import ticketSlips from "@/data/admin/ticket-slips.json";
import ticketLinks from "@/data/admin/ticket-links.json";
import financeAttendance from "@/data/admin/finance-attendance.json";
import storePos from "@/data/admin/store-pos.json";
import storeSales from "@/data/admin/store-sales.json";
import tokenCash from "@/data/admin/token-cash.json";
import tokenHistory from "@/data/admin/token-history.json";
import tokenTransfers from "@/data/admin/token-transfers.json";
import demo from "@/data/demo.json";
import { hashPassword } from "@/lib/password";

/**
 * Tiny file-backed database so the user pages and every staff page share the same data.
 *
 * - Local / any Node host: stored in ./.data/db.json (delete the file to reset the demo).
 * - Read-only hosts (e.g. Vercel): falls back to the OS temp dir, which is NOT permanent.
 * For real use, replace readDb/updateDb with queries to a hosted database; nothing else needs to change.
 */
export type RoleKey = keyof typeof roles.roles;
export type CatalogProduct = (typeof products.products)[number];
export type LogEvent = (typeof logs.events)[number];

export type StoreRow = { id: string; name: string; owner: string; detail: string; status: "open" | "closed" };
export type Wallet = { id: string; owner: string; balance: number; status: string; email?: string };
/**
 * One reunion event. Only one event is open at a time; closing it ends everything that belongs to it:
 * its tickets stop scanning and the Token left in wallets expire (recorded, so the books still add up).
 */
export type EventRow = {
  id: string;
  name: string;
  dateLong: string;
  dateShort: string;
  time: string;
  venue: string;
  status: "open" | "closed";
  /** ISO time; when set, the event closes itself at this time */
  endsAt?: string;
  closedAt?: string;
  closedBy?: string;
  /** Token that expired when the event closed */
  expiredTokens?: number;
  expiredWallets?: number;
};
/** Records created before events existed belong to the first event. */
export const FIRST_EVENT = "EVT-2569";
export const eventOf = (x: { eventId?: string }) => x.eventId ?? FIRST_EVENT;
/** Attendee account. A wallet is created with the account; tickets are matched by email. */
export type User = { id: string; name: string; email: string; phone: string; pass: string; walletId: string; createdAt: string };
/** Staff account: one role each; a Store Operator is tied to one store. */
export type Staff = { id: string; username: string; name: string; role: RoleKey; pass: string; active: boolean; storeId?: string; station: string };
export type Sale = (typeof storeSales.sales)[number] & { storeId?: string; productName?: string; unitPrice?: number; amount?: number; eventId?: string };
export type TopupRecord = {
  id: string; time: string; wallet: string; owner: string; channel: string; received: number | null; requested?: number | null; tokens: number;
  staff: string; status: string; balanceBefore?: number; staffCode?: string; station?: string; fromAccount?: string;
  evidence?: { id: string; bankRef: string }; audit?: { time: string; title: string; detail: string }[];
  eventId?: string;
};
export type TransferReq = (typeof tokenTransfers.requests)[number] & { state: "pending" | "done" | "resubmit"; eventId?: string; slipUrl?: string };

export type ShipAddress = { name: string; phone: string; line: string; subdistrict: string; district: string; province: string; zip: string };
/** Person a ticket belongs to: the buyer for the first ticket, a friend for the rest. */
export type TicketHolder = { ticketId: string; name: string; email: string; phone?: string };

export type Order = (typeof ticketSlips.requests)[number] & {
  status: "pending" | "approved" | "rejected";
  ticketIds: string[];
  fromAttendee?: boolean;
  linkSent?: boolean;
  // filled for orders placed from the attendee pages
  purchaseType?: "ticket" | "shirt" | "both";
  /** buyer bought their own ticket (false = only for friends and/or shirts) */
  self?: boolean;
  shirts?: { size: string }[];
  delivery?: "pickup" | "delivery";
  address?: ShipAddress | null;
  friends?: { name: string; email: string; phone?: string }[];
  holders?: TicketHolder[];
  /** shirt hand-over: picked up at the event or shipped */
  shirtStatus?: "waiting" | "picked" | "shipped";
  shirtUpdatedAt?: string;
  eventId?: string;
  /** uploaded slip picture (served to staff by /api/slip/<id>) */
  slipUrl?: string;
};

/** Wallet that belongs to an email address (account wallet first, then one made for a friend). */
export function walletOfEmail(db: Db, email: string): Wallet | undefined {
  const e = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === e);
  return db.wallets.find((w) => (user && w.id === user.walletId) || w.email?.toLowerCase() === e);
}

/** Name/email for a ticket id, looking through every approved order. */
export function findHolder(db: Db, ticketId: string): (TicketHolder & { order: Order }) | null {
  for (const o of db.orders) {
    if (o.status !== "approved" || !o.ticketIds.includes(ticketId)) continue;
    const h = o.holders?.find((x) => x.ticketId === ticketId);
    return { ticketId, name: h?.name ?? o.name, email: h?.email ?? o.email, phone: h?.phone, order: o };
  }
  return null;
}
export type Attendee = (typeof financeAttendance.attendees)[number] & { eventId?: string };
export type LinkRecord = (typeof ticketLinks.history)[number];

export type Db = {
  events: EventRow[];
  users: User[];
  staff: Staff[];
  orders: Order[];
  checkins: Attendee[];
  linkHistory: LinkRecord[];
  roleEnabled: Record<RoleKey, boolean>;
  stores: StoreRow[];
  catalog: CatalogProduct[];
  logs: LogEvent[];
  wallets: Wallet[];
  sales: Sale[];
  topups: TopupRecord[];
  transfers: TransferReq[];
};

// demo account passwords are hashed once per server start (hashing is deliberately slow)
let seedAccounts: { users: User[]; staff: Staff[] } | null = null;
function demoAccounts() {
  if (seedAccounts) return seedAccounts;
  const pw = (p: string) => hashPassword(p, "demo-seed-salt");
  const users: User[] = [
    { id: "U-0001", name: demo.wallet.owner, email: "kittiphong@example.com", phone: "0812345678", pass: pw("12345678"), walletId: demo.wallet.id, createdAt: "24 ต.ค. 2569" },
  ];
  const staff: Staff[] = [
    { id: "SA-01", username: "admin", name: "สุ•• ผู้ดูแลระบบ", role: "super", pass: pw("admin123"), active: true, station: "ฝ่ายจัดงาน" },
    { id: "TO-01", username: "ticket", name: "พั•• เจ้าหน้าที่ตั๋ว", role: "ticketing", pass: pw("1234"), active: true, station: "จุดเช็กอินประตูหลัก" },
    { id: "TS-01", username: "token", name: "อร•• จุดเติมเงิน", role: "token", pass: pw("1234"), active: true, station: "จุดเติมเงิน A" },
    ...[...storePos.stores].sort((a, b) => a.id.localeCompare(b.id)).map((st, i) => ({
      id: `SO-0${i + 1}`, username: `store${i + 1}`, name: st.operator.name.split(" ")[0], role: "store" as RoleKey, pass: pw("1234"), active: true, storeId: st.id, station: st.name,
    })),
  ];
  seedAccounts = { users, staff };
  return seedAccounts;
}

const seed = (): Db => {
  // products sold at the POS booths but missing from the admin catalog (e.g. ST-04) are added so Super Admin can edit them
  const catalog = structuredClone(products.products) as CatalogProduct[];
  for (const st of storePos.stores) {
    if (catalog.some((c) => c.sku === st.product.sku)) continue;
    catalog.push({
      sku: st.product.sku,
      name: st.product.name,
      store: st.name,
      storeCode: st.id,
      category: "อาหาร",
      price: st.product.price,
      stock: 100,
      unit: st.product.unit,
      status: "ขายอยู่",
      updatedAt: "24 ต.ค. 2569, 16:40",
    });
  }
  // stores Super Admin manages; booths that exist only in the POS data (e.g. ST-04) are added too
  const storeRows: StoreRow[] = storesJson.stores.map((x) => ({ ...x, status: x.status === "closed" ? "closed" : "open" }));
  for (const st of storePos.stores) {
    if (!storeRows.some((x) => x.id === st.id)) storeRows.push({ id: st.id, name: st.name, owner: st.operator.name.split(" ")[0], detail: st.product.name, status: "open" });
  }
  storeRows.sort((a, b) => a.id.localeCompare(b.id));
  for (const c of catalog) c.store = storeRows.find((x) => x.id === c.storeCode)?.name ?? c.store;
  const accounts = demoAccounts();
  const ev = roles.event;
  return {
    events: [{ id: FIRST_EVENT, name: ev.name, dateLong: ev.dateLong, dateShort: ev.dateShort, time: ev.time, venue: ev.venue, status: "open" }],
    users: structuredClone(accounts.users),
    staff: structuredClone(accounts.staff),
    stores: storeRows,
    orders: ticketSlips.requests.map((r) => ({ ...r, status: "pending" as const, ticketIds: [] })),
    checkins: [],
    linkHistory: structuredClone(ticketLinks.history),
    roleEnabled: Object.fromEntries(Object.keys(roles.roles).map((k) => [k, true])) as Db["roleEnabled"],
    catalog,
    logs: structuredClone(logs.events),
    wallets: [{ ...demo.wallet, status: "ใช้งานได้", email: "kittiphong@example.com" }, ...structuredClone(tokenCash.wallets)],
    sales: structuredClone(storeSales.sales),
    topups: structuredClone(tokenHistory.records) as TopupRecord[],
    transfers: tokenTransfers.requests.map((r) => ({ ...r, state: "pending" as const })),
  };
};

/** "TOP-0236" → next "TOP-0237" */
export function nextId(prefix: string, ids: string[], pad = 4): string {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.slice(prefix.length + 1)) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
}

export const shortWallet = (id: string) => `W-•••-${id.slice(-4)}`;
export const nowTime = () => new Date().toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit" });
export const nowStamp = () => {
  const d = new Date();
  return `${d.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" })} ${d.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" })}`;
};

function resolveFile(): string {
  if (process.env.DB_FILE) return process.env.DB_FILE;
  const dir = path.join(process.cwd(), ".data");
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return path.join(dir, "db.json");
  } catch {
    return path.join(os.tmpdir(), "alumni-db.json");
  }
}

function writeFile(db: Db) {
  const file = resolveFile();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, file);
}

let testPass: string | undefined;
export function readDb(): Db {
  const file = resolveFile();
  let db: Db;
  try {
    const stored = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<Db>;
    db = { ...seed(), ...stored }; // new collections added later fall back to seed data
  } catch {
    db = seed();
  }
  // กระเป๋าทดลองสำหรับสาธิตการสแกนจ่ายหน้าร้าน (QR: public/demo-qr/wallet-WLT-TEST-0001.png) — เติมให้อัตโนมัติถ้ายังไม่มี
  if (!db.wallets.some((w) => w.id === "WLT-TEST-0001")) {
    db.wallets.push({ id: "WLT-TEST-0001", owner: "ไทนี่ (ทดลอง)", balance: 2500, status: "ใช้งานได้" });
  }
  // บัญชีผู้ใช้ทดลอง ไทนี่ (ทดลอง): ล็อกอินฝั่งลูกค้าเพื่อดูกระเป๋า/ประวัติที่เชื่อมกับ QR ทดลอง (อีเมล tiny@example.com รหัส 12345678)
  if (!db.users.some((u) => u.walletId === "WLT-TEST-0001")) {
    db.users.push({ id: "U-TEST", name: "ไทนี่ (ทดลอง)", email: "tiny@example.com", phone: "0800000000", pass: (testPass ??= hashPassword("12345678", "demo-seed-salt")), walletId: "WLT-TEST-0001", createdAt: "24 ต.ค. 2569" });
  }
  // ข้อมูลเก่าที่เคยตั้งชื่อสินค้าว่า "เบียร์" → ใช้ชื่อ "เบียร์สด" ให้ตรงกับร้าน
  for (const c of db.catalog) if (c.sku === "BEER-01" && c.name === "เบียร์") c.name = "เบียร์สด";
  // an event past its end time closes itself the first time anyone opens a page afterwards
  const due = db.events.find((e) => e.status === "open" && e.endsAt && Date.parse(e.endsAt) <= Date.now());
  if (due) {
    closeEvent(db, due.id, "ปิดอัตโนมัติตามเวลาที่ตั้งไว้");
    writeFile(db);
  }
  return db;
}

/** The open event, or the most recent one when every event is closed. */
export function currentEvent(db: Db): EventRow {
  return db.events.find((e) => e.status === "open") ?? db.events[db.events.length - 1];
}
export const openEvent = (db: Db): EventRow | undefined => db.events.find((e) => e.status === "open");

/**
 * Close an event: its tickets stop working (scan checks the event) and every wallet's
 * remaining Token expire. Each expiry is written to the top-up history as a minus line.
 */
export function closeEvent(db: Db, id: string, by: string): { tokens: number; wallets: number } {
  const ev = db.events.find((e) => e.id === id);
  if (!ev || ev.status === "closed") return { tokens: 0, wallets: 0 };
  let tokens = 0;
  let wallets = 0;
  for (const w of db.wallets) {
    if (w.balance <= 0) continue;
    const ids = db.topups.filter((t) => t.id.startsWith("EXP")).map((t) => t.id);
    db.topups.unshift({
      id: nextId("EXP", ids), time: nowTime(), wallet: shortWallet(w.id), owner: w.owner, channel: "หมดอายุ", received: null, requested: null,
      tokens: -w.balance, staff: by, status: "สำเร็จ", balanceBefore: w.balance, eventId: id,
    });
    tokens += w.balance;
    wallets += 1;
    w.balance = 0;
  }
  Object.assign(ev, { status: "closed", closedAt: nowStamp(), closedBy: by, expiredTokens: tokens, expiredWallets: wallets });
  addLog(db, { event: `ปิดงาน ${ev.name}`, detail: `Token หมดอายุ ${tokens.toLocaleString("en-US")} จาก ${wallets} กระเป๋า, บัตรของงานนี้ใช้เข้างานไม่ได้แล้ว`, role: "Super Admin", actor: by, ref: id });
  return { tokens, wallets };
}

/** Read → change → save in one synchronous step, so two requests cannot overwrite each other. */
export function updateDb<T>(fn: (db: Db) => T): T {
  const db = readDb();
  const result = fn(db);
  writeFile(db);
  return result;
}

/** Append an entry to the system log page. */
export function addLog(db: Db, e: Omit<LogEvent, "time" | "result"> & { result?: string }) {
  const time = new Date().toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  db.logs.unshift({ time, result: "สำเร็จ", ...e } as LogEvent);
  db.logs.splice(200);
}
