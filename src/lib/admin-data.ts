/**
 * Admin data access layer — same idea as src/lib/data.ts.
 * Swap each function body for a database query later; pages stay the same.
 */
import roles from "@/data/admin/roles.json";
import overview from "@/data/admin/overview.json";
import stores from "@/data/admin/stores.json";
import products from "@/data/admin/products.json";
import logs from "@/data/admin/logs.json";
import { readDb, type Db } from "@/lib/db";
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

const nowHm = () => new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

/** Approved tickets and check-ins: sample numbers from the JSON plus everything done in the app since. */
function attendanceTotals(db: Db) {
  const approved = financeAttendance.approved + db.orders.filter((o) => o.status === "approved").reduce((n, o) => n + o.ticketIds.length, 0);
  return { approved, checkedIn: financeAttendance.checkedIn + db.checkins.length };
}

export async function getOverview() {
  const db = readDb();
  const fin = financeFigures(db);
  const att = attendanceTotals(db);
  const pendingSlips = db.orders.filter((o) => o.status === "pending").length;
  const pendingTransfers = db.transfers.filter((t) => t.state === "pending").length;
  const live: Record<string, number> = { "/admin/ticketing/slips": pendingSlips, "/admin/token/transfer": pendingTransfers };

  // new check-ins go into 15-minute slots next to the sample ones
  const slots = overview.attendance.slots.map((x) => ({ ...x }));
  for (const c of db.checkins) {
    const [h, m] = (c.time ?? "").split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
    const time = `${String(h).padStart(2, "0")}:${String(m - (m % 15)).padStart(2, "0")}`;
    const slot = slots.find((x) => x.time === time);
    if (slot) slot.count += 1;
    else slots.push({ time, count: 1 });
  }
  slots.sort((a, b) => a.time.localeCompare(b.time));

  return {
    ...overview,
    metrics: [
      { label: "รายรับเงินจริงที่ยืนยันแล้ว", value: `฿${fin.total.toLocaleString("en-US")}`, note: "ค่าบัตร + เงินเติม Token" },
      { label: "ผู้เข้างานแล้ว", value: `${att.checkedIn}/${att.approved}`, note: `คิดเป็น ${((att.checkedIn / Math.max(att.approved, 1)) * 100).toFixed(0)}% ของบัตรที่อนุมัติ` },
      { label: "Token ใช้จ่ายในร้าน", value: fin.tokens.spent.toLocaleString("en-US"), note: "หน่วย Token • ไม่ใช่รายรับเงินบาท" },
      { label: "รายการรอตรวจสอบ", value: String(pendingSlips + pendingTransfers), note: `สลิปค่าบัตร ${pendingSlips} · เติม Token ${pendingTransfers}`, noteTone: pendingSlips + pendingTransfers > 0 ? "warning" : undefined },
    ],
    attendance: { total: att.checkedIn, updatedAt: `${nowHm()} น.`, slots },
    queues: overview.queues.map((q) => {
      const count = live[q.href] ?? q.count;
      return { ...q, count, note: count === 0 ? "ไม่มีรายการค้าง" : q.note };
    }),
    activity: db.logs.slice(0, 5).map((l) => ({ time: l.time, action: l.event, actor: l.role, ref: l.ref, result: l.result })),
  };
}

export async function getStores() {
  const db = readDb();
  const names = [...new Set(db.catalog.map((c) => c.name))];
  return {
    ...stores,
    stores: db.stores,
    productCount: db.catalog.length,
    productNames: names.join(" "),
    categoryCount: new Set(db.catalog.map((c) => c.category)).size,
    productsByStore: Object.fromEntries(db.stores.map((x) => [x.id, db.catalog.filter((c) => c.storeCode === x.id).length])),
  };
}

export async function getProductCatalog() {
  const db = readDb();
  const catalog = db.catalog;
  // store tabs follow the stores Super Admin manages (closed stores still listed so their products stay editable)
  return { ...products, products: catalog, totalProducts: catalog.length, storeTabs: db.stores.map((x) => x.name) };
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
    const row = db.stores.find((x) => x.id === s.id);
    const closed = row?.status === "closed";
    return { ...s, name: row?.name ?? s.name, product: { ...s.product, name: c?.name ?? s.product.name, price: c?.price ?? s.product.price, unit: c?.unit ?? s.product.unit, stock: c?.stock ?? 0, status: closed ? "ร้านปิด" : c?.status ?? "ขายอยู่" } };
  });
  const withSales = stores.map((st) => {
    const mine = db.sales.filter((x) => x.amount !== undefined && x.storeId === st.id);
    const seed = st.id === "ST-01" ? storePos.recent : [];
    const recent = [...mine.map((x) => ({ id: x.id, wallet: x.wallet, amount: x.amount ?? 0, time: x.time.slice(0, 5), status: x.status === "ยกเลิก" ? "ยกเลิก" : "สำเร็จ" })), ...seed].slice(0, 6);
    const paid = mine.filter((x) => x.status === "ชำระแล้ว");
    return { ...st, recent, today: { count: paid.length, revenue: paid.reduce((n, x) => n + (x.amount ?? 0), 0) } };
  });
  return { ...storePos, stores: withSales };
}

