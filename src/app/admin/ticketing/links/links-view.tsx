"use client";

import { useState } from "react";
import { BrandButton, Chip, DataTable, Field, Guidance, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { AdminConfig, getTicketLinks } from "@/lib/admin-data";

type Data = Awaited<ReturnType<typeof getTicketLinks>>;

export function LinksView({ data, event }: { data: Data; event: AdminConfig["event"] }) {
  const c = data.current;
  const [to, setTo] = useState(c.email);
  const [subject, setSubject] = useState(data.subject);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState(data.history);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: c.ticketId, to, subject, name: c.recipientShort }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "ส่งอีเมลไม่สำเร็จ");
        return;
      }
      const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      setHistory((h) => [{ ticketId: c.ticketId, email: to, time, status: "ส่งแล้ว" }, ...h.filter((x) => x.ticketId !== c.ticketId)]);
      setSent(true);
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeading title="ส่งลิงก์ทางอีเมล" description={data.description} actions={<Chip tone="ok">อีเมลบริษัทเชื่อมต่อแล้ว</Chip>} />

      <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
        <Icon name="a-circle-check" size={18} />
        <p className="flex-1 text-[12px] leading-[1.55] text-admin-ok">
          {c.ticketId} อนุมัติค่าบัตรแล้ว • ฿{c.amount.toFixed(2)} • {sent ? "ส่งลิงก์ให้ลูกค้าแล้ว" : "พร้อมส่งลิงก์ให้ลูกค้า"}
        </p>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex flex-col gap-5 xl:w-[400px]">
          <Panel title="ข้อมูลการส่ง" aside={sent ? <Chip tone="ok">ส่งแล้ว</Chip> : <Chip tone="warn">ยังไม่ส่ง</Chip>}>
            <Field label="ผู้ส่ง · อีเมลบริษัท" value={data.senderEmail} readOnly hint="เจ้าหน้าที่ไม่สามารถเปลี่ยนเป็นอีเมลส่วนตัวได้" />
            <Field label="ถึง" type="email" value={to} onChange={(e) => setTo(e.target.value)} className="[&_input]:font-medium" />
            <Field label="หัวเรื่อง" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Detail label="เลขที่บัตร" value={c.ticketId} />
            <Detail label="ผู้รับ" value={c.recipientName} />
            <Detail label="ค่าบัตร" value={`฿${c.amount.toFixed(2)} · อนุมัติแล้ว`} />
            <div className="h-px bg-admin-line" />
            <BrandButton icon="a-send-white" onClick={send} disabled={sending || !to.trim()} className="w-full bg-[#ea3f92]">
              {sending ? "กำลังส่ง…" : sent ? "ส่งซ้ำจากอีเมลบริษัท" : "ส่งลิงก์จากอีเมลบริษัท"}
            </BrandButton>
            {error && (
              <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[12px] leading-[1.55] text-[#c2414b]">
                {error}
              </p>
            )}
            <p className="text-[11px] leading-[1.55] text-admin-muted">ระบบจะบันทึกเวลา ผู้ส่ง และสถานะการส่ง หากส่งไม่สำเร็จสามารถส่งซ้ำได้</p>
          </Panel>

          <Panel title="ข้อมูลลิงก์ลูกค้า">
            <Detail label="อ้างอิง" value={c.linkRef} />
            <p className="text-[12px] leading-[1.55] text-black">{c.linkMasked}</p>
            <Guidance>ลิงก์เฉพาะบุคคล • แสดงแบบปกปิดในพื้นที่เจ้าหน้าที่</Guidance>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Panel aside={<Icon name="a-mail-muted" size={18} className="ml-auto" />}>
            <article className="flex flex-col gap-[22px] rounded-lg bg-brand-tint p-7 leading-[1.55] text-admin-ink max-sm:p-4">
              <div className="flex items-center gap-2.5">
                <Icon name="a-graduation-cap-indigo" size={28} />
                <p className="text-[19px] font-semibold">{event.name}</p>
              </div>
              <div className="h-px bg-admin-line" />
              <p className="text-[19px] font-semibold">แล้วพบกันใน{event.name}</p>
              <div className="text-[13px]">
                <p>สวัสดีคุณ {c.recipientShort}</p>
                <br />
                <p>เราได้รับชำระค่าบัตรของคุณเรียบร้อยแล้ว</p>
                <p>ใช้ลิงก์ด้านล่างเพื่อดูบัตรเข้างานและ Wallet ของคุณ</p>
              </div>
              <span className="self-start rounded-lg bg-[#ea3f92] px-5 py-[11px] text-[13px] font-semibold text-white">เปิดลิงก์ส่วนตัวของคุณ →</span>
              <div className="text-[12px] text-admin-muted">
                <p>
                  {event.dateLong} · {event.time.split("–")[0]} น.
                </p>
                <p>{event.venue}</p>
                <br />
                <p>กรุณาไม่ส่งต่อลิงก์นี้ให้ผู้อื่น</p>
                <p>ทีมงาน {data.companyName}</p>
              </div>
            </article>
          </Panel>

          <Panel title="สถานะการส่งล่าสุด">
            <DataTable
              rows={history}
              rowKey={(r) => r.ticketId}
              columns={[
                { key: "t", header: "บัตร", strong: true, render: (r) => r.ticketId },
                { key: "e", header: "ผู้รับ", render: (r) => r.email },
                { key: "time", header: "เวลา", width: 89, render: (r) => r.time },
                { key: "s", header: "สถานะ", width: 129, render: (r) => <Chip tone="ok">{r.status}</Chip> },
              ]}
            />
            <p className="text-[11px] leading-[1.55] text-admin-indigo">{history.at(-1)?.ticketId} · ตรวจอีเมลผู้รับก่อนส่งซ้ำ →</p>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className="text-[13px] font-medium text-admin-ink">{value}</p>
    </div>
  );
}
