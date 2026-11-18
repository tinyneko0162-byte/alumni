"use server";

import { redirect } from "next/navigation";
import roles from "@/data/admin/roles.json";
import { addLog, nextId, nowStamp, nowTime, readDb, shortWallet, updateDb, type CatalogProduct, type RoleKey } from "@/lib/db";
import demo from "@/data/demo.json";
import financeAttendance from "@/data/admin/finance-attendance.json";
import { signTicket } from "@/lib/ticket-token";
import storePos from "@/data/admin/store-pos.json";
import { clearStaffSession, getStaffRole, setStaffSession } from "@/lib/session";

const isRole = (k: string): k is RoleKey => k in roles.roles;

export async function loginStaff(role: string): Promise<{ ok: true; home: string } | { ok: false; error: string }> {
  if (!isRole(role)) return { ok: false, error: "ไม่พบบทบาทนี้" };
  if (!readDb().roleEnabled[role]) return { ok: false, error: "บทบาทนี้ถูกปิดใช้งานโดย Super Admin กรุณาติดต่อผู้ดูแลระบบ" };
  await setStaffSession(role);
  return { ok: true, home: roles.roles[role].home };
}

export async function logoutStaff() {
  await clearStaffSession();
  redirect("/admin/login");
}

/** Super Admin only: switch a staff role on/off. Super Admin itself can never be switched off. */
export async function setRoleEnabled(role: string, enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  if ((await getStaffRole()) !== "super") return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  if (!isRole(role) || role === "super") return { ok: false, error: "ปิดบทบาทนี้ไม่ได้" };
  updateDb((db) => {
    db.roleEnabled[role] = enabled;
    addLog(db, {
      event: `${enabled ? "เปิด" : "ปิด"}ใช้งานบทบาท ${roles.roles[role].label}`,
      role: "Super Admin",
      actor: "สุ••",
      ref: `ROLE-${role.toUpperCase()}`,
    });
  });
  return { ok: true };
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function requireRole(...allowed: RoleKey[]): Promise<RoleKey | null> {
  const r = await getStaffRole();
  return r && (r === "super" || allowed.includes(r)) && readDb().roleEnabled[r] ? r : null;
}

// ---------- products (Super Admin) ----------

export async function saveProduct(sku: string, patch: { price: number; stock: number; status: string }): Promise<Result<{ product: CatalogProduct }>> {
  if (!(await requireRole())) return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  if (!Number.isFinite(patch.price) || patch.price <= 0 || !Number.isFinite(patch.stock) || patch.stock < 0) return { ok: false, error: "ราคาหรือ Stock ไม่ถูกต้อง" };
  return updateDb((db) => {
    const p = db.catalog.find((x) => x.sku === sku);
    if (!p) return { ok: false as const, error: "ไม่พบสินค้า" };
    const priceChanged = p.price !== patch.price;
    Object.assign(p, { price: Math.round(patch.price), stock: Math.round(patch.stock), status: patch.status, updatedAt: nowStamp() });
    addLog(db, { event: priceChanged ? `ปรับราคา ${p.name}` : `แก้ไขสินค้า ${p.name}`, detail: `${p.price} Token / ${p.unit} · Stock ${p.stock} · ${p.status}`, role: "Super Admin", actor: "สุ••", ref: p.sku });
    return { ok: true as const, product: { ...p } };
  });
}

export async function createProduct(input: { name: string; store: string; category: string; price: number; stock: number }): Promise<Result<{ product: CatalogProduct }>> {
  if (!(await requireRole())) return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  if (!input.name.trim() || !Number.isFinite(input.price) || input.price <= 0) return { ok: false, error: "กรอกชื่อและราคาให้ถูกต้อง" };
  return updateDb((db) => {
    const sku = nextId("NEW", db.catalog.map((c) => c.sku), 2);
    const p: CatalogProduct = {
      sku,
      name: input.name.trim(),
      store: input.store,
      storeCode: db.catalog.find((c) => c.store === input.store)?.storeCode ?? "ST-00",
      category: input.category,
      price: Math.round(input.price),
      stock: Math.max(0, Math.round(input.stock) || 0),
      unit: "ชิ้น",
      status: "ขายอยู่",
      updatedAt: nowStamp(),
    };
    db.catalog.push(p);
    addLog(db, { event: `เพิ่มสินค้า ${p.name}`, detail: `${p.price} Token / ${p.unit}`, role: "Super Admin", actor: "สุ••", ref: sku });
    return { ok: true as const, product: p };
  });
}

// ---------- wallets & POS ----------

/** Used by the store scanner: find a wallet by the id inside its QR code. */
export async function lookupWallet(id: string): Promise<Result<{ wallet: { id: string; owner: string; balance: number; status: string } }>> {
  if (!(await requireRole("store", "token"))) return { ok: false, error: "ไม่มีสิทธิ์" };
  const w = readDb().wallets.find((x) => x.id.toLowerCase() === id.trim().toLowerCase());
  return w ? { ok: true, wallet: w } : { ok: false, error: "ไม่พบ Wallet นี้ในระบบ" };
}

export async function payPos(input: { storeId: string; walletId: string; qty: number }): Promise<Result<{ saleId: string; balance: number; total: number; stock: number }>> {
  if (!(await requireRole("store"))) return { ok: false, error: "ไม่มีสิทธิ์ขายสินค้า" };
  const st = storePos.stores.find((s) => s.id === input.storeId);
  const qty = Math.floor(input.qty);
  if (!st || !(qty > 0)) return { ok: false, error: "ข้อมูลการขายไม่ถูกต้อง" };
  return updateDb((db) => {
    const p = db.catalog.find((c) => c.sku === st.product.sku);
    const w = db.wallets.find((x) => x.id === input.walletId);
    if (!p || p.status !== "ขายอยู่") return { ok: false as const, error: "สินค้านี้หยุดขายอยู่" };
    if (!w) return { ok: false as const, error: "ไม่พบ Wallet" };
    if (p.stock < qty) return { ok: false as const, error: `สินค้าเหลือ ${p.stock} ${p.unit} ไม่พอ` };
    const total = p.price * qty;
    if (w.balance < total) return { ok: false as const, error: `ยอด Token ไม่พอ (มี ${w.balance} ต้องการ ${total})` };
    const before = w.balance;
    w.balance -= total;
    p.stock -= qty;
    const id = nextId("SALE", db.sales.map((s) => s.id));
    const time = nowTime();
    db.sales.unshift({
      id, time, qty, wallet: shortWallet(w.id), customer: w.owner, seller: st.operator.name.split(" ")[0], status: "ชำระแล้ว", balanceBefore: before,
      sellerCode: st.id, pos: `POS-${st.id.slice(-2)}`, debitId: id.replace("SALE", "DEBIT"),
      audit: `${time} ตรวจพบ Wallet และยอดเพียงพอ → ตัดยอด ${total} Token (${p.name} × ${qty}) สำเร็จ`,
      storeId: st.id, productName: p.name, unitPrice: p.price, amount: total,
    });
    addLog(db, { event: `ขายสินค้า · ${total} Token`, detail: `${p.name} × ${qty} · ${shortWallet(w.id)}`, role: "Store Operator", actor: `${st.operator.name.split(" ")[0]} · ${st.id}`, ref: id });
    return { ok: true as const, saleId: id, balance: w.balance, total, stock: p.stock };
  });
}

// ---------- token top-up ----------

export async function cashTopup(input: { walletId: string; amount: number }): Promise<Result<{ id: string; balance: number }>> {
  if (!(await requireRole("token"))) return { ok: false, error: "ไม่มีสิทธิ์เติม Token" };
  const amount = Math.floor(input.amount);
  if (!(amount > 0)) return { ok: false, error: "จำนวนเงินไม่ถูกต้อง" };
  return updateDb((db) => {
    const w = db.wallets.find((x) => x.id === input.walletId);
    if (!w) return { ok: false as const, error: "ไม่พบ Wallet" };
    const before = w.balance;
    w.balance += amount;
    const id = nextId("TOP", db.topups.map((t) => t.id));
    db.topups.unshift({ id, time: nowTime(), wallet: shortWallet(w.id), owner: w.owner, channel: "เงินสด", received: amount, requested: amount, tokens: amount, staff: "อร••", status: "สำเร็จ", balanceBefore: before });
    addLog(db, { event: `เติมเงินสด ฿${amount} · +${amount} Token`, role: "Token Staff", actor: "อร••", ref: id });
    return { ok: true as const, id, balance: w.balance };
  });
}

export async function resolveTransfer(id: string, decision: "done" | "resubmit"): Promise<Result<{ balance?: number }>> {
  if (!(await requireRole("token"))) return { ok: false, error: "ไม่มีสิทธิ์ตรวจเงินโอน" };
  return updateDb((db) => {
    const t = db.transfers.find((x) => x.id === id);
    if (!t || t.state !== "pending") return { ok: false as const, error: "รายการนี้ถูกดำเนินการไปแล้ว" };
    t.state = decision;
    if (decision === "done") {
      const w = db.wallets.find((x) => shortWallet(x.id) === t.wallet || x.id === t.wallet);
      const before = w?.balance ?? t.balance;
      if (w) w.balance += t.amount;
      db.topups.unshift({ id: t.id, time: nowTime(), wallet: t.wallet, owner: t.owner, channel: "โอนธนาคาร", received: t.amount, requested: t.amount, tokens: t.amount, staff: "อร••", status: "สำเร็จ", balanceBefore: before });
      addLog(db, { event: `เติมเงินโอน ฿${t.amount} · +${t.amount} Token`, role: "Token Staff", actor: "อร••", ref: t.id });
      return { ok: true as const, balance: w?.balance };
    }
    addLog(db, { event: `ขอหลักฐานการโอนใหม่ ฿${t.amount}`, role: "Token Staff", actor: "อร••", ref: t.id });
    return { ok: true as const };
  });
}

// ---------- attendee → staff ----------

/** Attendee asks for a top-up by bank transfer; it shows up in Token Staff › ตรวจเงินโอน. */
export async function requestTopup(input: { amount: number; slipFile: string }): Promise<Result<{ id: string }>> {
  const amount = Math.floor(input.amount);
  if (!(amount >= 20 && amount <= 50000)) return { ok: false, error: "ระบุจำนวนเงิน 20 – 50,000 บาท" };
  if (!input.slipFile.trim()) return { ok: false, error: "กรุณาแนบสลิป" };
  return updateDb((db) => {
    const w = db.wallets.find((x) => x.id === demo.wallet.id);
    if (!w) return { ok: false as const, error: "ไม่พบ Wallet ของคุณ" };
    const id = nextId("TOP", [...db.transfers.map((t) => t.id), ...db.topups.map((t) => t.id)]);
    db.transfers.unshift({
      id, time: nowTime().slice(0, 5), wallet: shortWallet(w.id), owner: w.owner, amount, balance: w.balance,
      slipFile: input.slipFile.slice(0, 80), fromAccount: "ธนาคารตัวอย่าง • xxx-x-xx482-1", paidAt: nowStamp().replace(" · ", " · ") + " น.",
      reference: `TRX-••••-${Math.floor(1000 + Math.random() * 9000)}`, state: "pending",
    });
    addLog(db, { event: `ผู้ร่วมงานส่งหลักฐานเติม Token ฿${amount}`, detail: shortWallet(w.id), role: "ผู้ร่วมงาน", actor: w.owner, ref: id, result: "รอตรวจ" });
    return { ok: true as const, id };
  });
}

/** Status of this attendee's top-up requests (newest first). */
export async function myTopups(): Promise<{ id: string; amount: number; state: string }[]> {
  return readDb().transfers.filter((t) => t.wallet === shortWallet(demo.wallet.id) && t.owner === demo.wallet.owner).slice(0, 5).map((t) => ({ id: t.id, amount: t.amount, state: t.state }));
}

// ---------- registration & ticket orders (attendee → ticketing staff) ----------

export async function registerUser(input: { fullName: string; email: string }): Promise<{ ok: boolean }> {
  updateDb((db) => {
    addLog(db, { event: "ผู้ร่วมงานลงทะเบียนใหม่", detail: input.email.slice(0, 40), role: "ผู้ร่วมงาน", actor: input.fullName.slice(0, 40), ref: "REG" });
  });
  return { ok: true };
}

/** Attendee sends the transfer slip for a ticket order; it appears in Ticketing › ตรวจสอบสลิปค่าบัตร. */
export async function submitOrder(input: { name: string; email: string; ticketType: string; qty: number; amount: number; slipFile: string }): Promise<Result<{ id: string }>> {
  const qty = Math.floor(input.qty);
  const amount = Math.round(input.amount);
  if (!input.name.trim() || !input.email.includes("@") || !(qty > 0) || !(amount > 0) || !input.slipFile.trim()) return { ok: false, error: "ข้อมูลคำสั่งซื้อไม่ครบ" };
  return updateDb((db) => {
    const id = nextId("TKT", db.orders.map((o) => o.id));
    const d = new Date();
    db.orders.unshift({
      id, submittedAt: d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }), name: input.name.trim().slice(0, 60), email: input.email.trim().slice(0, 80),
      ticketType: input.ticketType, qty, amount, slipFile: input.slipFile.slice(0, 80), fromAccount: "xxx-x-xx482-1", paidAt: `${nowStamp()} น.`, ref: `SPU-T-${Math.floor(100 + Math.random() * 900)}`,
      duplicateRef: false, status: "pending", ticketIds: [], fromAttendee: true,
    });
    addLog(db, { event: `ผู้ร่วมงานส่งสลิปค่าบัตร ฿${amount}`, role: "ผู้ร่วมงาน", actor: input.name.slice(0, 40), ref: id, result: "รอตรวจ" });
    return { ok: true as const, id };
  });
}

