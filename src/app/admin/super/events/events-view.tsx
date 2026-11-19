"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrandButton, Chip, DataTable, Field, Guidance, Metric, OutlineButton, PageHeading, Panel } from "@/components/admin/ui";
import { Dialog } from "@/components/ui/Dialog";
import { closeEventNow, createEvent, setEventEnd } from "@/lib/actions";
import type { getEvents } from "@/lib/admin-data";

type Data = Awaited<ReturnType<typeof getEvents>>;
const fmt = (n: number) => n.toLocaleString("en-US");

/** ISO → "YYYY-MM-DDTHH:mm" in Bangkok time, for <input type="datetime-local"> */
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(Date.parse(iso) + 7 * 3600_000);
  return d.toISOString().slice(0, 16);
};
const thaiTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " น." : "";

export function EventsView({ data }: { data: Data }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [agree, setAgree] = useState(false);
  const [endAt, setEndAt] = useState(toLocalInput(data.open?.endsAt));
  const [form, setForm] = useState({ name: "", dateLong: "", time: "17:00–23:00 น.", venue: "" });
  const open = data.open;
  const p = data.preview;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string, after?: () => void) => {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "บันทึกไม่สำเร็จ");
      setNotice(done);
      after?.();
      router.refresh();
    });
  };

  return (
    <>
      <PageHeading
        title="จัดการงาน"
        description="เปิดได้ครั้งละหนึ่งงาน บัญชีผู้ร่วมงานใช้ต่อได้ทุกงาน แต่บัตรและ Token เป็นของแต่ละงาน เมื่อปิดงาน บัตรสแกนไม่ผ่านและ Token ที่เหลือหมดอายุ"
      />
      {error && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[13px] text-[#c2414b]">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-admin-line bg-white p-3 text-[13px] text-admin-ink">
          {notice}
        </p>
      )}

      {open && p ? (
        <Panel title={`งานที่เปิดอยู่: ${open.name}`} aside={<Chip tone="ok">เปิดอยู่</Chip>}>
          <p className="text-[13px] leading-[1.6] text-admin-muted">
            {open.dateLong} เวลา {open.time} ที่{open.venue}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric label="บัตรที่อนุมัติแล้ว" value={fmt(p.tickets)} note="จะสแกนเข้างานไม่ได้หลังปิดงาน" />
            <Metric label="Token คงเหลือในกระเป๋า" value={fmt(p.tokens)} note={`${p.wallets} กระเป๋า จะหมดอายุเมื่อปิดงาน`} noteTone={p.tokens ? "warning" : undefined} />
            <Metric label="ปิดอัตโนมัติ" value={open.endsAt ? "ตั้งไว้แล้ว" : "ไม่ได้ตั้ง"} note={open.endsAt ? thaiTime(open.endsAt) : "ต้องกดปิดเองที่ปุ่มด้านล่าง"} />
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-admin-line pt-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-admin-ink">เวลาปิดงานอัตโนมัติ (เวลาไทย)</span>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="min-h-[44px] rounded-lg border border-admin-line bg-white px-3 text-[13px] text-admin-ink"
              />
            </label>
            <OutlineButton disabled={pending || !endAt} onClick={() => run(() => setEventEnd(open.id, endAt), `ตั้งเวลาปิดงานอัตโนมัติแล้ว`)}>
              บันทึกเวลาปิด
            </OutlineButton>
            {open.endsAt && (
              <OutlineButton disabled={pending} onClick={() => run(() => setEventEnd(open.id, ""), "ยกเลิกการปิดอัตโนมัติแล้ว", () => setEndAt(""))}>
                ยกเลิกปิดอัตโนมัติ
              </OutlineButton>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => {
                setAgree(false);
                setConfirmOpen(true);
              }}
              className="min-h-[42px] rounded-lg bg-[#c2414b] px-5 text-[13px] font-semibold text-white transition hover:bg-[#a8333c]"
            >
              ปิดงานตอนนี้
            </button>
          </div>
          <Guidance>
            ถึงเวลาที่ตั้งไว้ ระบบปิดงานเองในครั้งแรกที่มีคนเปิดหน้าเว็บหลังจากนั้น ไม่ต้องเปิดเครื่องรอ ถ้าไม่ได้ตั้งเวลา ให้ Super Admin กด “ปิดงานตอนนี้” หลังงานจบ
          </Guidance>
        </Panel>
      ) : (
        <Panel title="สร้างงานถัดไป" aside={<Chip tone="muted">ไม่มีงานที่เปิดอยู่</Chip>}>
          <p className="text-[12px] leading-[1.6] text-admin-muted">
            ผู้ร่วมงานเดิมเข้าสู่ระบบด้วยอีเมลเดิมและซื้อบัตรงานใหม่ได้เลย บัตรและ Token ของงานเก่ายังดูย้อนหลังได้แต่ใช้ไม่ได้แล้ว
          </p>
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => createEvent(form), `เปิดงาน ${form.name} แล้ว`);
            }}
          >
            <Field label="ชื่องาน *" required placeholder="เช่น งานเลี้ยงรุ่นศิษย์เก่า 2570" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="วันที่ *" required placeholder="เช่น 23 ตุลาคม 2570" value={form.dateLong} onChange={(e) => setForm({ ...form, dateLong: e.target.value })} />
            <Field label="เวลา" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <Field label="สถานที่ *" required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <div className="md:col-span-2">
              <BrandButton type="submit" icon="a-plus-white" disabled={pending}>
                เปิดงานใหม่
              </BrandButton>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="งานทั้งหมด" aside={<span className="text-[11px] text-admin-muted">{data.events.length} งาน</span>}>
        <DataTable
          rows={data.events}
          rowKey={(r) => r.id}
          columns={[
            { key: "n", header: "งาน", strong: true, render: (r) => <span className="flex flex-col"><span>{r.name}</span><span className="text-[11px] font-normal text-admin-muted">{r.id}, {r.dateLong}</span></span> },
            { key: "s", header: "สถานะ", width: 150, render: (r) => (r.status === "open" ? <Chip tone="ok">เปิดอยู่</Chip> : <span className="flex flex-col gap-0.5"><Chip tone="muted">ปิดแล้ว</Chip><span className="text-[10px]">{r.closedAt}</span></span>) },
            { key: "t", header: "บัตร / เข้างาน", width: 130, render: (r) => `${fmt(r.tickets)} / ${fmt(r.checkedIn)}` },
            { key: "m", header: "รายรับ (บาท)", width: 130, render: (r) => fmt(r.revenue) },
            { key: "sp", header: "Token ใช้ไป", width: 120, render: (r) => fmt(r.spent) },
            { key: "x", header: "Token หมดอายุ", width: 130, render: (r) => (r.status === "closed" ? fmt(r.expired ?? 0) : "-") },
            { key: "b", header: "ปิดโดย", width: 160, render: (r) => r.closedBy ?? "-" },
          ]}
        />
      </Panel>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="ยืนยันปิดงาน" className="max-w-[460px]">
        {open && p && (
          <div className="flex flex-col gap-4 text-[13px] leading-[1.6] text-ink-slate">
            <p>
              ปิด <b>{open.name}</b> แล้วจะเกิดสิ่งนี้ทันที และย้อนกลับไม่ได้
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>บัตร {fmt(p.tickets)} ใบของงานนี้สแกนเข้างานไม่ได้</li>
              <li>Token ที่เหลือ {fmt(p.tokens)} Token ใน {p.wallets} กระเป๋า หมดอายุ (บันทึกไว้ในประวัติการเติม Token และรายงาน)</li>
              <li>ร้านค้าตัด Token ไม่ได้ เติม Token และซื้อบัตรไม่ได้ จนกว่าจะสร้างงานใหม่</li>
              <li>บัญชีผู้ร่วมงานยังอยู่ เข้าสู่ระบบดูประวัติได้</li>
            </ul>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
              <span>เข้าใจแล้ว งานจบแล้วจริง</span>
            </label>
            <div className="flex gap-2.5">
              <OutlineButton onClick={() => setConfirmOpen(false)}>ยกเลิก</OutlineButton>
              <button
                type="button"
                disabled={!agree || pending}
                onClick={() =>
                  run(
                    () => closeEventNow(open.id),
                    `ปิดงาน ${open.name} แล้ว`,
                    () => setConfirmOpen(false),
                  )
                }
                className="min-h-[42px] flex-1 rounded-lg bg-[#c2414b] px-4 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                ปิดงาน
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
