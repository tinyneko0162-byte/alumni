/**
 * Data access layer.
 *
 * Every page reads data only through these functions. Right now they return
 * the mock JSON files in src/data. When the database is ready, replace the
 * body of each function with a real query (Prisma, fetch to an API, …) and
 * keep the same return shape — no page needs to change.
 */
import event from "@/data/event.json";
import products from "@/data/products.json";
import order from "@/data/order.json";
import demo from "@/data/demo.json";
import { redirect } from "next/navigation";
import { readDb, shortWallet, currentEvent, eventOf, FIRST_EVENT, type User } from "@/lib/db";
import { getUser } from "@/lib/session";
import financeAttendance from "@/data/admin/finance-attendance.json";
import tokenHistory from "@/data/admin/token-history.json";
import storeSales from "@/data/admin/store-sales.json";
import attendee from "@/data/attendee.json";

export type EventInfo = typeof event;
export type Products = typeof products;
export type Order = typeof order;
export type Attendee = Omit<typeof attendee, "history"> & {
  history: Omit<(typeof attendee)["history"], "receipt" | "topUps" | "purchases"> & {
    receipt: (typeof attendee)["history"]["receipt"] | null;
    topUps: (typeof attendee)["history"]["topUps"];
    purchases: (typeof attendee)["history"]["purchases"];
  };
};

/** Event details for the attendee pages: the current event from the database on top of event.json. */
export async function getEvent(): Promise<EventInfo & { open: boolean; closedName?: string }> {
  const ev = currentEvent(readDb());
  return { ...event, id: ev.id, name: ev.name, open: ev.status === "open", closedName: ev.status === "closed" ? ev.name : undefined };
}

export async function getProducts(): Promise<Products> {
  return products;
}

export async function getCurrentOrder(): Promise<Order> {
  return order;
}