export async function getStoreSales(storeId?: string) {
  const pos = await getStorePos();
  const store = pos.stores.find((s) => s.id === storeId) ?? pos.stores.find((s) => s.id === pos.defaultStore)!;
  // ยอดขายเดิม (seed) ไม่มี storeId → นับเป็นของร้านแรก ST-01
  const sales = readDb()
    .sales.filter((s) => (s.storeId ?? "ST-01") === store.id)
    .map((s) => ({
      ...s,
      productName: s.productName ?? (store.id === "ST-01" ? storeSales.product.name : store.product.name),
      unitPrice: s.unitPrice ?? (store.id === "ST-01" ? storeSales.product.price : store.product.price),
    }));
  return {
    ...storeSales,
    description: `${store.name} · สรุปยอดการรับชำระด้วย Token และการยกเลิกรายการสินค้า`,
    sales,
    storeTotal: (store.id === "ST-01" ? storeSales.storeTotal : 0) + sales.filter((x) => x.amount !== undefined && x.status === "ชำระแล้ว").reduce((n, x) => n + (x.amount ?? 0), 0),
    priceNote: `ราคาสินค้าอ่านอย่างเดียวจาก Super Admin · ${store.product.sku} ${store.product.name} ${store.product.price} · แก้ไขราคาไม่ได้จากหน้านี้`,
    boothName: store.name,
    store: { id: store.id, name: store.name },
    stores: pos.stores.map((s) => ({ id: s.id, name: s.name })),
  };
}

const seededTopups = new Set(tokenHistory.records.map((r) => `${r.id}|${r.status}`));
const seededSales = new Set(storeSales.sales.map((r) => r.id));

/**
 * Money figures for Super Admin: the sample totals from finance-revenue.json
 * plus every ticket approval, top-up and sale recorded in the app since.
 */
function financeFigures(db: Db) {
  const approvedOrders = db.orders.filter((o) => o.status === "approved");
  const newTicketMoney = approvedOrders.reduce((n, o) => n + o.amount, 0);
  const newTickets = approvedOrders.reduce((n, o) => n + Math.max(o.ticketIds.length, o.qty), 0);
  const fresh = db.topups.filter((t) => t.status === "สำเร็จ" && !seededTopups.has(`${t.id}|${t.status}`));
  const newCash = fresh.filter((t) => t.channel === "เงินสด").reduce((n, t) => n + (t.received ?? 0), 0);
  const newBank = fresh.filter((t) => t.channel !== "เงินสด").reduce((n, t) => n + (t.received ?? 0), 0);
  const newSales = db.sales.filter((x) => !seededSales.has(x.id) && x.amount !== undefined);
  const newSpent = newSales.reduce((n, x) => n + (x.amount ?? 0), 0);

  const [ticketRow, cashRow, bankRow] = financeRevenue.revenue;
  const revenue = [
    { ...ticketRow, amount: ticketRow.amount + newTicketMoney },
    { ...cashRow, amount: cashRow.amount + newCash },
    { ...bankRow, amount: bankRow.amount + newBank },
  ];

  // spending per category: product category from the catalog, booth status from the store list
  const spending = financeRevenue.spendingByCategory.map((x) => ({ ...x }));
  for (const sale of newSales) {
    const booth = storePos.stores.find((b) => b.id === sale.storeId);
    const category = db.catalog.find((c) => c.sku === booth?.product.sku)?.category ?? "อื่นๆ";
    const row = spending.find((x) => x.category === category);
    if (row) row.tokens += sale.amount ?? 0;
    else spending.push({ category, tokens: sale.amount ?? 0, status: "เปิดขาย" });
  }
  spending.sort((a, b) => b.tokens - a.tokens);

  return {
    revenue,
    total: revenue.reduce((n, r) => n + r.amount, 0),
    tickets: { ...financeRevenue.tickets, count: financeRevenue.tickets.count + newTickets },
    tokens: { toppedUp: financeRevenue.tokens.toppedUp + newCash + newBank, spent: financeRevenue.tokens.spent + newSpent },
    spendingByCategory: spending,
  };
}

export async function getFinanceRevenue() {
  const f = financeFigures(readDb());
  return {
    ...financeRevenue,
    description: `ยอดที่ยืนยันแล้ว ณ ${nowHm()} น. • ดูรายรับเงินจริงแยกจากการหมุนเวียน Token (1 Token = 1 บาท)`,
    revenue: f.revenue,
    tickets: f.tickets,
    tokens: f.tokens,
    spendingByCategory: f.spendingByCategory,
  };
}

export async function getFinanceAttendance() {
  const db = readDb();
  return { ...financeAttendance, ...attendanceTotals(db), attendees: [...db.checkins, ...financeAttendance.attendees] };
}
