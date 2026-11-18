/**
 * Admin data access layer — same idea as src/lib/data.ts.
 * Swap each function body for a database query later; pages stay the same.
 */
import roles from "@/data/admin/roles.json";
import overview from "@/data/admin/overview.json";
import stores from "@/data/admin/stores.json";
import products from "@/data/admin/products.json";
import logs from "@/data/admin/logs.json";
import { readDb } from "@/lib/db";
import ticketSlips from "@/data/admin/ticket-slips.json";
import ticketLinks from "@/data/admin/ticket-links.json";
import tokenCash from "@/data/admin/token-cash.json";
import tokenTransfers from "@/data/admin/token-transfers.json";
import tokenHistory from "@/data/admin/token-history.json";
import storePos from "@/data/admin/store-pos.json";
import storeSales from "@/data/admin/store-sales.json";
import financeRevenue from "@/data/admin/finance-revenue.json";
import financeAttendance from "@/data/admin/finance-attendance.json";

export type AdminConfig = typeof roles;
export type RoleKey = keyof typeof roles.roles;

export async function getAdminConfig(): Promise<AdminConfig & { enabled: Record<RoleKey, boolean> }> {
  return { ...roles, enabled: readDb().roleEnabled };
}

export async function getOverview() {
  const db = readDb();
  const live: Record<string, number> = {
    "/admin/ticketing/slips": db.orders.filter((o) => o.status === "pending").length,
    "/admin/token/transfer": db.transfers.filter((t) => t.state === "pending").length,
  };
  return { ...overview, queues: overview.queues.map((q) => ({ ...q, count: live[q.href] ?? q.count })) };
}

export async function getStores() {
  return stores;
}

export async function getProductCatalog() {
  const catalog = readDb().catalog;
  return { ...products, products: catalog, totalProducts: catalog.length };
}

export async function getLogs() {
  const events = readDb().logs;
  return { ...logs, events, total: Math.max(logs.total, events.length) };
}

export async function getTicketSlips() {
  const orders = readDb().orders;
  const pending = orders.filter((o) => o.status === "pending");
  const approved = orders.filter((o) => o.status === "approved");
  return { ...ticketSlips, requests: pending, approved, pendingCount: pending.length, approvedCount: ticketSlips.approvedCount, approvedBase: ticketSlips.approvedCount };
}

export async function getTicketLinks() {
  const db = readDb();
  // newest approved order whose link has not been emailed yet; otherwise the sample row
  const o = db.orders.find((x) => x.status === "approved" && !x.linkSent);
  const current = o
    ? { ticketId: o.ticketIds[0] ?? o.id, recipientName: o.name, recipientShort: o.name.split(" ")[0], email: o.email, amount: o.amount, linkRef: `LINK-${o.id.slice(-4)}`, linkMasked: `event.example/t/••••-${o.id.slice(-4)}` }
    : ticketLinks.current;
  return { ...ticketLinks, current, history: db.linkHistory };
}

export async function getTokenCash() {
  const db = readDb();
  return { ...tokenCash, wallets: db.wallets, recent: db.topups.filter((t) => t.id.startsWith("TOP")).slice(0, 6).map((t) => ({ id: t.id, wallet: t.wallet, cash: t.received ?? 0, tokens: t.tokens, time: t.time.slice(0, 5), status: t.status })) };
}

export async function getTokenTransfers() {
  const requests = readDb().transfers;
  return { ...tokenTransfers, requests, pendingTotal: requests.filter((r) => r.state === "pending").length };
}

export async function getTokenHistory() {
  return { ...tokenHistory, records: readDb().topups };
}

export async function getStorePos() {
  const db = readDb();
  // price / stock / on-sale status always come from the catalog Super Admin edits
  const stores = storePos.stores.map((s) => {
    const c = db.catalog.find((x) => x.sku === s.product.sku);
    return { ...s, product: { ...s.product, name: c?.name ?? s.product.name, price: c?.price ?? s.product.price, unit: c?.unit ?? s.product.unit, stock: c?.stock ?? 0, status: c?.status ?? "ขายอยู่" } };
  });
  const recent = db.sales
    .filter((s) => s.amount !== undefined)
    .slice(0, 6)
    .map((s) => ({ id: s.id, wallet: s.wallet, amount: s.amount ?? 0, time: s.time.slice(0, 5), status: "สำเร็จ" }));
  return { ...storePos, stores, recent: [...recent, ...storePos.recent].slice(0, 6) };
}

export async function getStoreSales() {
  return { ...storeSales, sales: readDb().sales };
}

export async function getFinanceRevenue() {
  return financeRevenue;
}

export async function getFinanceAttendance() {
  const db = readDb();
  const approved = financeAttendance.approved + db.orders.filter((o) => o.status === "approved").reduce((n, o) => n + o.ticketIds.length, 0);
  return { ...financeAttendance, approved, checkedIn: financeAttendance.checkedIn + db.checkins.length, attendees: [...db.checkins, ...financeAttendance.attendees] };
}
