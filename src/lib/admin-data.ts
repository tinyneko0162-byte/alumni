/**
 * Admin data access layer — same idea as src/lib/data.ts.
 * Swap each function body for a database query later; pages stay the same.
 */
import roles from "@/data/admin/roles.json";
import overview from "@/data/admin/overview.json";
import stores from "@/data/admin/stores.json";
import products from "@/data/admin/products.json";
import logs from "@/data/admin/logs.json";
import { readDb, currentEvent, eventOf, FIRST_EVENT, type Db, type EventRow } from "@/lib/db";
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
  const db = readDb();
  const ev = currentEvent(db);
  const status = ev.status === "open" ? "งานที่เปิดอยู่" : "ปิดงานแล้ว";
  return {
    ...roles,
    event: { ...roles.event, name: ev.name, dateLong: ev.dateLong, dateShort: ev.dateShort, time: ev.time, venue: ev.venue, environment: `${ev.dateShort}, ${status}`, footer: `${ev.name}, ระบบเจ้าหน้าที่` },
    enabled: db.roleEnabled,
  };
}

const nowHm = () => new Date().toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });

/** Approved tickets and check-ins: sample numbers from the JSON plus everything done in the app since. */
/** Sample numbers from the JSON belong to the first event only; later events start from zero. */
const scope = (db: Db, ev: EventRow = currentEvent(db)) => ({ ev, first: ev.id === FIRST_EVENT, mine: (x: { eventId?: string }) => eventOf(x) === ev.id });

function attendanceTotals(db: Db, ev?: EventRow) {
  const { first, mine } = scope(db, ev);
  const approved = (first ? financeAttendance.approved : 0) + db.orders.filter((o) => o.status === "approved" && mine(o)).reduce((n, o) => n + o.ticketIds.length, 0);
  return { approved, checkedIn: (first ? financeAttendance.checkedIn : 0) + db.checkins.filter(mine).length };
}

export async function getOverview() {
  const db = readDb();
  const fin = financeFigures(db);
  const att = attendanceTotals(db);
  const { first, mine } = scope(db);
  const pendingSlips = db.orders.filter((o) => o.status === "pending" && mine(o)).length;
  const pendingTransfers = db.transfers.filter((t) => t.state === "pending" && mine(t)).length;
  const live: Record<string, number> = { "/admin/ticketing/slips": pendingSlips, "/admin/token/transfer": pendingTransfers };

  // new check-ins go into 15-minute slots next to the sample ones
  const slots = first ? overview.attendance.slots.map((x) => ({ ...x })) : [];
  for (const c of db.checkins.filter(mine)) {
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
      { label: "Token ใช้จ่ายในร้าน", value: fin.tokens.spent.toLocaleString("en-US"), note: "หน่วย Token, ไม่ใช่รายรับเงินบาท" },
      { label: "รายการรอตรวจสอบ", value: String(pendingSlips + pendingTransfers), note: `สลิปค่าบัตร ${pendingSlips}, เติม Token ${pendingTransfers}`, noteTone: pendingSlips + pendingTransfers > 0 ? "warning" : undefined },
    ],
    attendance: { total: att.checkedIn, updatedAt: `${nowHm()} น.`, slots },
    queues: overview.queues.map((q) => {
      const count = live[q.href] ?? q.count;
      return { ...q, count, note: count === 0 ? "ไม่มีรายการค้าง" : q.note };
    }),
    activity: db.logs.slice(0, 5).map((l, i) => ({ key: `${i}-${l.ref}`, time: l.time, action: l.event, actor: l.role, ref: l.ref, result: l.result })),
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
  const ok = events.filter((e) => e.result === "สำเร็จ" || e.result === "ส่งแล้ว").length;
  const waiting = events.filter((e) => e.result === "รอตรวจ").length;
  const failed = events.length - ok - waiting;
  return {
    ...logs,
    events,
    total: events.length,
    metrics: [
      { label: "เหตุการณ์ทั้งหมด", value: events.length.toLocaleString("en-US"), note: "เก็บล่าสุด 200 รายการ" },
      { label: "ดำเนินการสำเร็จ", value: ok.toLocaleString("en-US"), note: "รวมการขาย เติมเงิน และเช็กอิน" },
      { label: "รอตรวจ / ไม่สำเร็จ", value: `${waiting} / ${failed}`, note: failed ? "มีรายการไม่สำเร็จ ตรวจสอบด้านล่าง" : "ไม่มีรายการผิดพลาด", noteTone: failed ? "warning" : undefined },
    ],
  };
}

