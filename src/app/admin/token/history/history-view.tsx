"use client";

import { useMemo, useState } from "react";
import { Detail, FilterField, LedgerStrip, SelectField, Stat, downloadCsv } from "@/components/admin/history";
import { BrandButton, Chip, Guidance, OutlineButton, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getTokenHistory } from "@/lib/admin-data";
import { cx } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getTokenHistory>>;
type Rec = Data["records"][number] & {
  requested?: number;
  balanceBefore?: number;
  staffCode?: string;
  station?: string;
  fromAccount?: string;
  evidence?: { id: string; bankRef: string };
  audit?: { time: string; title: string; detail: string }[];
};

const fmt = (n: number) => n.toLocaleString("en-US");
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export function HistoryView({ data }: { data: Data }) {
  const records = data.records as Rec[];
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [applied, setApplied] = useState({ q: "", channel: "all", status: "all" });
  const [selectedId, setSelectedId] = useState("TOP-0233");

  const shown = useMemo(
    () =>
      records.filter(
        (r) =>
          (applied.channel === "all" || r.channel === applied.channel) &&
          (applied.status === "all" || r.status === applied.status) &&
          (r.id + r.wallet + r.owner).includes(applied.q.trim()),
      ),
    [records, applied],
  );

  const ok = shown.filter((r) => r.status === "สำเร็จ");
  const okTotal = ok.reduce((s, r) => s + (r.received ?? 0), 0);
  const byChannel = (c: string) => ok.filter((r) => r.channel === c);
  const sum = (rs: Rec[]) => rs.reduce((s, r) => s + (r.received ?? 0), 0);
  const notCredited = shown.filter((r) => r.status !== "สำเร็จ");

  const sel = records.find((r) => r.id === selectedId) ?? records[0];
  const before = sel.balanceBefore ?? 0;

  const exportCsv = () =>
    downloadCsv("token-topups.csv", [
      ["เวลา", "เลขอ้างอิง", "Wallet", "ลูกค้า", "ช่องทาง", "รับเงิน", "เพิ่ม Token", "เจ้าหน้าที่", "สถานะ"],
      ...shown.map((r) => [r.time, r.id, r.wallet, r.owner, r.channel, r.received ?? "", r.tokens, r.staff, r.status]),
    ]);

  return (
    <>
      <PageHeading
        title="ประวัติการเติม Token"
        description={data.description}
        actions={
          <BrandButton icon="a-download-white" onClick={exportCsv}>
            ส่งออกประวัติ
          </BrandButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="ยอดยืนยันตามตัวกรอง" value={`฿${fmt(okTotal)}`} note={`${ok.length} รายการสำเร็จ · เพิ่ม ${fmt(okTotal)} Token`} dark />
        <Stat
          label="แยกช่องทางตามตัวกรอง"
          value={`฿${fmt(sum(byChannel("โอนธนาคาร")))} / ฿${fmt(sum(byChannel("เงินสด")))}`}
          note={`โอนธนาคาร ${byChannel("โอนธนาคาร").length} รายการ / เงินสด ${byChannel("เงินสด").length} รายการ`}
        />
        <Stat
          label="ยังไม่เพิ่มเข้า Wallet"
          value={`${notCredited.length} รายการ`}
          note={`รอตรวจสอบ ${notCredited.filter((r) => r.status === "รอตรวจสอบ").length} · ไม่สำเร็จ ${notCredited.filter((r) => r.status === "ไม่สำเร็จ").length}`}
        />
      </div>

      <Panel>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ q, channel, status });
          }}
        >
          <FilterField label="ค้นหารายการ / Wallet ID" className="min-w-[200px] flex-1">
            <Icon name="a-search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-admin-muted" />
          </FilterField>
          <FilterField label="วันที่ทำรายการ" className="w-[188px]">
            <Icon name="a-calendar-days" size={16} />
            <span className="flex-1 text-[12px]">{data.date}</span>
            <Icon name="a-chevron-down" size={14} />
          </FilterField>
          <FilterField label="ช่วงเวลา" className="w-[155px]">
            <span className="flex-1 text-[12px]">{data.timeRange}</span>
            <Icon name="a-chevron-down" size={14} />
          </FilterField>
          <SelectField label="ช่องทางชำระ" value={channel} onChange={setChannel} options={[["all", "ทุกช่องทาง"], ["เงินสด", "เงินสด"], ["โอนธนาคาร", "โอนธนาคาร"]]} />
          <SelectField label="สถานะ" value={status} onChange={setStatus} options={[["all", "ทุกสถานะ"], ["สำเร็จ", "สำเร็จ"], ["รอตรวจสอบ", "รอตรวจสอบ"], ["ไม่สำเร็จ", "ไม่สำเร็จ"]]} />
          <BrandButton type="submit" className="border border-admin-indigo">
            ใช้ตัวกรอง
          </BrandButton>
        </form>
        <div className="flex flex-wrap justify-between gap-2 text-[11px] leading-[1.55]">
          <p className="text-admin-muted">ผลลัพธ์ {shown.length} รายการ · เรียงเวลาล่าสุดก่อน · ยอดสรุปนับเฉพาะรายการสำเร็จ</p>
          <button
            type="button"
            className="text-black hover:underline"
            onClick={() => {
              setQ("");
              setChannel("all");
              setStatus("all");
              setApplied({ q: "", channel: "all", status: "all" });
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      </Panel>

      <Panel title="รายการเติม Token">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-[12px] leading-[1.55]">
            <thead>
              <tr className="text-[11px] text-admin-muted">
                {["วัน / เวลา", "เลขอ้างอิง", "ลูกค้า / Wallet", "ช่องทาง", "รับเงินจริง (฿)", "เพิ่ม (Token)", "เจ้าหน้าที่", "สถานะ"].map((h, i, a) => (
                  <th key={h} className={cx("bg-admin-head px-3 py-2.5 font-semibold", i === 0 && "rounded-l-md", i === a.length - 1 && "rounded-r-md")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const on = r.id === sel.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={cx("cursor-pointer text-admin-ink", on ? "bg-brand-soft" : "bg-white hover:bg-admin-head")}
                  >
                    <td className="h-[66px] border-b border-admin-line px-3">
                      <p>{r.time}</p>
                      <p className="text-[10px] text-admin-muted">{data.date}</p>
                    </td>
                    <td className={cx("border-b border-admin-line px-3", on && "font-semibold text-black")}>{r.id}</td>
                    <td className="border-b border-admin-line px-3">
                      <p>{r.wallet}</p>
                      <p className="text-[10px] text-admin-muted">{r.owner}</p>
                    </td>
                    <td className="border-b border-admin-line px-3">{r.channel}</td>
                    <td className="border-b border-admin-line px-3">
                      {r.received == null ? (
                        <>
                          <p>—</p>
                          <p className="text-[10px] text-admin-muted">ขอเติม ฿{fmt(r.requested ?? 0)}</p>
                        </>
                      ) : (
                        money(r.received)
                      )}
                    </td>
                    <td className={cx("border-b border-admin-line px-3", r.tokens > 0 && "font-semibold text-black")}>{r.tokens > 0 ? `+${fmt(r.tokens)}` : "0"}</td>
                    <td className="border-b border-admin-line px-3">{r.staff}</td>
                    <td className="border-b border-admin-line px-3">
                      <Chip tone={r.status === "สำเร็จ" ? "ok" : r.status === "รอตรวจสอบ" ? "warn" : "danger"}>{r.status}</Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] leading-[1.55] text-admin-muted">
          <p>
            แสดง 1–{shown.length} จาก {shown.length} รายการ · ยอดยืนยันหน้านี้ ฿{fmt(okTotal)} / {fmt(okTotal)} Token
          </p>
          <div className="flex items-center gap-2">
            <span>10 รายการ / หน้า</span>
            <span className="flex size-[30px] items-center justify-center rounded-md bg-brand text-[12px] font-semibold text-black">1</span>
            <span>หน้าเดียว</span>
          </div>
        </div>
        <Guidance>{data.note}</Guidance>
      </Panel>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel className="xl:w-[622px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5 leading-[1.55]">
              <p className="text-[16px] font-semibold text-admin-ink">รายละเอียด {sel.id}</p>
              <p className="text-[11px] text-admin-muted">
                {data.date} · {sel.time} น. · {sel.channel}
              </p>
            </div>
            <Chip tone={sel.status === "สำเร็จ" ? "ok" : sel.status === "รอตรวจสอบ" ? "warn" : "danger"}>{sel.status}</Chip>
          </div>
          <Detail label="เจ้าของ Wallet" value={`${sel.owner} · ${sel.wallet}`} />
          <LedgerStrip
            className="bg-brand-soft"
            items={[
              { label: "ยอดก่อนเติม", value: fmt(before) },
              { label: "เครดิตเพิ่ม", value: `+${fmt(sel.tokens)}` },
              { label: "ยอดหลังเติม", value: fmt(before + sel.tokens) },
            ]}
          />
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex flex-1 flex-col gap-2">
              <Detail label="รับเงินแล้ว" value={sel.received == null ? "—" : `฿${money(sel.received)}`} />
              <Detail label="บัญชีผู้โอน" value={sel.fromAccount ?? (sel.channel === "เงินสด" ? "เงินสด" : "—")} />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Detail label="ผู้ยืนยัน" value={sel.staffCode ? `${sel.staff} · ${sel.staffCode}` : sel.staff} />
              <Detail label="จุดปฏิบัติงาน" value={sel.station ?? "—"} />
            </div>
          </div>
          {sel.evidence && (
            <>
              <div className="h-px bg-admin-line" />
              <div className="flex items-center gap-2.5">
                <Icon name="a-file-check-2" size={18} />
                <div className="flex flex-1 flex-col gap-0.5 leading-[1.55]">
                  <p className="text-[12px] font-medium text-admin-ink">{sel.evidence.id} · หลักฐานการโอน</p>
                  <p className="text-[11px] text-admin-muted">
                    ธนาคารอ้างอิง {sel.evidence.bankRef} · ฿{money(sel.received ?? 0)}
                  </p>
                </div>
                <OutlineButton>ดูหลักฐาน</OutlineButton>
              </div>
            </>
          )}
        </Panel>

        <Panel title="เส้นทางตรวจสอบรายการ" aside={<span className="text-[10px] text-admin-muted">{sel.id}</span>} className="flex-1">
          {(sel.audit ?? []).map((a) => (
            <div key={a.time} className="flex items-start gap-3.5 leading-[1.55]">
              <p className="text-[11px] text-admin-muted">{a.time}</p>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-[12px] font-semibold text-admin-ink">{a.title}</p>
                <p className="text-[11px] text-admin-muted">{a.detail}</p>
              </div>
              <Icon name="a-circle-check-sm" size={16} />
            </div>
          ))}
          {!sel.audit && <p className="text-[12px] text-admin-muted">ยังไม่มีบันทึกขั้นตอนสำหรับรายการนี้ในข้อมูลจำลอง</p>}
          <div className="h-px bg-admin-line" />
          <p className="text-[11px] leading-[1.55] text-admin-muted">
            ประวัติอ่านอย่างเดียว · บันทึกเวลาและผู้ดำเนินการทุกขั้นตอน ไม่สามารถแก้ไขยอดหรือยืนยันซ้ำจากหน้านี้
          </p>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-admin-line bg-white p-4 leading-[1.55]">
        <div className="flex flex-col gap-0.5">
          <p className="text-[12px] font-semibold text-admin-ink">ยอดเติมยืนยันสะสมทั้งงาน · ณ {data.eventTotal.asOf}</p>
          <p className="text-[11px] text-admin-muted">ไม่ใช่ยอดตามตัวกรองหรือยอดในหน้านี้ · ไม่รวมค่าบัตร ฿{data.eventTotal.ticketPrice}/คน</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-[17px] font-semibold text-admin-ink">
            ฿{fmt(data.eventTotal.amount)} = {fmt(data.eventTotal.amount)} Token
          </p>
          <p className="text-[11px] text-admin-muted">
            เงินสด ฿{fmt(data.eventTotal.cash)} + โอนธนาคาร ฿{fmt(data.eventTotal.transfer)}
          </p>
        </div>
      </div>
    </>
  );
}