const seededTopups = new Set(tokenHistory.records.map((r) => `${r.id}|${r.status}`));
const seededSales = new Set(storeSales.sales.map((r) => r.id));
const fmt = (n: number) => n.toLocaleString("en-US");
const same = (a = "", b = "") => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The signed-in attendee, or a redirect to the sign-in page (then back to `next`). */
export async function requireUser(next: string): Promise<User> {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export type MyTicket = { number: string; orderId: string; orderQty: number; buyer: string; holder: string; status: string; gift: boolean; eventName: string; expired: boolean };

/** Tickets that belong to this person: bought for themselves, or bought for them by a friend (matched by email). */
export async function getMyTickets(user: User): Promise<MyTicket[]> {
  const db = readDb();
  const checked = new Set([...db.checkins.map((c) => c.ticket), ...financeAttendance.attendees.map((a) => a.ticket)]);
  const evName = (id: string) => db.events.find((e) => e.id === id)?.name ?? id;
  const closed = (id: string) => db.events.find((e) => e.id === id)?.status === "closed";
  const status = (id: string, evId: string) => (closed(evId) ? "หมดอายุ (งานปิดแล้ว)" : checked.has(id) ? "เช็กอินแล้ว" : "ชำระแล้ว, ยังไม่เช็กอิน");
  const mine: MyTicket[] = [];
  for (const o of db.orders) {
    if (o.status !== "approved") continue;
    for (const h of o.holders ?? o.ticketIds.map((ticketId) => ({ ticketId, name: o.name, email: o.email }))) {
      const ev = eventOf(o);
      if (same(h.email, user.email)) mine.push({ number: h.ticketId, orderId: o.id, orderQty: o.ticketIds.length, buyer: o.name, holder: h.name, status: status(h.ticketId, ev), gift: !same(o.email, user.email), eventName: evName(ev), expired: closed(ev) });
    }
  }
  // the sample account also owns the sample ticket from the design
  if (user.walletId === demo.wallet.id) {
    const t = attendee.ticket;
    mine.push({ number: t.number, orderId: t.orderId, orderQty: t.orderQty, buyer: user.name, holder: user.name, status: status(t.number, FIRST_EVENT), gift: false, eventName: evName(FIRST_EVENT), expired: closed(FIRST_EVENT) });
  }
  // tickets of the open event first, past events after
  return mine.sort((a, b) => Number(a.expired) - Number(b.expired));
}

/**
 * Profile, wallet and history of the signed-in attendee. The sample account keeps the design's
 * sample history; every account adds the top-ups, ticket Tokens and purchases recorded in the app.
 */
export async function getAttendee(user: User): Promise<Attendee> {
  const db = readDb();
  const w = db.wallets.find((x) => x.id === user.walletId) ?? { id: user.walletId, owner: user.name, balance: 0, status: "ใช้งานได้" };
  const short = shortWallet(w.id);
  const sample = w.id === demo.wallet.id;
  const base = sample
    ? attendee.history
    : { ...attendee.history, currentBalance: 0, topUpTotal: 0, spendTotal: 0, dayLabel: "วันงาน", topUps: [] as typeof attendee.history.topUps, purchases: [] as typeof attendee.history.purchases, receipt: null };

  const channel = (c: string) => (c === "เงินสด" ? "เติมผ่านเจ้าหน้าที่ (เงินสด)" : c === "มากับบัตร" ? "Token ที่มากับบัตรเข้างาน" : "เติมด้วยตัวเอง (โอนเงิน)");
  const mineTopups = db.topups.filter((t) => t.wallet === short && t.status === "สำเร็จ" && !seededTopups.has(`${t.id}|${t.status}`));
  const expiries = mineTopups
    .filter((t) => t.channel === "หมดอายุ")
    .map((t) => ({ id: t.id, label: `Token หมดอายุเมื่อปิด${db.events.find((e) => e.id === eventOf(t))?.name ?? "งาน"}`, time: t.time.slice(0, 5), balanceAfter: 0, amount: -t.tokens }));
  const topUps = mineTopups
    .filter((t) => t.channel !== "หมดอายุ")
    .map((t) => ({ id: t.id, label: channel(t.channel), time: t.time.slice(0, 5), balanceAfter: (t.balanceBefore ?? 0) + t.tokens, amount: t.tokens }));
  const sales = db.sales.filter((x) => x.wallet === short && !seededSales.has(x.id) && x.amount !== undefined && x.status === "ชำระแล้ว");
  const purchases = sales.map((x) => ({ id: x.id, label: `${x.productName} × ${x.qty}`, time: x.time.slice(0, 5), balanceAfter: x.balanceBefore - (x.amount ?? 0), amount: x.amount ?? 0 }));

  const topUpTotal = base.topUpTotal + topUps.reduce((n, t) => n + t.amount, 0);
  const spendTotal = base.spendTotal + purchases.reduce((n, t) => n + t.amount, 0) + expiries.reduce((n, t) => n + t.amount, 0);
  // ยอดตั้งต้นของกระเป๋า (เช่น กระเป๋าทดลองที่เริ่มด้วย 2,500) = ยอดปัจจุบัน − (เติม − ใช้)
  const initial = sample ? 0 : Math.max(0, w.balance - (topUpTotal - spendTotal));
  const last = sales[0];
  const store = last && db.stores.find((x) => x.id === last.storeId);
  const receipt = last
    ? { shop: store?.name ?? "ร้านค้า", time: last.time.slice(0, 5), line: `${last.productName} ${last.qty} × ${last.unitPrice}`, amount: last.amount ?? 0, balanceBefore: last.balanceBefore, balanceAfter: last.balanceBefore - (last.amount ?? 0), status: "ชำระสำเร็จ", footer: `ผู้ขาย ${last.seller}, ${last.storeId}, ใบเสร็จ ${last.id}` }
    : base.receipt;

  const first = user.name.split(" ")[0] ?? user.name;
  return {
    ...attendee,
    profile: sample ? attendee.profile : { fullName: user.name, maskedName: user.name, shortMasked: first, email: user.email },
    wallet: { ...attendee.wallet, id: w.id, shortId: short, balance: w.balance },
    history: {
      ...base,
      currentBalance: w.balance,
      topUpTotal,
      spendTotal,
      formula: `ยอดเริ่มต้น ${fmt(initial)} + เติม ${fmt(topUpTotal)} − ใช้ ${fmt(spendTotal)} = ${fmt(initial + topUpTotal - spendTotal)}`,
      topUps: [...topUps, ...base.topUps],
      purchases: [...expiries, ...purchases, ...base.purchases],
      receipt,
    },
  };
}
