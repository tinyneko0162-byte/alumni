# Handoff · ศิษย์เก่า (ระบบงานเลี้ยงรุ่นศิษย์เก่า)

เอกสารส่งต่องานสำหรับนักพัฒนาที่จะทำต่อ — สรุปว่าทำอะไรไปแล้ว อยู่ตรงไหน ยังขาดอะไร และควรทำอะไรต่อ

- **ดีไซน์:** Figma ไฟล์ `alumni` (`KYBN6A5dPf4jnZ9DLwypb4`) มี 2 หน้า: `user` (มือถือ) และ `admin` (เดสก์ท็อป)
- **สถานะ:** หน้าจอครบตามดีไซน์ ข้อมูลทั้งหมดเป็น **mock JSON** ยังไม่มี backend / ฐานข้อมูล / ระบบล็อกอินจริง
- **ตรวจแล้ว:** `tsc --noEmit` และ `eslint` ผ่าน · ทุก route ตอบ 200 · ทดสอบ flow ขายสินค้า → ชำระเงินในเบราว์เซอร์แล้ว · ยังไม่มี automated test

---

## 1. เริ่มต้นใช้งาน

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # ตรวจ build production
npm run lint
```

| เทคโนโลยี | เวอร์ชัน / หมายเหตุ |
|---|---|
| Next.js | 15.5 (App Router, Server Components) |
| React | 19.1 |
| Tailwind CSS | v4 (ตั้งค่า token ใน `src/app/globals.css` ผ่าน `@theme`) |
| TypeScript | strict |
| ฟอนต์ | `next/font/google`: Noto Sans Thai (400–800) + Inter (400–800) |

ไม่มี dependency เพิ่มนอกจากที่ `create-next-app` ให้มา

---

## 2. หน้าจอทั้งหมด ↔ Figma

### ผู้ร่วมงาน (มือถือ, กว้าง 402/430px)
| Route | Figma node | หมายเหตุ |
|---|---|---|
| `/` | สมัครสมาชิก `4069:292` | มี validation รหัสผ่าน + ยืนยันรหัส (แบบ `4270:5` ที่ไม่มีเบอร์โทร ไม่ได้ทำ) |
| `/shop` | เลือกซื้อบัตรและเสื้อ `4069:179` | เลือกประเภท/ไซซ์/จำนวน/การรับเสื้อ คำนวณยอดจริง |
| `/shop/friend` | เลือกซื้อบัตรและเสื้อ (เพื่อน) `4154:2` | สร้างฟอร์มตามจำนวนบัตรเพื่อน |
| `/checkout/payment` | โอนธนาคารและแนบสลิป `4069:88` | อัปโหลดไฟล์ฝั่ง client เท่านั้น (ตรวจขนาด ≤10MB) |
| `/checkout/status` | ส่งหลักฐานแล้ว รอตรวจสอบ `4069:2` | |
| `/me/ticket` | ผู้ร่วมงาน · บัตรของฉัน `4069:558` | QR เป็นรูป SVG ตัวอย่างจาก Figma |
| `/me/wallet` | ผู้ร่วมงาน · กระเป๋า Token `4069:465` | QR เป็นรูป SVG ตัวอย่างจาก Figma |
| `/me/history` | ผู้ร่วมงาน · ประวัติรายการ `4069:358` | |

### เจ้าหน้าที่ (เดสก์ท็อป 1440px, responsive ลงมือถือได้)
| Route | บทบาท | Figma node |
|---|---|---|
| `/admin/login` | Staff · เข้าสู่ระบบ | `57:266` (อีก 3 อัน `4322:*` เหมือนกัน) |
| `/admin/super/overview` | Super Admin · ภาพรวมระบบ | `4011:36883` |
| `/admin/super/stores` | Super Admin · จัดการและสร้างร้านค้า | `4011:37079` |
| `/admin/super/products` | Super Admin · สินค้าและราคา Token | `4011:37270` |
| `/admin/super/logs` | Super Admin · บันทึกระบบ | `4011:37486` |
| `/admin/finance/revenue` | Finance · รายได้ภายในงาน | `4011:38733` |
| `/admin/finance/attendance` | Finance · ประวัติการเข้าร่วม | `4011:38946` |
| `/admin/ticketing/slips` | Ticketing · ตรวจสลิปค่าบัตร | `4011:37710` |
| `/admin/ticketing/links` | Ticketing · ส่งลิงก์จากอีเมลบริษัท | `4011:37889` |
| `/admin/ticketing/scan` | Ticketing · สแกนบัตรเข้างาน | **ไม่มีดีไซน์** (มีแค่เมนู) → หน้า placeholder |
| `/admin/token/cash` | Token Staff · เติมเงินสดด้วย Wallet | `4011:38044` |
| `/admin/token/transfer` | Token Staff · ตรวจเงินโอน | `4011:38276` |
| `/admin/token/history` | Token Staff · ประวัติการเติม Token | `4019:2615` |
| `/admin/store/pos?store=ST-0x` | Store Operator · ขายสินค้าและตะกร้า | `4192:278` / `4192:447` / `4191:76` / `4192:549` (1 frame ต่อร้าน) |
| `/admin/store/checkout?store=ST-0x` | Store Operator · ชำระค่าสินค้า | `4214:927` / `4214:1094` / `4214:1261` / `4214:1428` |
| `/admin/store/history` | Store Operator · ประวัติการขาย | `4214:1561` |

> ในดีไซน์ หน้า Finance แสดงอยู่ใต้ sidebar ของ Super Admin (role = "super admin") จึงทำตามนั้น แต่ breadcrumb เขียนว่า "Finance"

---

## 3. โครงสร้างโค้ด

```
src/
  app/
    page.tsx, register-form.tsx      หน้าลงทะเบียน
    shop/, checkout/, me/            หน้าผู้ร่วมงาน
    admin/                           หน้าเจ้าหน้าที่ (แยกโฟลเดอร์ตามบทบาท)
      */page.tsx                     Server Component: ดึงข้อมูลจาก lib แล้วส่งให้ *-view.tsx
      */*-view.tsx                   Client Component: state/interaction
  components/
    ui/Icon.tsx                      <img> ของ SVG ใน public/icons
    user/                            MobileShell, CheckoutHeader, OrderSummary, FormField,
                                     PrimaryButton, BankAccount, SlipUpload, AttendeeNav(+Pill)
    admin/
      AdminShell.tsx                 sidebar ตามบทบาท + top bar + breadcrumb
      ui.tsx                         Chip, Panel, Metric, PageHeading, Field, SearchBox,
                                     DataTable, Guidance, Pagination, SelectButton, ปุ่มต่างๆ
      history.tsx                    Stat, FilterField, SelectField, Detail, LedgerStrip, downloadCsv
      SlipReceipt.tsx                สลิปโอนเงินจำลอง (ใช้ในหน้าตรวจเงินโอน)
  data/                              mock JSON
  lib/
    data.ts, admin-data.ts           ★ data access layer (จุดเดียวที่ต้องแก้ตอนต่อ DB)
    cart.ts, store-cart.ts           ตะกร้า (sessionStorage)
    format.ts                        num / baht / cx
public/
  icons/                             SVG ทั้งหมดจาก Figma (ชื่อขึ้นต้น a- = ฝั่ง admin)
  images/products/                   รูปสินค้าจาก Figma
```

**รูปแบบที่ใช้ทุกหน้า:** `page.tsx` (server) → `await getXxx()` จาก `lib/*-data.ts` → ส่ง props ให้ `*-view.tsx` (client)

---

## 4. ข้อมูล: mock → ฐานข้อมูล

### ไฟล์ mock
| ไฟล์ | ใช้ที่ | เนื้อหา |
|---|---|---|
| `data/event.json` | ผู้ร่วมงาน | ชื่องาน, บัญชีธนาคาร, อัตรา Token, กติกาไฟล์สลิป |
| `data/products.json` | `/shop` | ราคาบัตร 790, เสื้อ 390, ไซซ์, ตัวเลือกการรับเสื้อ |
| `data/order.json` | checkout | คำสั่งซื้อตัวอย่าง `CF26-0148` (ใช้เป็นค่าเริ่มต้นของตะกร้า) |
| `data/attendee.json` | `/me/*` | โปรไฟล์, บัตร, Wallet, ประวัติเติม/ใช้จ่าย, ใบเสร็จ |
| `data/admin/roles.json` | ทุกหน้า admin | ข้อมูลงาน, บัญชีที่ล็อกอิน, **เมนูของแต่ละบทบาท** |
| `data/admin/overview.json` | ภาพรวม | ค่าเริ่มต้นของกราฟเช็กอิน (KPI, คิวงาน, กิจกรรมล่าสุด คำนวณสดจาก db แล้ว) |
| `data/admin/stores.json` | จัดการร้าน | ร้านค้า + draft ฟอร์ม |
| `data/admin/products.json` | สินค้าและราคา | สินค้า/ราคา/stock |
| `data/admin/logs.json` | บันทึกระบบ | audit log |
| `data/admin/ticket-slips.json` | ตรวจสลิป | คำขอซื้อบัตรรอตรวจ + checklist |
| `data/admin/ticket-links.json` | ส่งลิงก์ | ข้อมูลอีเมล + ประวัติการส่ง |
| `data/admin/token-cash.json` | เติมเงินสด | Wallet ตัวอย่าง + รายการล่าสุด |
| `data/admin/token-transfers.json` | ตรวจเงินโอน | คำขอเติม Token ผ่านโอน |
| `data/admin/token-history.json` | ประวัติเติม | รายการเติม + audit trail |
| `data/admin/store-pos.json` | POS | 4 ร้าน (สินค้า/รูป/ผู้ขาย), Wallet ลูกค้า, รายการล่าสุด |
| `data/admin/store-sales.json` | ประวัติการขาย | ใบเสร็จการขาย |
| `data/admin/finance-revenue.json` | รายได้ | ยอดตั้งต้น + บวกรายการจริงจาก db (อนุมัติบัตร, เติม Token, ขาย) |
| `data/admin/finance-attendance.json` | การเข้าร่วม | รายชื่อ + เวลาเช็กอิน |

### วิธีต่อฐานข้อมูล
แก้ **เฉพาะ** เนื้อในฟังก์ชันใน `src/lib/data.ts` และ `src/lib/admin-data.ts` ให้คืนข้อมูลรูปแบบเดิม (type อนุมานจาก JSON ด้วย `typeof`) เช่น

```ts
// ก่อน
export async function getStores() { return stores; }
// หลัง (ตัวอย่าง Prisma)
export async function getStores() {
  const rows = await prisma.store.findMany();
  return { ...storesMeta, stores: rows };
}
```

เมื่อเลิกใช้ JSON แล้ว แนะนำให้ประกาศ type จริง (หรือ zod schema) แทน `typeof json`

### การกระทำที่ยังเป็น mock (ต้องทำ API/Server Action)
| การกระทำ | ไฟล์ | ตอนนี้ทำอะไร |
|---|---|---|
| ลงทะเบียน / ล็อกอินผู้ใช้ | `app/register-form.tsx` | ตรวจฟอร์มแล้ว `router.push('/shop')` |
| ตะกร้า / คำสั่งซื้อ | `lib/cart.ts` | เก็บใน `sessionStorage` |
| อัปโหลดสลิป | `components/user/SlipUpload.tsx` | อ่านชื่อ/ขนาดไฟล์อย่างเดียว ไม่อัปโหลด |
| ล็อกอินพนักงาน | `app/admin/login/login-form.tsx` | ไม่มีการตรวจรหัส มี dropdown เลือกบทบาท |
| สร้าง/แก้ไข/เปิด-ปิด/ลบร้าน, แก้ราคา | `admin/super/*/…-view.tsx` → `lib/actions.ts` | บันทึกลง `.data/db.json` แล้ว (ร้านที่ปิดรับชำระที่ POS ไม่ได้, ลบได้เฉพาะร้านที่ไม่มีสินค้า/ประวัติขาย) |
| อนุมัติสลิป, ส่งอีเมล | `admin/ticketing/*` | แก้ state ในหน้า |
| เติม Token (สด/โอน) | `admin/token/*` | แก้ state ในหน้า, สแกน QR เป็นปุ่มจำลอง |
| ขาย/ตัด Wallet | `admin/store/*`, `lib/store-cart.ts` | sessionStorage + state |
| ส่งออก CSV | `components/admin/history.tsx` → `downloadCsv` | สร้าง CSV ฝั่ง client จากข้อมูลที่แสดง |
| ส่งออก PDF ใบเสร็จ | `admin/store/history` | ใช้ `window.print()` ชั่วคราว |

---

## 5. ดีไซน์ / สไตล์

- **Token สี/ฟอนต์** อยู่ใน `src/app/globals.css` (`--color-brand`, `--color-admin-*` ฯลฯ) ใช้เป็นคลาส Tailwind เช่น `bg-brand`, `text-admin-muted`
- **ฟอนต์:** ตัวแปร `--font-noto-thai` / `--font-inter` ผูกที่ `<html>` (`app/layout.tsx`) และใช้ `@theme inline` — ถ้าย้ายไป `<body>` ฟอนต์จะหาย (เคยเป็นบั๊กมาแล้ว)
  - ข้อความไทยทั่วไป = `font-sans` (Noto Sans Thai ก่อน)
  - ตัวเลข/ข้อความที่ Figma ตั้งเป็น Inter = คลาส `font-latin`
- **ไอคอน:** ส่งออกจาก Figma ทีละสี (ไม่ใช้ `currentColor`) เมนู sidebar มี 2 ไฟล์ต่อไอคอน: `a-<name>.svg` (เทา) และ `a-<name>-active.svg` (ขาว) — เพิ่มเมนูใหม่ต้องมีทั้งสองไฟล์
- **สิ่งที่ตั้งใจไม่ทำตาม Figma:** แถบสถานะ iOS/Home indicator ในหน้ามือถือ (เป็นกรอบโทรศัพท์จำลอง), จุดสถานะ 5px ใช้ CSS แทน SVG

---

## 6. ข้อจำกัด / ความไม่ตรงกันที่รู้อยู่

- ตัวเลขตัวอย่างใน Figma บางจุดไม่สอดคล้องกัน (เช่น Wallet 1,120 vs ประวัติ 130, ช่องทางเติมเงินในหน้าประวัติ) — ข้อมูล JSON เก็บค่าตาม Figma แต่ตัวเลขสรุปบางกล่องคำนวณจากรายการจริงจึงอาจต่างจาก Figma
- ไม่มีการป้องกันสิทธิ์ (route ใดก็เข้าได้) ต้องเพิ่ม middleware ตามบทบาทเมื่อมี auth
- QR บัตร/Wallet เป็นรูปตัวอย่าง ไม่ได้สร้างจากข้อมูล
- Pagination เป็นแบบคงที่ (ยังไม่แบ่งหน้าจริง)
- `next.config.ts` มี `allowedDevOrigins: ["*.trycloudflare.com"]` ไว้สำหรับเปิดผ่าน Cloudflare quick tunnel ตอน dev — ลบได้ถ้าไม่ใช้
- `.claude/launch.json` เป็นค่าสำหรับ Claude Code preview (ไม่กระทบแอป)

---

## 7. งานที่แนะนำให้ทำต่อ (ตามลำดับ)

1. **ฐานข้อมูล + schema** — ตารางหลักที่เห็นจากหน้าจอ: `users`, `orders` / `order_items`, `tickets`, `payment_slips`, `wallets`, `wallet_transactions` (topup/debit พร้อม balance before/after), `stores`, `products`, `sales` / `sale_items`, `checkins`, `staff` + `roles`, `audit_logs`, `email_dispatches`
2. **Auth** — ผู้ร่วมงาน (อีเมล+รหัสผ่าน) และพนักงานแยกบทบาท (super / ticketing / token / store / finance) + middleware กันหน้า `/admin/*`
3. **Server Actions / API** สำหรับทุกแถวในตาราง "การกระทำที่ยังเป็น mock" — โดยเฉพาะการตัด/เติม Wallet ต้องเป็น transaction และกันการทำซ้ำ (idempotency key)
4. **อัปโหลดไฟล์สลิป** ไปที่ storage (S3/R2/Supabase) + ตรวจเลขอ้างอิงซ้ำ
5. **สร้าง QR จริง** สำหรับบัตรเข้างานและ Wallet และหน้าสแกน (`/admin/ticketing/scan`, ปุ่มสแกนในหน้า Token/Store) ด้วยกล้อง
6. **ส่งอีเมล** ลิงก์บัตรจากอีเมลบริษัท
7. รอดีไซน์หน้า "สแกนบัตรเข้างาน"
