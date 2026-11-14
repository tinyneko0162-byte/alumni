"use client";

import { useMemo, useState } from "react";
import { Chip, DataTable, Guidance, Metric, OutlineButton, PageHeading, Pagination, Panel, SearchBox, SelectButton, TwoLine } from "@/components/admin/ui";
import type { getLogs } from "@/lib/admin-data";

type Data = Awaited<ReturnType<typeof getLogs>>;
type Ev = Data["events"][number] & { detail?: string };

export function LogsView({ data }: { data: Data }) {
  const events = data.events as Ev[];
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [result, setResult] = useState("all");

  const roles = useMemo(() => Array.from(new Set(events.map((e) => e.role))), [events]);
  const results = useMemo(() => Array.from(new Set(events.map((e) => e.result))), [events]);

  const shown = events.filter(
    (e) =>
      (role === "all" || e.role === role) &&
      (result === "all" || e.result === result) &&
      (e.actor + e.ref + e.role + e.event).toLowerCase().includes(q.trim().toLowerCase()),
  );

  const exportCsv = () => {
    const rows = [["เวลา", "เหตุการณ์", "บทบาท", "ผู้ดำเนินการ", "อ้างอิง", "ผลลัพธ์"], ...shown.map((e) => [e.time, e.event, e.role, e.actor, e.ref, e.result])];
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "system-log.csv";
    a.click();
  };

  return (
    <>
      <PageHeading
        title="บันทึกระบบ"
        description={data.description}
        actions={
          <OutlineButton icon="a-download" onClick={exportCsv}>
            ส่งออก Log
          </OutlineButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.metrics.map((m) => (
          <Metric key={m.label} {...m} />
        ))}
      </div>

      <Panel title="เหตุการณ์ทั้งหมด" aside={<Chip tone="indigo">อ่านอย่างเดียว</Chip>}>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[220px] flex-1">
            <SearchBox value={q} onChange={setQ} placeholder="ค้นหาผู้ดำเนินการ / รหัสอ้างอิง" />
          </div>
          <SelectButton icon="a-calendar-days" label="วันที่" value={data.date} onChange={() => {}} options={[{ value: data.date, label: data.date }]} />
          <SelectButton
            icon="a-chevron-down"
            label="บทบาท"
            value={role}
            onChange={setRole}
            options={[{ value: "all", label: "ทุกบทบาท" }, ...roles.map((r) => ({ value: r, label: r }))]}
          />
          <SelectButton
            icon="a-filter"
            label="ผลลัพธ์"
            value={result}
            onChange={setResult}
            options={[{ value: "all", label: "ทุกผลลัพธ์" }, ...results.map((r) => ({ value: r, label: r }))]}
          />
        </div>
        <DataTable
          rows={shown}
          rowKey={(e) => e.time + e.ref}
          columns={[
            { key: "time", header: "เวลา", width: 106, strong: true, render: (e) => e.time },
            { key: "event", header: "เหตุการณ์", render: (e) => <TwoLine top={e.event} bottom={e.detail} /> },
            { key: "actor", header: "ผู้ดำเนินการ", width: 169, render: (e) => <TwoLine top={e.role} bottom={e.actor} /> },
            { key: "ref", header: "อ้างอิง", width: 136, render: (e) => e.ref },
            { key: "result", header: "ผลลัพธ์", width: 136, render: (e) => <Chip tone={e.result === "สำเร็จ" ? "ok" : "danger"}>{e.result}</Chip> },
          ]}
        />
        <Pagination label={`แสดง 1–${shown.length} จาก ${data.total.toLocaleString("en-US")} เหตุการณ์`} />
      </Panel>

      <Guidance>{data.guidance}</Guidance>
    </>
  );
}
