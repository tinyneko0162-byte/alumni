"use server";

import { redirect } from "next/navigation";
import roles from "@/data/admin/roles.json";
import shopProducts from "@/data/products.json";
import { addLog, findHolder, nextId, nowStamp, nowTime, readDb, shortWallet, updateDb, type CatalogProduct, type RoleKey, type ShipAddress, type Db, type StoreRow, type Wallet } from "@/lib/db";
import demo from "@/data/demo.json";
import financeAttendance from "@/data/admin/finance-attendance.json";
import { signTicket } from "@/lib/ticket-token";
import storePos from "@/data/admin/store-pos.json";
import { clearStaffSession, clearUserSession, getStaff, getStaffRole, getUser, setStaffSession, setUserSession } from "@/lib/session";
import { checkPassword, hashPassword, tempPassword } from "@/lib/password";

const isRole = (k: string): k is RoleKey => k in roles.roles;

/** Staff sign-in: username + password; the role comes from the account, not from the form. */
export async function loginStaff(username: string, password: string): Promise<{ ok: true; home: string } | { ok: false; error: string }> {
  const db = readDb();
  const s = db.staff.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
  if (!s || !checkPassword(password, s.pass)) return { ok: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  if (!s.active) return { ok: false, error: "บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อ Super Admin" };
  if (!db.roleEnabled[s.role]) return { ok: false, error: "บทบาทนี้ถูกปิดใช้งานโดย Super Admin กรุณาติดต่อผู้ดูแลระบบ" };
  await setStaffSession(s.id);
  updateDb((d) => addLog(d, { event: "เข้าสู่ระบบ", role: roles.roles[s.role].label, actor: s.name, ref: s.id }));
  // Store Operators land on their own store
  return { ok: true, home: s.role === "store" && s.storeId ? `/admin/store/pos?store=${s.storeId}` : roles.roles[s.role].home };
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
      storeCode: db.stores.find((x) => x.name === input.store)?.id ?? db.catalog.find((c) => c.store === input.store)?.storeCode ?? "ST-00",
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

// ---------- stores (Super Admin) ----------

const cleanStore = (v: { name: string; owner: string; detail: string }) => ({ name: v.name.trim(), owner: v.owner.trim(), detail: v.detail.trim() });

export async function createStore(input: { code: string; name: string; owner: string; detail: string }): Promise<Result<{ store: StoreRow }>> {
  if (!(await requireRole())) return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  const v = cleanStore(input);
  const code = input.code.trim().toUpperCase();
  if (!v.name || !v.owner) return { ok: false, error: "กรอกชื่อร้านและผู้ดูแลร้าน" };
  if (!/^ST-\d{2,3}$/.test(code)) return { ok: false, error: "รหัสร้านต้องเป็นรูปแบบ ST-05" };
  return updateDb((db) => {
    if (db.stores.some((x) => x.id === code)) return { ok: false as const, error: `มีรหัสร้าน ${code} อยู่แล้ว` };
    if (db.stores.some((x) => x.name === v.name)) return { ok: false as const, error: `มีร้านชื่อ ${v.name} อยู่แล้ว` };
    const store: StoreRow = { id: code, ...v, status: "open" };
    db.stores.push(store);
    db.stores.sort((a, b) => a.id.localeCompare(b.id));
    addLog(db, { event: `สร้างร้านค้า ${store.name}`, detail: `ผู้ดูแล ${store.owner}`, role: "Super Admin", actor: "สุ••", ref: code });
    return { ok: true as const, store };
  });
}

export async function updateStore(id: string, input: { name: string; owner: string; detail: string }): Promise<Result<{ store: StoreRow }>> {
  if (!(await requireRole())) return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  const v = cleanStore(input);
  if (!v.name || !v.owner) return { ok: false, error: "กรอกชื่อร้านและผู้ดูแลร้าน" };
  return updateDb((db) => {
    const st = db.stores.find((x) => x.id === id);
    if (!st) return { ok: false as const, error: "ไม่พบร้านค้า" };
    if (db.stores.some((x) => x.id !== id && x.name === v.name)) return { ok: false as const, error: `มีร้านชื่อ ${v.name} อยู่แล้ว` };
    Object.assign(st, v);
    for (const c of db.catalog) if (c.storeCode === id) c.store = st.name; // keep product pages in step
    addLog(db, { event: `แก้ไขข้อมูลร้าน ${st.name}`, detail: `ผู้ดูแล ${st.owner}`, role: "Super Admin", actor: "สุ••", ref: id });
    return { ok: true as const, store: { ...st } };
  });
}

/** Open or close a store. A closed store keeps its history but its booth cannot take payments. */
export async function setStoreStatus(id: string, status: "open" | "closed"): Promise<Result<{ store: StoreRow }>> {
  if (!(await requireRole())) return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  return updateDb((db) => {
    const st = db.stores.find((x) => x.id === id);
    if (!st) return { ok: false as const, error: "ไม่พบร้านค้า" };
    st.status = status;
    addLog(db, { event: `${status === "open" ? "เปิด" : "ปิด"}การขาย ${st.name}`, role: "Super Admin", actor: "สุ••", ref: id });
    return { ok: true as const, store: { ...st } };
  });
}

/** Delete only stores that never sold anything; otherwise they must be closed so the money trail stays intact. */
export async function deleteStore(id: string): Promise<Result> {
  if (!(await requireRole())) return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  return updateDb((db) => {
    const st = db.stores.find((x) => x.id === id);
    if (!st) return { ok: false as const, error: "ไม่พบร้านค้า" };
    const products = db.catalog.filter((c) => c.storeCode === id).length;
    const hasBooth = storePos.stores.some((b) => b.id === id) || db.sales.some((x) => x.storeId === id);
    if (products > 0 || hasBooth) return { ok: false as const, error: `ลบไม่ได้ ร้านนี้มีสินค้า ${products} รายการหรือมีประวัติการขาย ให้ปิดการขายแทน` };
    db.stores = db.stores.filter((x) => x.id !== id);
    addLog(db, { event: `ลบร้านค้า ${st.name}`, role: "Super Admin", actor: "สุ••", ref: id });
    return { ok: true as const };
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
  const seller = await getStaff();
  if (seller?.role === "store" && seller.storeId && seller.storeId !== input.storeId) return { ok: false, error: "บัญชีนี้ขายได้เฉพาะร้านของตัวเอง" };
  const st = storePos.stores.find((s) => s.id === input.storeId);
  const qty = Math.floor(input.qty);
  if (!st || !(qty > 0)) return { ok: false, error: "ข้อมูลการขายไม่ถูกต้อง" };
  return updateDb((db) => {
    const p = db.catalog.find((c) => c.sku === st.product.sku);
    const w = db.wallets.find((x) => x.id === input.walletId);
    if (db.stores.find((x) => x.id === st.id)?.status === "closed") return { ok: false as const, error: "ร้านนี้ถูก Super Admin ปิดการขายอยู่" };
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
  const user = await getUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
  return updateDb((db) => {
    const w = db.wallets.find((x) => x.id === user.walletId);
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
  const user = await getUser();
  if (!user) return [];
  return readDb().transfers.filter((t) => t.wallet === shortWallet(user.walletId)).slice(0, 5).map((t) => ({ id: t.id, amount: t.amount, state: t.state }));
}

// ---------- registration & ticket orders (attendee → ticketing staff) ----------

const normEmail = (e: string) => e.trim().toLowerCase();
const TOKENS_PER_TICKET = 200;

/** Wallet of an email address: the account's wallet, or one made ready for a friend who has no account yet. */
function walletFor(db: Db, email: string, owner: string): Wallet {
  const user = db.users.find((u) => normEmail(u.email) === normEmail(email));
  const existing = db.wallets.find((w) => (user && w.id === user.walletId) || (w.email && normEmail(w.email) === normEmail(email)));
  if (existing) return existing;
  // ids end in a unique 4-digit number because shops see only the last 4 digits (W-•••-1234)
  const used = new Set(db.wallets.map((w) => w.id.slice(-4)));
  let n = 1001;
  while (used.has(String(n))) n++;
  const w: Wallet = { id: `WLT-U26-${n}`, owner, balance: 0, status: "ใช้งานได้", email: normEmail(email) };
  db.wallets.push(w);
  return w;
}

export async function registerUser(input: { fullName: string; email: string; phone: string; password: string }): Promise<Result> {
  const name = input.fullName.trim();
  const email = normEmail(input.email);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "กรอกชื่อและอีเมลให้ถูกต้อง" };
  if (!(input.password.length >= 8 && /[A-Za-z]/.test(input.password) && /\d/.test(input.password))) return { ok: false, error: "รหัสผ่านอย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข" };
  const res = updateDb((db) => {
    if (db.users.some((u) => normEmail(u.email) === email)) return { ok: false as const, error: "อีเมลนี้ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ" };
    // a friend who already received a ticket keeps the wallet (and 200 Token) made for this email
    const w = walletFor(db, email, name);
    w.owner = name;
    const id = nextId("U", db.users.map((u) => u.id));
    db.users.push({ id, name: name.slice(0, 60), email, phone: input.phone.replace(/[\s-]/g, "").slice(0, 15), pass: hashPassword(input.password), walletId: w.id, createdAt: nowStamp() });
    addLog(db, { event: "ผู้ร่วมงานลงทะเบียนใหม่", detail: email, role: "ผู้ร่วมงาน", actor: name.slice(0, 40), ref: id });
    return { ok: true as const, id };
  });
  if (!res.ok) return res;
  await setUserSession(res.id);
  return { ok: true };
}

export async function loginUser(email: string, password: string): Promise<Result> {
  const u = readDb().users.find((x) => normEmail(x.email) === normEmail(email));
  if (!u || !checkPassword(password, u.pass)) return { ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  await setUserSession(u.id);
  return { ok: true };
}

export async function logoutUser() {
  await clearUserSession();
  redirect("/login");
}

export type OrderInput = {
  /** buyer's own entry ticket */
  self: boolean;
  /** friends the buyer pays a ticket for (one ticket each) */
  friends: { name: string; email: string; phone?: string }[];
  shirts: { size: string }[];
  delivery: "pickup" | "delivery";
  address: ShipAddress | null;
  slipFile: string;
};

const SIZES = new Set(shopProducts.shirt.sizes);

/**
 * Attendee sends the transfer slip; it appears in Ticketing › ตรวจสอบสลิปค่าบัตร.
 * The amount is worked out again here from the price list, so a changed page cannot underpay.
 */
export async function submitOrder(input: OrderInput): Promise<Result<{ id: string; amount: number }>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบก่อนส่งคำสั่งซื้อ" };
  const { name, email } = user;
  if (!input.slipFile?.trim()) return { ok: false, error: "กรุณาแนบสลิปก่อนส่ง" };

  const self = !!input.self;
  const friends = (input.friends ?? []).slice(0, 10).map((f) => ({ name: f.name?.trim() ?? "", email: f.email?.trim() ?? "", phone: f.phone?.trim() || undefined }));
  if (friends.some((f) => !f.name || !f.email.includes("@"))) return { ok: false, error: "กรอกชื่อและอีเมลของเพื่อนให้ครบทุกคน" };
  const shirts = (input.shirts ?? []).slice(0, 10).filter((x) => SIZES.has(x.size));
  if (!self && friends.length === 0 && shirts.length === 0) return { ok: false, error: "เลือกบัตรหรือเสื้ออย่างน้อย 1 รายการ" };
  // a buyer without their own ticket is not at the event, so the shirt can only be shipped
  const delivery = shirts.length ? (self ? input.delivery : "delivery") : undefined;
  const a = input.address;
  if (shirts.length && delivery === "delivery" && (!a || !a.name?.trim() || !a.line?.trim() || !a.province?.trim() || !/^\d{5}$/.test(a.zip ?? ""))) {
    return { ok: false, error: self ? "กรอกที่อยู่จัดส่งเสื้อให้ครบ" : "ไม่ได้ซื้อบัตรของตัวเองต้องส่งเสื้อที่บ้าน กรุณากรอกที่อยู่" };
  }

  const ticketQty = (self ? 1 : 0) + friends.length;
  const purchaseType: "ticket" | "shirt" | "both" = ticketQty && shirts.length ? "both" : ticketQty ? "ticket" : "shirt";
  const amount = ticketQty * shopProducts.ticket.price + shirts.length * shopProducts.shirt.price;
  const label = [ticketQty ? `บัตร ${ticketQty} ใบ` : "", shirts.length ? `เสื้อ ${shirts.length} ตัว` : ""].filter(Boolean).join(" + ");

  return updateDb((db) => {
    const id = nextId("TKT", db.orders.map((o) => o.id));
    const d = new Date();
    db.orders.unshift({
      id, submittedAt: d.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" }), name: name.slice(0, 60), email: email.slice(0, 80),
      ticketType: label, qty: ticketQty, amount, slipFile: input.slipFile.slice(0, 80), fromAccount: "xxx-x-xx482-1", paidAt: `${nowStamp()} น.`, ref: `SPU-T-${Math.floor(100 + Math.random() * 900)}`,
      duplicateRef: false, status: "pending", ticketIds: [], fromAttendee: true,
      purchaseType, self, friends, shirts, delivery, address: delivery === "delivery" ? a : null,
      shirtStatus: shirts.length ? "waiting" : undefined,
    });
    addLog(db, { event: `ผู้ร่วมงานส่งสลิป ${label} ฿${amount}`, role: "ผู้ร่วมงาน", actor: name.slice(0, 40), ref: id, result: "รอตรวจ" });
    return { ok: true as const, id, amount };
  });
}

/** Attendee polls this to see what ticketing staff decided. */
export async function orderStatus(id: string): Promise<{
  status: "pending" | "approved" | "rejected" | "unknown";
  link?: string;
  ticketIds?: string[];
  holders?: { ticketId: string; name: string; email: string }[];
  shirt?: { count: number; delivery?: string; status?: string };
  sentAt?: string;
  /** buyer also has their own ticket (it is listed first) */
  self?: boolean;
}> {
  const o = readDb().orders.find((x) => x.id === id);
  if (!o) return { status: "unknown" };
  const shirt = o.shirts?.length ? { count: o.shirts.length, delivery: o.delivery, status: o.shirtStatus } : undefined;
  if (o.status !== "approved") return { status: o.status, shirt, sentAt: o.paidAt };
  const holders = (o.holders ?? o.ticketIds.map((ticketId) => ({ ticketId, name: o.name, email: o.email }))).map(({ ticketId, name, email }) => ({ ticketId, name, email }));
  return { status: "approved", link: o.ticketIds[0] ? `/t/${signTicket(o.ticketIds[0])}` : undefined, ticketIds: o.ticketIds, holders, shirt, sentAt: o.paidAt, self: o.self !== false };
}

export async function resolveSlip(id: string, decision: "approve" | "reject"): Promise<Result<{ ticketIds: string[] }>> {
  if (!(await requireRole("ticketing"))) return { ok: false, error: "ไม่มีสิทธิ์ตรวจสลิป" };
  return updateDb((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o || o.status !== "pending") return { ok: false as const, error: "รายการนี้ถูกดำเนินการไปแล้ว" };
    if (decision === "approve") {
      o.status = "approved";
      // shirt-only orders get no ticket
      o.ticketIds = Array.from({ length: o.qty }, (_, i) => (i === 0 ? o.id : `${o.id}-${i + 1}`));
      // the buyer's own ticket first (when bought), then one per friend in the order they were entered
      const people = [...(o.self !== false ? [{ name: o.name, email: o.email, phone: undefined as string | undefined }] : []), ...(o.friends ?? [])];
      o.holders = o.ticketIds.map((ticketId, i) => {
        const p = people[i] ?? { name: o.name, email: o.email, phone: undefined };
        return { ticketId, name: p.name, email: p.email, phone: p.phone };
      });
      // every ticket comes with 200 Token in its holder's wallet (ready even before a friend signs up)
      for (const h of o.holders) {
        const w = walletFor(db, h.email, h.name);
        const before = w.balance;
        w.balance += TOKENS_PER_TICKET;
        db.topups.unshift({ id: nextId("BON", db.topups.filter((t) => t.id.startsWith("BON")).map((t) => t.id)), time: nowTime(), wallet: shortWallet(w.id), owner: w.owner, channel: "มากับบัตร", received: null, requested: null, tokens: TOKENS_PER_TICKET, staff: "ระบบ", status: "สำเร็จ", balanceBefore: before });
      }
      addLog(db, { event: `อนุมัติสลิป ${o.ticketType} ฿${o.amount}`, detail: o.ticketIds.length ? `ออกบัตร ${o.ticketIds.join(", ")}` : "ไม่มีบัตรเข้างาน (ซื้อเสื้ออย่างเดียว)", role: "Ticketing Officer", actor: "พั••", ref: o.id });
    } else {
      o.status = "rejected";
      addLog(db, { event: `ปฏิเสธสลิปค่าบัตร ฿${o.amount}`, role: "Ticketing Officer", actor: "พั••", ref: o.id });
    }
    return { ok: true as const, ticketIds: o.ticketIds };
  });
}

// ---------- gate check-in ----------

export async function checkIn(ticketId: string): Promise<Result<{ status: "ok" | "dup"; name: string; time: string; shirt?: string }>> {
  if (!(await requireRole("ticketing"))) return { ok: false, error: "ไม่มีสิทธิ์สแกนบัตร" };
  const id = ticketId.trim().toUpperCase();
  return updateDb((db) => {
    const seeded = financeAttendance.attendees.find((a) => a.ticket === id);
    const prior = db.checkins.find((a) => a.ticket === id);
    if (seeded || prior) return { ok: true as const, status: "dup" as const, name: (prior ?? seeded)!.name, time: (prior ?? seeded)!.time ?? "" };
    const holder = findHolder(db, id);
    const name = holder?.name ?? demo.tickets.find((t) => t.id === id)?.name;
    // the buyer's own ticket: remind the gate staff about shirts waiting to be picked up
    const o = holder?.order;
    const shirt = o && o.self !== false && o.ticketIds[0] === id && o.delivery === "pickup" && o.shirts?.length && o.shirtStatus !== "picked" ? `มีเสื้อรุ่นรอรับ ${o.shirts.map((x) => x.size).join(", ")}` : undefined;
    if (!name) return { ok: false as const, error: `ไม่พบบัตร ${id} ในระบบ หรือยังไม่ได้รับการอนุมัติ` };
    const time = nowTime();
    const recordId = nextId("ATT", [...db.checkins.map((a) => a.recordId), ...financeAttendance.attendees.map((a) => a.recordId)].filter((x): x is string => !!x));
    db.checkins.unshift({ name, initials: name.slice(0, 2), ticket: id, class: "ศิษย์เก่า", time, checkpoint: "ประตูหลัก", staff: "พั•• · จุดเช็กอิน", recordId });
    addLog(db, { event: "บันทึกเข้างาน · ประตูหลัก", role: "จุดเช็กอิน", actor: "พั••", ref: recordId });
    return { ok: true as const, status: "ok" as const, name, time, shirt };
  });
}

// ---------- shirt orders (Super Admin) ----------

/** Record that an order's shirts were handed over at the event or shipped. */
export async function setShirtStatus(orderId: string, status: "waiting" | "picked" | "shipped"): Promise<Result> {
  if (!(await requireRole())) return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  return updateDb((db) => {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o || !o.shirts?.length) return { ok: false as const, error: "ไม่พบออเดอร์เสื้อนี้" };
    if (o.status !== "approved") return { ok: false as const, error: "ออเดอร์นี้ยังไม่ได้อนุมัติการชำระเงิน" };
    o.shirtStatus = status;
    o.shirtUpdatedAt = nowStamp();
    const what = status === "shipped" ? "ส่งเสื้อแล้ว" : status === "picked" ? "มอบเสื้อที่หน้างานแล้ว" : "ย้อนสถานะเสื้อเป็นรอดำเนินการ";
    addLog(db, { event: `${what} ${o.shirts.length} ตัว`, detail: o.shirts.map((x) => x.size).join(", "), role: "Super Admin", actor: "สุ••", ref: o.id });
    return { ok: true as const };
  });
}

// ---------- staff accounts (Super Admin) ----------

export type StaffRow = { id: string; username: string; name: string; role: string; active: boolean; storeId?: string; station: string };

const ROLE_PREFIX: Record<string, string> = { super: "SA", ticketing: "TO", token: "TS", store: "SO" };

/** Create a staff account; the temporary password is returned once so it can be handed over. */
export async function createStaff(input: { name: string; username: string; role: string; storeId?: string; station?: string }): Promise<Result<{ staff: StaffRow; password: string }>> {
  if ((await getStaffRole()) !== "super") return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  if (!name || !/^[a-z0-9._-]{3,20}$/.test(username)) return { ok: false, error: "กรอกชื่อ และชื่อผู้ใช้ภาษาอังกฤษ/ตัวเลข 3–20 ตัว" };
  if (!isRole(input.role)) return { ok: false, error: "เลือกบทบาท" };
  const password = tempPassword();
  return updateDb((db) => {
    if (db.staff.some((x) => x.username === username)) return { ok: false as const, error: `มีชื่อผู้ใช้ ${username} แล้ว` };
    const store = input.role === "store" ? db.stores.find((x) => x.id === input.storeId) : undefined;
    if (input.role === "store" && !store) return { ok: false as const, error: "เลือกร้านที่ผู้ขายประจำ" };
    const prefix = ROLE_PREFIX[input.role];
    const id = nextId(prefix, db.staff.filter((x) => x.id.startsWith(prefix)).map((x) => x.id), 2);
    const row = { id, username, name, role: input.role as RoleKey, pass: hashPassword(password), active: true, storeId: store?.id, station: store?.name ?? (input.station?.trim() || "-") };
    db.staff.push(row);
    addLog(db, { event: `สร้างบัญชีพนักงาน ${name}`, detail: `${roles.roles[row.role].label} · ${username}`, role: "Super Admin", actor: "สุ••", ref: id });
    const { pass: _pass, ...out } = row;
    void _pass;
    return { ok: true as const, staff: out, password };
  });
}

/** Switch an account on/off. Accounts are never deleted so the system log keeps who did what. */
export async function setStaffActive(id: string, active: boolean): Promise<Result> {
  const me = await getStaff();
  if (me?.role !== "super") return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  if (me.id === id) return { ok: false, error: "ปิดบัญชีของตัวเองไม่ได้" };
  return updateDb((db) => {
    const s = db.staff.find((x) => x.id === id);
    if (!s) return { ok: false as const, error: "ไม่พบบัญชี" };
    s.active = active;
    addLog(db, { event: `${active ? "เปิด" : "ปิด"}ใช้งานบัญชี ${s.name}`, role: "Super Admin", actor: "สุ••", ref: id });
    return { ok: true as const };
  });
}

export async function resetStaffPassword(id: string): Promise<Result<{ password: string }>> {
  if ((await getStaffRole()) !== "super") return { ok: false, error: "เฉพาะ Super Admin เท่านั้น" };
  const password = tempPassword();
  return updateDb((db) => {
    const s = db.staff.find((x) => x.id === id);
    if (!s) return { ok: false as const, error: "ไม่พบบัญชี" };
    s.pass = hashPassword(password);
    addLog(db, { event: `ตั้งรหัสผ่านใหม่ให้ ${s.name}`, role: "Super Admin", actor: "สุ••", ref: id });
    return { ok: true as const, password };
  });
}
