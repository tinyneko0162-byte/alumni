import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExportButton } from "@/components/admin/ExportButton";
import { Chip, DataTable, Metric, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { getAdminConfig, getOverview } from "@/lib/admin-data";

/** Figma: admin / Super Admin · ภาพรวมระบบ (4011:36883) */
export default async function OverviewPage() {
  const [cfg, d] = await Promise.all([getAdminConfig(), getOverview()]);
  const max = Math.max(...d.attendance.slots.map((s) => s.count));

  return (
    <AdminShell role="super" active="/admin/super/overview" title="ภาพรวมระบบ">
      <PageHeading
        title="ภาพรวมระบบ"
        description={d.description}
        actions={
          <ExportButton
            variant="outline"
            filename="system-overview.csv"
            rows={[
              ["รายการ", "ค่า"],
              ...d.metrics.map((m) => [m.label, String(m.value)]),
              ["ผู้เข้างานสะสม", String(d.attendance.total)],
              ...d.attendance.slots.map((sl) => [`เช็กอิน ${sl.time}`, String(sl.count)]),
            ]}
          />
        }
      />

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brand-deep p-[22px]">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand">
            <Icon name="a-graduation-cap" size={26} />
          </span>
          <div className="flex flex-col gap-[3px] leading-[1.55] text-white">
            <p className="text-[18px] font-semibold">{cfg.event.name}</p>
            <p className="text-[12px]">
              {cfg.event.dateLong} · {cfg.event.time} · {cfg.event.venue}
            </p>
          </div>
        </div>
        <Chip tone="ok">{d.eventStatus}</Chip>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {d.metrics.map((m) => (
          <Metric key={m.label} {...m} />
        ))}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel title="ผู้เข้างานตามช่วงเวลา" aside={<Chip tone="indigo">สะสม {d.attendance.total} คน</Chip>} className="flex-1">
          <div className="flex justify-between text-[11px] leading-[1.55] text-admin-muted">
            <p>จำนวนเช็กอินในแต่ละช่วง • คน</p>
            <p>อัปเดต {d.attendance.updatedAt}</p>
          </div>
          <div className="flex h-[170px] items-end gap-5 px-3" role="img" aria-label="กราฟจำนวนเช็กอินตามช่วงเวลา">
            {d.attendance.slots.map((s) => (
              <div key={s.time} className="flex flex-1 flex-col items-center gap-[7px]">
                <span className="font-latin text-[10px] leading-[1.55] text-admin-muted">{s.count}</span>
                <span
                  className={`w-full rounded-t-[5px] ${s.count === max ? "bg-brand" : "bg-brand-soft"}`}
                  style={{ height: (s.count / max) * 108 }}
                />
                <span className="font-latin text-[10px] leading-[1.55] text-admin-muted">{s.time}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="คิวงานที่ต้องติดตาม" className="xl:w-[352px]">
          {d.queues.map((q, i) => (
            <div key={q.label} className="flex flex-col gap-[18px]">
              {i > 0 && <div className="h-px bg-admin-line" />}
              <Link href={q.href} className="flex items-start justify-between leading-[1.55] hover:opacity-80">
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-medium text-admin-ink">{q.label}</p>
                  <p className="text-[11px] text-admin-muted">{q.note}</p>
                </div>
                <p className="font-latin text-[25px] font-semibold text-admin-warn">{q.count}</p>
              </Link>
            </div>
          ))}
        </Panel>
      </div>

      <Panel
        title="ความเคลื่อนไหวล่าสุด"
        aside={
          <Link href="/admin/super/logs" className="text-[12px] text-admin-indigo hover:underline">
            ดูบันทึกระบบทั้งหมด →
          </Link>
        }
      >
        <DataTable
          rows={d.activity}
          rowKey={(r) => r.ref}
          columns={[
            { key: "time", header: "เวลา", width: 90, strong: true, render: (r) => r.time },
            { key: "action", header: "กิจกรรม", render: (r) => r.action },
            { key: "actor", header: "ผู้ดำเนินการ", width: 150, render: (r) => r.actor },
            { key: "ref", header: "อ้างอิง", width: 160, render: (r) => r.ref },
            { key: "result", header: "ผลลัพธ์", width: 110, render: (r) => <Chip tone="ok">{r.result}</Chip> },
          ]}
        />
      </Panel>
    </AdminShell>
  );
}
