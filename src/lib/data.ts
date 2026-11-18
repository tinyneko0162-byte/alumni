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
import { readDb, shortWallet } from "@/lib/db";
import tokenHistory from "@/data/admin/token-history.json";
import storeSales from "@/data/admin/store-sales.json";
import attendee from "@/data/attendee.json";

export type EventInfo = typeof event;
export type Products = typeof products;
export type Order = typeof order;
export type Attendee = typeof attendee;

export async function getEvent(): Promise<EventInfo> {
  return event;
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

/**
 * The demo attendee: sample history from attendee.json, plus every top-up and purchase
 * staff recorded for this wallet in the app, so wallet, history and receipts always agree.
 */
export async function getAttendee(): Promise<Attendee> {
  const db = readDb();
  const w = db.wallets.find((x) => x.id === demo.wallet.id);
  if (!w) return attendee;
  const short = shortWallet(w.id);
  const h = attendee.history;

  const topUps = db.topups
    .filter((t) => t.wallet === short && t.status === "สำเร็จ" && !seededTopups.has(`${t.id}|${t.status}`))
    .map((t) => ({ id: t.id, label: t.channel === "เงินสด" ? "เติมผ่านเจ้าหน้าที่ (เงินสด)" : "เติมด้วยตัวเอง (โอนเงิน)", time: t.time.slice(0, 5), balanceAfter: (t.balanceBefore ?? 0) + t.tokens, amount: t.tokens }));
  const sales = db.sales.filter((x) => x.wallet === short && !seededSales.has(x.id) && x.amount !== undefined);
  const purchases = sales.map((x) => ({ id: x.id, label: `${x.productName} × ${x.qty}`, time: x.time.slice(0, 5), balanceAfter: x.balanceBefore - (x.amount ?? 0), amount: x.amount ?? 0 }));

  const topUpTotal = h.topUpTotal + topUps.reduce((n, t) => n + t.amount, 0);
  const spendTotal = h.spendTotal + purchases.reduce((n, t) => n + t.amount, 0);
  const last = sales[0];
  const store = last && db.stores.find((x) => x.id === last.storeId);
  const receipt = last
    ? { shop: store?.name ?? "ร้านค้า", time: last.time.slice(0, 5), line: `${last.productName} ${last.qty} × ${last.unitPrice}`, amount: last.amount ?? 0, balanceBefore: last.balanceBefore, balanceAfter: last.balanceBefore - (last.amount ?? 0), status: "ชำระสำเร็จ", footer: `ผู้ขาย ${last.seller} • ${last.storeId} • ใบเสร็จ ${last.id}` }
    : h.receipt;

  return {
    ...attendee,
    wallet: { ...attendee.wallet, id: w.id, balance: w.balance },
    history: {
      ...h,
      currentBalance: w.balance,
      topUpTotal,
      spendTotal,
      formula: `ยอดเริ่มต้น 0 + เติม ${fmt(topUpTotal)} − ใช้ ${fmt(spendTotal)} = ${fmt(topUpTotal - spendTotal)}`,
      topUps: [...topUps, ...h.topUps],
      purchases: [...purchases, ...h.purchases],
      receipt,
    },
  };
}
