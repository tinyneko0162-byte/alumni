import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import roles from "@/data/admin/roles.json";
import products from "@/data/admin/products.json";
import logs from "@/data/admin/logs.json";
import storePos from "@/data/admin/store-pos.json";
import storeSales from "@/data/admin/store-sales.json";
import tokenCash from "@/data/admin/token-cash.json";
import tokenHistory from "@/data/admin/token-history.json";
import tokenTransfers from "@/data/admin/token-transfers.json";
import demo from "@/data/demo.json";

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

export type Wallet = { id: string; owner: string; balance: number; status: string };
export type Sale = (typeof storeSales.sales)[number] & { storeId?: string; productName?: string; unitPrice?: number; amount?: number };
export type TopupRecord = {
  id: string; time: string; wallet: string; owner: string; channel: string; received: number | null; requested?: number | null; tokens: number;
  staff: string; status: string; balanceBefore?: number; staffCode?: string; station?: string; fromAccount?: string;
  evidence?: { id: string; bankRef: string }; audit?: { time: string; title: string; detail: string }[];
};
export type TransferReq = (typeof tokenTransfers.requests)[number] & { state: "pending" | "done" | "resubmit" };

export type Db = {
  roleEnabled: Record<RoleKey, boolean>;
  catalog: CatalogProduct[];
  logs: LogEvent[];
  wallets: Wallet[];
  sales: Sale[];
  topups: TopupRecord[];
  transfers: TransferReq[];
};

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
      updatedAt: "24 ต.ค. 2569 · 16:40",
    });
  }
  return {
    roleEnabled: Object.fromEntries(Object.keys(roles.roles).map((k) => [k, true])) as Db["roleEnabled"],
    catalog,
    logs: structuredClone(logs.events),
    wallets: [{ ...demo.wallet, status: "ใช้งานได้" }, ...structuredClone(tokenCash.wallets)],
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
export const nowTime = () => new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
export const nowStamp = () => {
  const d = new Date();
  return `${d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
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

export function readDb(): Db {
  const file = resolveFile();
  try {
    const stored = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<Db>;
    return { ...seed(), ...stored }; // new collections added later fall back to seed data
  } catch {
    return seed();
  }
}

/** Read → change → save in one synchronous step, so two requests cannot overwrite each other. */
export function updateDb<T>(fn: (db: Db) => T): T {
  const db = readDb();
  const result = fn(db);
  const file = resolveFile();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, file);
  return result;
}

/** Append an entry to the system log page. */
export function addLog(db: Db, e: Omit<LogEvent, "time" | "result"> & { result?: string }) {
  const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  db.logs.unshift({ time, result: "สำเร็จ", ...e } as LogEvent);
  db.logs.splice(200);
}