export async function getTicketSlips() {
  const db = readDb();
  const { mine } = scope(db);
  const orders = db.orders.filter(mine);
  const pending = orders.filter((o) => o.status === "pending");
  const approved = orders.filter((o) => o.status === "approved");
  return { ...ticketSlips, requests: pending, approved, pendingCount: pending.length, approvedCount: ticketSlips.approvedCount, approvedBase: ticketSlips.approvedCount };
}

export async function getTicketLinks() {
  const db = readDb();
  const sent = new Set(db.linkHistory.map((h) => h.ticketId));
  // every ticket holder (buyer and each friend) of approved orders who has not been sent a link yet
  const waiting = db.orders
    .filter((o) => o.status === "approved" && o.ticketIds.length > 0)
    .flatMap((o) => (o.holders ?? o.ticketIds.map((ticketId) => ({ ticketId, name: o.name, email: o.email }))).map((h) => ({ ...h, order: o })))
    .filter((h) => !sent.has(h.ticketId));
  const h = waiting[0];
  const current = h
    ? { ticketId: h.ticketId, recipientName: h.name, recipientShort: h.name.split(" ")[0], email: h.email, amount: h.ticketId === h.order.id ? h.order.amount : 790, linkRef: `LINK-${h.ticketId.slice(-4)}`, linkMasked: `event.example/t/••••-${h.ticketId.slice(-4)}` }
    : ticketLinks.current;
  return { ...ticketLinks, current, waiting: waiting.length, history: db.linkHistory };
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
    .sales.filter((s) => (s.storeId ?? "ST-01") === store.id && (s.status === "ชำระแล้ว" || s.status === "ยกเลิก")) // ระบบมีแค่ 2 สถานะนี้จริง
    .map((s) => ({
      ...s,
      productName: s.productName ?? (store.id === "ST-01" ? storeSales.product.name : store.product.name),
      unitPrice: s.unitPrice ?? (store.id === "ST-01" ? storeSales.product.price : store.product.price),
    }));
  return {
    ...storeSales,
    description: `${store.name}, สรุปยอดการรับชำระด้วย Token และการยกเลิกรายการสินค้า`,
    sales,
    storeTotal: (store.id === "ST-01" ? storeSales.storeTotal : 0) + sales.filter((x) => x.amount !== undefined && x.status === "ชำระแล้ว").reduce((n, x) => n + (x.amount ?? 0), 0),
    priceNote: `ราคาสินค้าอ่านอย่างเดียวจาก Super Admin, ${store.product.sku} ${store.product.name} ${store.product.price}, แก้ไขราคาไม่ได้จากหน้านี้`,
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
function financeFigures(db: Db, event?: EventRow) {
  const { first, mine } = scope(db, event);
  const approvedOrders = db.orders.filter((o) => o.status === "approved" && mine(o));
  const newTicketMoney = approvedOrders.reduce((n, o) => n + o.amount, 0);
  const newTickets = approvedOrders.reduce((n, o) => n + o.ticketIds.length, 0);
  const newShirts = approvedOrders.reduce((n, o) => n + (o.shirts?.length ?? 0), 0);
  const fresh = db.topups.filter((t) => t.status === "สำเร็จ" && !seededTopups.has(`${t.id}|${t.status}`) && mine(t));
  // Token left in wallets when the event closed (minus lines written by closeEvent)
  const expired = -fresh.filter((t) => t.channel === "หมดอายุ").reduce((n, t) => n + t.tokens, 0);
  const newCash = fresh.filter((t) => t.channel === "เงินสด").reduce((n, t) => n + (t.received ?? 0), 0);
  const newBank = fresh.filter((t) => t.channel === "โอนธนาคาร").reduce((n, t) => n + (t.received ?? 0), 0);
  // 200 Token that come with each ticket: Token in wallets, but the money is already in the ticket price
  const newBonus = fresh.filter((t) => t.channel === "มากับบัตร").reduce((n, t) => n + t.tokens, 0);
  const newSales = db.sales.filter((x) => !seededSales.has(x.id) && x.amount !== undefined && mine(x));
  const newSpent = newSales.reduce((n, x) => n + (x.amount ?? 0), 0);

  const [ticketRow, cashRow, bankRow] = financeRevenue.revenue;
  const revenue = [
    { ...ticketRow, type: newShirts ? "ค่าบัตรเข้างานและเสื้อรุ่น" : ticketRow.type, amount: (first ? ticketRow.amount : 0) + newTicketMoney },
    { ...cashRow, amount: (first ? cashRow.amount : 0) + newCash },
    { ...bankRow, amount: (first ? bankRow.amount : 0) + newBank },
  ];

  // spending per category: product category from the catalog, booth status from the store list
  const spending = first ? financeRevenue.spendingByCategory.map((x) => ({ ...x })) : [];
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
    tickets: { ...financeRevenue.tickets, count: (first ? financeRevenue.tickets.count : 0) + newTickets, shirts: newShirts },
    tokens: { toppedUp: (first ? financeRevenue.tokens.toppedUp : 0) + newCash + newBank + newBonus, spent: (first ? financeRevenue.tokens.spent : 0) + newSpent, expired },
    spendingByCategory: spending,
  };
}

export async function getFinanceRevenue() {
  const f = financeFigures(readDb());
  return {
    ...financeRevenue,
    description: `ยอดที่ยืนยันแล้ว ณ ${nowHm()} น., ดูรายรับเงินจริงแยกจากการหมุนเวียน Token (1 Token = 1 บาท)`,
    revenue: f.revenue,
    tickets: f.tickets,
    tokens: f.tokens,
    spendingByCategory: f.spendingByCategory,
  };
}

export async function getFinanceAttendance() {
  const db = readDb();
  const { first, mine } = scope(db);
  return { ...financeAttendance, ...attendanceTotals(db), attendees: [...db.checkins.filter(mine), ...(first ? financeAttendance.attendees : [])] };
}

/** Every order that includes shirts, for Super Admin › ออเดอร์เสื้อรุ่น. */
export async function getShirtOrders() {
  const orders = readDb()
    .orders.filter((o) => o.shirts?.length)
    .map((o) => ({
      id: o.id,
      name: o.name,
      email: o.email,
      submittedAt: o.submittedAt,
      paid: o.status,
      sizes: o.shirts!.map((x) => x.size),
      delivery: o.delivery ?? "pickup",
      address: o.address ?? null,
      hasTicket: o.self !== false && o.qty > 0, // buyer comes to the event
      shirtStatus: o.shirtStatus ?? "waiting",
      shirtUpdatedAt: o.shirtUpdatedAt ?? "",
    }));
  return { orders, sizes: ["S", "M", "L", "XL", "2XL"] };
}

/** Every event with its headline numbers, for Super Admin › จัดการงาน. */
export async function getEvents() {
  const db = readDb();
  const current = currentEvent(db);
  const events = [...db.events].reverse().map((ev) => {
    const f = financeFigures(db, ev);
    const a = attendanceTotals(db, ev);
    return { ...ev, revenue: f.total, tickets: a.approved, checkedIn: a.checkedIn, spent: f.tokens.spent, expired: ev.expiredTokens ?? f.tokens.expired };
  });
  // what closing the open event would do right now
  const open = db.events.find((e) => e.status === "open");
  const preview = open
    ? { wallets: db.wallets.filter((w) => w.balance > 0).length, tokens: db.wallets.reduce((n, w) => n + Math.max(0, w.balance), 0), tickets: attendanceTotals(db, open).approved }
    : null;
  return { events, currentId: current.id, open: open ?? null, preview };
}