/** Attendee polls this to see what ticketing staff decided. */
export async function orderStatus(id: string): Promise<{ status: "pending" | "approved" | "rejected" | "unknown"; link?: string; ticketIds?: string[] }> {
  const o = readDb().orders.find((x) => x.id === id);
  if (!o) return { status: "unknown" };
  return o.status === "approved" ? { status: "approved", link: `/t/${signTicket(o.ticketIds[0] ?? o.id)}`, ticketIds: o.ticketIds } : { status: o.status };
}

export async function resolveSlip(id: string, decision: "approve" | "reject"): Promise<Result<{ ticketIds: string[] }>> {
  if (!(await requireRole("ticketing"))) return { ok: false, error: "ไม่มีสิทธิ์ตรวจสลิป" };
  return updateDb((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o || o.status !== "pending") return { ok: false as const, error: "รายการนี้ถูกดำเนินการไปแล้ว" };
    if (decision === "approve") {
      o.status = "approved";
      o.ticketIds = Array.from({ length: o.qty }, (_, i) => (i === 0 ? o.id : `${o.id}-${i + 1}`));
      addLog(db, { event: `อนุมัติสลิปค่าบัตร ฿${o.amount}`, role: "Ticketing Officer", actor: "พั••", ref: o.id });
    } else {
      o.status = "rejected";
      addLog(db, { event: `ปฏิเสธสลิปค่าบัตร ฿${o.amount}`, role: "Ticketing Officer", actor: "พั••", ref: o.id });
    }
    return { ok: true as const, ticketIds: o.ticketIds };
  });
}

