"use client";

import { useMemo, useState } from "react";
import { Detail, FilterField, LedgerStrip, SelectField, Stat, downloadCsv } from "@/components/admin/history";
import { BrandButton, Chip, Guidance, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getStoreSales } from "@/lib/admin-data";
import { cx } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getStoreSales>>;
type Sale = Data["sales"][number] & { debitId?: string; audit?: string };

const amt = (s: { qty: number; unitPrice?: number; amount?: number }) => s.amount ?? s.qty * (s.unitPrice ?? 0);
const fmt = (n: number) => n.toLocaleString("en-US");

/** ไม่มีปุ่มเลือกร้านในหน้านี้ — ร้านมาจากหน้าขายสินค้า (cookie alumni-store) */
export function SalesView({ data }: { data: Data }) {
  const sales = data.sales as Sale[];
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [applied, setApplied] = useState({ q: "", status: "all" });
  const [selectedId, setSelectedId] = useState(sales[0]?.id ?? "");

  const shown = useMemo(
    () => sales.filter((s) => (applied.status === "all" || s.status === applied.status) && (s.id + s.wallet).includes(applied.q.trim())),
    [sales, applied],
  );
  const paid = shown.filter((s) => s.status === "ชำระแล้ว");
  const paidTokens = paid.reduce((t, s) => t + amt(s), 0);
  const paidQty = paid.reduce((t, s) => t + s.qty, 0);
  const pct = shown.length ? Math.round((paid.length / shown.length) * 100) : 0;

  const sel = sales.find((s) => s.id === selectedId) ?? sales[0];
  const selTotal = sel ? amt(sel) : 0;
  const isPaid = sel?.status === "ชำระแล้ว";

  return (
    <>
      <PageHeading
        title="ประวัติการขาย"
        description={data.description}
        actions={
          <BrandButton
            icon="a-download-white"
            onClick={() =>
              downloadCsv("sales-history.csv", [
                ["เวลา", "ใบเสร็จ", "จำนวน", "ยอด (Token)", "Wallet", "ผู้ขาย", "สถานะ"],
                ...shown.map((s) => [s.time, s.id, s.qty, amt(s), s.wallet, s.seller, s.status]),
              ])
            }
          >
            ส่งออกประวัติ
          </BrandButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="ยอดขายยืนยันตามตัวกรอง" value={`${fmt(paidTokens)} Token`} note={`${paid.length} ใบเสร็จชำระแล้ว, เทียบเท่า ฿${fmt(paidTokens)}`} dark />
        <Stat label="สินค้าขายสำเร็จตามตัวกรอง" value={`${paidQty} ชิ้น`} note="นับเฉพาะใบเสร็จที่ตัด Token สำเร็จ" />
        <Stat label="สถานะการขาย" value={`${pct}%`} note={`ทำรายการสำเร็จ ${paid.length} จาก ${shown.length} รายการ`} />
      </div>

      <Panel>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ q, status });
          }}
        >
          <FilterField label="ค้นหาเลขที่รายการ / Wallet ID" className="min-w-[200px] flex-1">
            <Icon name="a-search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-admin-muted" />
          </FilterField>
          <FilterField label="วันที่ขาย" className="w-[200px]">
            <Icon name="a-calendar-days" size={16} />
            <span className="flex-1 text-[12px]">{data.date}</span>
            <Icon name="a-chevron-down" size={14} />
          </FilterField>
          <FilterField label="ช่วงเวลา" className="w-[175px]">
            <span className="flex-1 text-[12px]">{data.timeRange}</span>
            <Icon name="a-chevron-down" size={14} />
          </FilterField>
          <SelectField
            label="สถานะการชำระ"
            className="w-[175px]"
            value={status}
            onChange={setStatus}
            options={[["all", "ทุกสถานะ"], ["ชำระแล้ว", "ชำระแล้ว"], ["รอชำระ", "รอชำระ"], ["ไม่สำเร็จ", "ไม่สำเร็จ"]]}
          />
          <BrandButton type="submit">ใช้ตัวกรอง</BrandButton>
        </form>
        <div className="flex flex-wrap justify-between gap-2 text-[11px] leading-[1.55]">
          <p className="text-admin-muted">ผลลัพธ์ {shown.length} รายการ, {data.store.name}, เรียงเวลาล่าสุดก่อน, ยอดสรุปนับเฉพาะชำระแล้ว</p>
          <button
            type="button"
            className="text-admin-indigo hover:underline"
            onClick={() => {
              setQ("");
              setStatus("all");
              setApplied({ q: "", status: "all" });
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      </Panel>

      <Panel title="รายการขายทั้งหมด">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-[12px] leading-[1.55]">
            <thead>
              <tr className="text-[11px] text-admin-muted">
                {["วัน / เวลา", "เลขที่ใบเสร็จ / รายการสินค้า", "กล่อง", "ยอด (Token)", "Wallet ลูกค้า", "ผู้ขาย", "สถานะ"].map((h, i, a) => (
                  <th key={h} className={cx("bg-admin-head px-3 py-2.5 font-semibold", i === 0 && "rounded-l-md", i === a.length - 1 && "rounded-r-md")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => {
                const on = s.id === sel?.id;
                const ok = s.status === "ชำระแล้ว";
                return (
                  <tr key={s.id} onClick={() => setSelectedId(s.id)} className={cx("cursor-pointer text-admin-ink", on ? "bg-brand-tint" : "bg-white hover:bg-admin-head")}>
                    <td className="h-[66px] border-b border-admin-line px-3">
                      <p>{s.time}</p>
                      <p className="text-[10px] text-admin-muted">{data.date}</p>
                    </td>
                    <td className="border-b border-admin-line px-3">
                      <p className={on ? "font-semibold text-black" : "font-medium"}>{s.id}</p>
                      <p className="text-[10px] text-admin-muted">
                        {s.productName} ×{s.qty}
                      </p>
                    </td>
                    <td className="border-b border-admin-line px-3">{s.qty}</td>
                    <td className={cx("border-b border-admin-line px-3", ok && "font-semibold text-black")}>{amt(s)}</td>
                    <td className="border-b border-admin-line px-3">{s.wallet}</td>
                    <td className="border-b border-admin-line px-3">{s.seller}</td>
                    <td className="border-b border-admin-line px-3">
                      <Chip tone={ok ? "ok" : s.status === "รอชำระ" ? "warn" : "danger"}>{s.status}</Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] leading-[1.55] text-admin-muted">
          <p>
            แสดง 1–{shown.length} จาก {shown.length} รายการ, ยอดขายยืนยันหน้านี้ {fmt(paidTokens)} Token / {paidQty} ชิ้น
          </p>
          <div className="flex items-center gap-2">
            <span>10 รายการ / หน้า</span>
            <span className="flex size-[30px] items-center justify-center rounded-md bg-admin-indigo-tint text-[12px] font-semibold text-admin-indigo">1</span>
            <span>หน้าเดียว</span>
          </div>
        </div>
        <Guidance>{data.note}</Guidance>
      </Panel>

      {sel ? (
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel className="min-h-[514px] xl:w-[622px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5 leading-[1.55]">
              <p className="text-[16px] font-semibold text-admin-ink">ใบเสร็จ {sel.id}</p>
              <p className="text-[11px] text-admin-muted">{data.boothName}</p>
            </div>
            <Chip tone={isPaid ? "ok" : "warn"}>{sel.status}</Chip>
          </div>
          <Detail label="วันและเวลาขาย" value={`${data.date}, ${sel.time} น.`} />
          <div>
            <div className="flex gap-3 bg-admin-head py-2 text-[11px] text-admin-muted">
              <p className="flex-1 pl-2">สินค้า</p>
              <p>Token/ชิ้น</p>
              <p className="w-[65px] text-center">จำนวน</p>
              <p className="w-[78px] pr-2 text-right">รวม Token</p>
            </div>
            <div className="flex items-center gap-3 border-b border-admin-line py-3">
              <div className="flex flex-1 flex-col gap-0.5 pl-2 leading-[1.55]">
                <p className="text-[13px] font-medium text-admin-ink">{sel.productName}</p>
                <p className="text-[10px] text-admin-muted">
                  {data.store.id}, {sel.productName}
                </p>
              </div>
              <p className="text-[12px] text-admin-ink">{sel.unitPrice ?? "-"}</p>
              <p className="w-[65px] text-center text-[12px] text-admin-ink">{sel.qty}</p>
              <p className="w-[78px] pr-2 text-right text-[13px] font-semibold text-admin-ink">{selTotal}</p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between leading-[1.55]">
            <div className="flex flex-col gap-0.5">
              <p className="text-[12px] font-semibold text-admin-ink">รวมชำระ</p>
              <p className="text-[11px] text-admin-muted">1 รายการ, {sel.qty} ชิ้น, 1 Token = ฿1</p>
            </div>
            <p className="text-[28px] font-semibold text-black">{selTotal} Token</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] leading-[1.55] text-admin-muted">สำเนาใบเสร็จ, ปกปิดข้อมูลลูกค้า</p>
            <BrandButton icon="a-download-white" className="border border-admin-indigo" onClick={() => window.print()}>
              ส่งออกใบเสร็จ PDF
            </BrandButton>
          </div>
        </Panel>

        <Panel title="การตัด Token และผู้ดำเนินการ" aside={<Icon name="a-shield-check-indigo" size={18} />} className="flex-1">
          <Detail label="Wallet ลูกค้า" value={`${sel.wallet}, ${sel.customer}`} />
          <LedgerStrip
            className="bg-brand"
            labelClass="text-[#4a4d55]"
            items={[
              { label: "ก่อนชำระ", value: fmt(sel.balanceBefore) },
              { label: "ตัดชำระ", value: isPaid ? `-${selTotal}` : "0" },
              { label: "หลังชำระ", value: fmt(isPaid ? sel.balanceBefore - selTotal : sel.balanceBefore) },
            ]}
          />
          <Detail label="ผู้ขาย / เครื่องขาย" value={`${sel.seller}, ${sel.sellerCode} / ${sel.pos}`} />
          <Detail label="รายการตัด Wallet" value={sel.debitId ? `${sel.debitId}, ยืนยันครั้งเดียว` : "ยังไม่ตัดยอด"} />
          <div className="h-px bg-admin-line" />
          <div className="flex flex-col gap-[7px] leading-[1.55]">
            <p className="text-[12px] font-semibold text-admin-ink">ลำดับการชำระ</p>
            <p className="text-[11px] text-admin-muted">{sel.audit ?? (isPaid ? `${sel.time} ${sel.seller} ยืนยันยอด ${selTotal} Token → ตัดยอดสำเร็จและออกใบเสร็จ` : "รอลูกค้าสแกน Wallet เพื่อชำระ")}</p>
            {isPaid ? (
              <p className="text-[11px] text-admin-ok">บันทึกการขายและตัด Wallet สำเร็จ, ไม่มีการตัดซ้ำ</p>
            ) : (
              <p className="text-[11px] text-admin-warn">ยังไม่ตัด Token, ยอด Wallet ไม่เปลี่ยน</p>
            )}
          </div>
        </Panel>
      </div>
      ) : (
        <Panel><p className="py-6 text-center text-[13px] text-admin-muted">ร้านนี้ยังไม่มีรายการขาย</p></Panel>
      )}

      <Guidance>{data.priceNote}</Guidance>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-admin-line bg-white p-4 leading-[1.55]">
        <div className="flex flex-col gap-0.5">
          <p className="text-[12px] font-semibold text-admin-ink">ยอดขายยืนยันสะสม {data.store.name} ทั้งงาน, {fmt(data.storeTotal)} Token</p>
          <p className="text-[11px] text-admin-muted">ยอดขายรวมทุกหมวดหมู่สินค้าทั้งงาน, ยอดสะสมไม่ใช่ยอดตามตัวกรองหรือยอดหน้านี้</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-[14px] font-semibold text-admin-indigo">1 Token = ฿1, อัตราคงที่</p>
          <p className="text-[11px] text-admin-muted">งานเลี้ยงรุ่นศิษย์เก่า, บัตรเข้างาน ฿790/คน</p>
        </div>
      </div>
    </>
  );
}
