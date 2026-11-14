"use client";

import { useState } from "react";
import { Detail, downloadCsv } from "@/components/admin/history";
import { BrandButton, Chip, Guidance, Metric, PageHeading, Pagination, Panel, SearchBox, SelectButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getFinanceAttendance } from "@/lib/admin-data";
import { cx } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getFinanceAttendance>>;
type Tab = "all" | "in" | "out";

export function AttendanceView({ data }: { data: Data }) {
  const [tab, setTab] = useState<Tab>("in");
  const [q, setQ] = useState("");
  const [checkpoint, setCheckpoint] = useState("all");
  const [selected, setSelected] = useState(data.attendees[0].ticket);

  const notYet = data.approved - data.checkedIn;
  const pct = (n: number) => `${Math.round((n / data.approved) * 100)}%`;

  const shown = data.attendees.filter(
    (a) =>
      (tab === "all" || (tab === "in" ? a.time : !a.time)) &&
      (checkpoint === "all" || a.checkpoint === checkpoint) &&
      (a.name + a.ticket).includes(q.trim()),
  );
  const sel = data.attendees.find((a) => a.ticket === selected) ?? data.attendees[0];
  const total = tab === "all" ? data.approved : tab === "in" ? data.checkedIn : notYet;

  return (
    <>
      <PageHeading
        title="ประวัติการเข้าร่วมงาน"
        description={data.description}
        actions={
          <BrandButton
            icon="a-download-white"
            onClick={() =>
              downloadCsv("attendance.csv", [
                ["ผู้ร่วมงาน", "บัตร", "เวลาเช็กอิน", "จุดเช็กอิน", "สถานะ"],
                ...shown.map((a) => [a.name, a.ticket, a.time ?? "", a.checkpoint ?? "", a.time ? "เข้างานแล้ว" : "ยังไม่มา"]),
              ])
            }
          >
            ส่งออกประวัติ
          </BrandButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="ผู้มีบัตรที่อนุมัติแล้ว" value={String(data.approved)} note="ผู้ซื้อบัตรทั้งหมด" />
        <MetricOk label="มาถึงและเช็กอินแล้ว" value={String(data.checkedIn)} note={`${pct(data.checkedIn)} ของผู้มีสิทธิ์`} />
        <Metric label="ยังไม่เช็กอิน" value={String(notYet)} note={`${pct(notYet)} ของผู้มีสิทธิ์`} />
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel title="รายชื่อผู้เข้าร่วม" aside={<Chip tone="muted">{data.date}</Chip>} className="flex-1">
          <div role="tablist" className="flex gap-2 border-b border-admin-line">
            {(
              [
                ["all", `ทั้งหมด ${data.approved}`],
                ["in", `เช็กอินแล้ว ${data.checkedIn}`],
                ["out", `ยังไม่มา ${notYet}`],
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
          <div className="flex flex-wrap gap-2.5">
            <div className="min-w-[200px] flex-1">
              <SearchBox value={q} onChange={setQ} placeholder="ค้นหาชื่อ / เลขที่บัตร" />
            </div>
            <SelectButton
              icon="a-filter"
              label="จุดเช็กอิน"
              value={checkpoint}
              onChange={setCheckpoint}
              options={[{ value: "all", label: "ทุกจุดเช็กอิน" }, ...data.checkpoints.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-[12px] leading-[1.55]">
              <thead>
                <tr className="text-[11px] text-admin-muted">
                  <th className="rounded-l-md bg-admin-head px-3 py-2.5 font-semibold">ผู้ร่วมงาน</th>
                  <th className="w-[114px] bg-admin-head px-3 py-2.5 font-semibold">บัตร</th>
                  <th className="w-[139px] bg-admin-head px-3 py-2.5 font-semibold">มาถึง / เช็กอิน</th>
                  <th className="w-[129px] rounded-r-md bg-admin-head px-3 py-2.5 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => (
                  <tr
                    key={a.ticket}
                    onClick={() => setSelected(a.ticket)}
                    className={cx("cursor-pointer", a.ticket === sel.ticket ? "bg-brand-tint" : "hover:bg-admin-head")}
                  >
                    <td className="h-[53px] border-b border-admin-line px-3 font-medium text-admin-ink">{a.name}</td>
                    <td className="border-b border-admin-line px-3 text-admin-muted">{a.ticket}</td>
                    <td className="border-b border-admin-line px-3 text-admin-muted">{a.time ?? "—"}</td>
                    <td className="border-b border-admin-line px-3">{a.time ? <Chip tone="ok">เข้างานแล้ว</Chip> : <Chip tone="muted">ยังไม่มา</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination label={`แสดง 1–${shown.length} จาก ${total} คน`} />
          <p className="text-[10px] leading-[1.55] text-admin-muted">วันที่ {data.date} · เวลาไทย (UTC+7) · เรียงมาถึงล่าสุดก่อน</p>
        </Panel>

        <Panel title="รายละเอียดการเข้าร่วม" aside={<Icon name="a-user-check" size={20} />} className="xl:w-[330px]">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-admin-indigo-tint text-[16px] font-semibold text-admin-indigo">{sel.initials}</span>
            <div className="flex flex-col gap-[3px] leading-[1.55]">
              <p className="text-[15px] font-semibold text-admin-ink">{sel.name}</p>
              <p className="text-[11px] text-admin-muted">
                {sel.ticket} · {sel.class}
              </p>
            </div>
          </div>
          <div>{sel.time ? <Chip tone="ok">เช็กอินแล้ว</Chip> : <Chip tone="muted">ยังไม่เช็กอิน</Chip>}</div>
          <div className="h-px bg-admin-line" />
          <Detail label="วันที่มาถึง" value={sel.time ? data.date : "—"} />
          <Detail label="เวลาเช็กอิน" value={sel.time ? `${sel.time} น.` : "—"} valueClass="text-admin-indigo" />
          <Detail label="จุดเช็กอิน" value={sel.checkpoint ?? "—"} />
          <Detail label="เจ้าหน้าที่บันทึก" value={sel.staff ?? "—"} />
          <Detail label="รหัสบันทึก" value={sel.recordId ?? "—"} />
          <div className="h-px bg-admin-line" />
          <p className="text-[13px] font-semibold leading-[1.55] text-admin-ink">ลำดับเหตุการณ์</p>
          {sel.time ? (
            <div className="flex items-start gap-2.5">
              <Icon name="a-circle-check" size={18} />
              <div className="flex flex-col gap-1 leading-[1.55]">
                <p className="text-[12px] font-medium text-admin-ink">เช็กอินสำเร็จ</p>
                <p className="text-[11px] text-admin-muted">
                  {data.date} · {sel.time}
                </p>
                <p className="text-[11px] text-admin-muted">บันทึกเวลาเข้างานครั้งแรก</p>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-admin-muted">ยังไม่มีบันทึกการเข้างาน</p>
          )}
          <Guidance>Finance ดูประวัติได้ แต่ไม่สามารถแก้ไขเวลาเช็กอินจากหน้าจอนี้</Guidance>
        </Panel>
      </div>
    </>
  );
}

function MetricOk({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-admin-line bg-white p-5 leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className="font-latin text-[29px] font-semibold text-admin-ink">{value}</p>
      <p className="text-[11px] text-admin-ok">{note}</p>
    </div>
  );
}
