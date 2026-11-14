"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandButton, Chip, PageHeading, Panel, SearchBox } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getTicketSlips } from "@/lib/admin-data";
import { cx } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getTicketSlips>>;
type Req = Data["requests"][number];

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export function SlipsView({ data }: { data: Data }) {
  const [pending, setPending] = useState<Req[]>(data.requests);
  const [approved, setApproved] = useState<Req[]>([]);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(data.requests[0]?.id);
  const [checks, setChecks] = useState<boolean[]>(data.checklist.map(() => true));

  const list = (tab === "pending" ? pending : approved).filter((r) => (r.name + r.id).includes(q.trim()));
  const current = [...pending, ...approved].find((r) => r.id === selectedId) ?? list[0];
  const isPending = current && pending.some((r) => r.id === current.id);
  const pendingTotal = data.pendingCount - approved.length;

  const approve = () => {
    if (!current || !isPending) return;
    const rest = pending.filter((r) => r.id !== current.id);
    setPending(rest);
    setApproved((a) => [current, ...a]);
    setSelectedId(rest[0]?.id ?? current.id);
    setChecks(data.checklist.map(() => true));
  };

  return (
    <>
      <PageHeading title="ตรวจสอบสลิปค่าบัตร" description={data.description} actions={<Chip tone="warn">รอตรวจ {pendingTotal} รายการ</Chip>} />

      <div role="tablist" className="flex gap-2 border-b border-admin-line">
        {(
          [
            ["pending", `รอตรวจสอบ ${pendingTotal}`],
            ["approved", `อนุมัติแล้ว ${data.approvedCount + approved.length}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cx(
              "-mb-px border-b-2 px-4 py-[11px] text-[13px] leading-[1.55]",
              tab === key ? "border-admin-indigo font-semibold text-admin-indigo" : "border-transparent text-admin-muted hover:text-admin-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel title="คิวค่าบัตร" className="p-4 xl:w-[240px]">
          <SearchBox value={q} onChange={setQ} placeholder="ชื่อ / เลขที่บัตร" />
          <ul className="flex flex-col gap-[18px]">
            {list.map((r) => {
              const on = r.id === current?.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cx(
                      "flex w-full flex-col items-start gap-[7px] rounded-lg border p-[13px] text-left leading-[1.55] transition",
                      on ? "border-brand bg-brand-tint" : "border-admin-line bg-white hover:bg-admin-head",
                    )}
                  >
                    <span className="flex w-full justify-between">
                      <span className={cx("text-[11px] font-semibold", on ? "text-admin-indigo" : "text-admin-ink")}>{r.id}</span>
                      <span className="text-[10px] text-admin-muted">{r.submittedAt}</span>
                    </span>
                    <span className="text-[13px] text-admin-ink">{r.name}</span>
                    <span className="text-[11px] text-admin-muted">
                      บัตรเข้างาน {r.qty} ใบ · ฿{r.amount}
                    </span>
                    {tab === "pending" ? <Chip tone="warn">รอตรวจสอบ</Chip> : <Chip tone="ok">อนุมัติแล้ว</Chip>}
                  </button>
                </li>
              );
            })}
            {list.length === 0 && <li className="py-6 text-center text-[12px] text-admin-muted">ไม่มีรายการ</li>}
          </ul>
          <p className="text-[10px] leading-[1.55] text-admin-muted">เรียงตามเวลาส่ง • เก่าสุดก่อน</p>
        </Panel>

        {current && (
          <>
            <Panel
              title="หลักฐานการชำระเงิน"
              aside={
                <button type="button" aria-label="ขยาย">
                  <Icon name="a-expand" size={17} />
                </button>
              }
              className="flex-1"
            >
              <div className="flex flex-col items-center gap-5 rounded-lg bg-brand-tint p-[22px]">
                <div className="flex w-full items-start justify-between">
                  <p className="text-[10px] leading-[1.55] text-admin-muted">{current.slipFile}</p>
                  <button type="button" aria-label="ซูม">
                    <Icon name="a-zoom-in" size={17} />
                  </button>
                </div>
                <div className="flex w-[265px] max-w-full flex-col items-center gap-3.5 rounded-md bg-white p-[22px] leading-[1.55] shadow-[0_3px_12px_rgba(27,33,64,0.03)]">
                  <span className="flex size-10 items-center justify-center rounded-full bg-admin-ok-tint">
                    <Icon name="a-check-green" size={20} />
                  </span>
                  <p className="text-[15px] font-semibold text-admin-ink">โอนเงินสำเร็จ</p>
                  <p className="text-[10px] text-admin-muted">สลิปจำลองเพื่อการออกแบบ</p>
                  <p className="font-latin text-[28px] font-semibold text-admin-ink">{money(current.amount)}</p>
                  <p className="text-[11px] text-admin-muted">บาท • ค่าบัตรเข้างาน</p>
                  <div className="h-px w-full bg-admin-line" />
                  <div className="flex w-full items-center justify-between">
                    <p className="text-[12px] text-admin-muted">จาก</p>
                    <p className="text-[13px] font-medium text-admin-ink">{current.name}</p>
                  </div>
                  <p className="text-[10px] text-admin-muted">{current.fromAccount}</p>
                  <Icon name="a-arrow-down" size={16} />
                  <div className="flex w-full items-center justify-between text-[12px]">
                    <p className="text-admin-muted">ถึง</p>
                    <p className="font-bold text-black">{data.companyAccountName}</p>
                  </div>
                  <p className="text-[10px] text-admin-muted">{data.companyAccountMasked}</p>
                  <div className="h-px w-full bg-admin-line" />
                  <p className="text-[10px] text-admin-muted">{current.paidAt}</p>
                  <p className="text-[10px] text-admin-muted">{current.ref}</p>
                </div>
              </div>
              <p className="text-[11px] leading-[1.55] text-admin-muted">แนบเมื่อ {current.submittedAt} น.</p>
            </Panel>

            <Panel title="รายละเอียดคำขอ" aside={<span className="text-[11px] text-admin-muted">{current.id}</span>} className="xl:w-[350px]">
              <div>{isPending ? <Chip tone="warn">รออนุมัติค่าบัตร</Chip> : <Chip tone="ok">อนุมัติแล้ว</Chip>}</div>
              <Detail label="ผู้ลงทะเบียน" value={current.name} />
              <Detail label="อีเมล" value={current.email} />
              <Detail label="ประเภทบัตร" value={`${current.ticketType} · ${current.qty} ใบ`} />
              <Detail label="ยอดที่ต้องชำระ" value={`฿${money(current.amount)}`} valueClass="text-admin-indigo" />
              <div className="h-px bg-admin-line" />
              <p className="text-[13px] font-semibold leading-[1.55] text-admin-ink">ตรวจสอบก่อนอนุมัติ</p>
              {data.checklist.map((label, i) => (
                <label key={label} className="flex cursor-pointer items-center gap-[9px]">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checks[i]}
                    disabled={!isPending}
                    onChange={(e) => setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
                  />
                  {checks[i] ? (
                    <Icon name="a-square-check" size={18} />
                  ) : (
                    <span className="size-[18px] rounded-[4px] border-2 border-admin-side-muted" />
                  )}
                  <span className="text-[12px] leading-[1.55] text-admin-ink">{label}</span>
                </label>
              ))}
              {!current.duplicateRef && (
                <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
                  <Icon name="a-circle-check" size={18} />
                  <p className="flex-1 text-[12px] leading-[1.55] text-admin-ok">ไม่พบเลขอ้างอิงซ้ำในรายการที่อนุมัติแล้ว</p>
                </div>
              )}
              <BrandButton icon="a-check-white" onClick={approve} disabled={!isPending || checks.some((c) => !c)} className="w-full">
                {isPending ? "อนุมัติค่าบัตร" : "อนุมัติแล้ว"}
              </BrandButton>
              <p className="text-[11px] leading-[1.55] text-admin-muted">
                หลังอนุมัติ ไปที่{" "}
                <Link href="/admin/ticketing/links" className="text-admin-indigo hover:underline">
                  “ส่งลิงก์ทางอีเมล”
                </Link>{" "}
                เพื่อส่งลิงก์จากอีเมลบริษัท
              </p>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}

function Detail({ label, value, valueClass = "text-admin-ink" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className={cx("text-[13px] font-medium", valueClass)}>{value}</p>
    </div>
  );
}