// ---------- gate check-in ----------

export async function checkIn(ticketId: string): Promise<Result<{ status: "ok" | "dup"; name: string; time: string }>> {
  if (!(await requireRole("ticketing"))) return { ok: false, error: "ไม่มีสิทธิ์สแกนบัตร" };
  const id = ticketId.trim().toUpperCase();
  return updateDb((db) => {
    const seeded = financeAttendance.attendees.find((a) => a.ticket === id);
    const prior = db.checkins.find((a) => a.ticket === id);
    if (seeded || prior) return { ok: true as const, status: "dup" as const, name: (prior ?? seeded)!.name, time: (prior ?? seeded)!.time ?? "" };
    const order = db.orders.find((o) => o.status === "approved" && o.ticketIds.includes(id));
    const name = order?.name ?? demo.tickets.find((t) => t.id === id)?.name;
    if (!name) return { ok: false as const, error: `ไม่พบบัตร ${id} ในระบบ หรือยังไม่ได้รับการอนุมัติ` };
    const time = nowTime();
    const recordId = nextId("ATT", [...db.checkins.map((a) => a.recordId), ...financeAttendance.attendees.map((a) => a.recordId)].filter((x): x is string => !!x));
    db.checkins.unshift({ name, initials: name.slice(0, 2), ticket: id, class: "ศิษย์เก่า", time, checkpoint: "ประตูหลัก", staff: "พั•• · จุดเช็กอิน", recordId });
    addLog(db, { event: "บันทึกเข้างาน · ประตูหลัก", role: "จุดเช็กอิน", actor: "พั••", ref: recordId });
    return { ok: true as const, status: "ok" as const, name, time };
  });
}
