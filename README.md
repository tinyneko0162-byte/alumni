# ศิษย์เก่า · ระบบงานเลี้ยงรุ่น

เว็บ Next.js (App Router + Tailwind v4) ที่สร้างตาม Figma **alumni** ตอนนี้ข้อมูลทุกอย่างมาจากไฟล์ JSON จำลอง (mock)

```bash
npm install
npm run dev
```

## หน้าทั้งหมด

### ผู้ร่วมงาน (มือถือ · Figma หน้า `user`)
| เส้นทาง | หน้าจอ |
|---|---|
| `/` | สมัครสมาชิก / ลงทะเบียน |
| `/shop` | เลือกซื้อบัตรและเสื้อ (ตะกร้า คำนวณยอดได้จริง) |
| `/shop/friend` | กรอกข้อมูลเพื่อน |
| `/checkout/payment` | โอนธนาคารและแนบสลิป |
| `/checkout/status` | ส่งหลักฐานแล้ว รอตรวจสอบ |
| `/me/ticket` · `/me/wallet` · `/me/history` | บัตรของฉัน · กระเป๋า Token · ประวัติรายการ |

### เจ้าหน้าที่ (เดสก์ท็อป · Figma หน้า `admin`)
| เส้นทาง | บทบาท / หน้าจอ |
|---|---|
| `/admin/login` | เข้าสู่ระบบพนักงาน (มีช่องเลือกบทบาทสำหรับข้อมูลจำลอง) |
| `/admin/super/overview` · `stores` · `products` · `logs` | Super Admin |
| `/admin/finance/revenue` · `attendance` | Finance (อยู่ในเมนู Super Admin ตามดีไซน์) |
| `/admin/ticketing/slips` · `links` · `scan` | Ticketing Officer (`scan` ยังไม่มีดีไซน์) |
| `/admin/token/cash` · `transfer` · `history` | Token Staff |
| `/admin/store/pos` · `checkout` · `history` | Store Operator (`?store=ST-01..04` เปลี่ยนร้าน) |

## ข้อมูลจำลอง → ฐานข้อมูล

- ไฟล์ข้อมูลอยู่ที่ `src/data/*.json` (ฝั่งผู้ใช้) และ `src/data/admin/*.json` (ฝั่งเจ้าหน้าที่)
- ทุกหน้าอ่านข้อมูลผ่าน `src/lib/data.ts` และ `src/lib/admin-data.ts` เท่านั้น
  ฟังก์ชันเป็น `async` อยู่แล้ว เวลาต่อฐานข้อมูลให้เปลี่ยนแค่เนื้อในฟังก์ชัน (เช่น query Prisma / fetch API) โดยคงรูปแบบข้อมูลเดิม หน้าเว็บไม่ต้องแก้
- ตะกร้า/สถานะชั่วคราวเก็บใน `sessionStorage` (`src/lib/cart.ts`, `src/lib/store-cart.ts`) — แทนที่ด้วย API ภายหลัง
- การกระทำต่างๆ (อนุมัติสลิป, เติม Token, ชำระเงิน, สร้างร้าน ฯลฯ) ทำงานในหน้าเว็บแต่ยังไม่บันทึกลงที่ใด

## โครงสร้าง

```
src/
  app/                 หน้าเว็บ (ผู้ใช้ + /admin)
  components/user/     ส่วนประกอบหน้ามือถือ
  components/admin/    AdminShell (sidebar/top bar), ui.tsx, history.tsx, SlipReceipt
  components/ui/Icon   แสดงไอคอน SVG ที่ส่งออกจาก Figma (public/icons)
  data/                ไฟล์ JSON จำลอง
  lib/                 ตัวอ่านข้อมูล + ตะกร้า + ตัวช่วยจัดรูปแบบ
public/icons, public/images/products   ไฟล์ภาพจาก Figma
```
