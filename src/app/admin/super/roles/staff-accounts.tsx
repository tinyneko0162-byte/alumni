"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrandButton, Chip, DataTable, Field, OutlineButton, Panel, SearchBox } from "@/components/admin/ui";
import { Dialog } from "@/components/ui/Dialog";
import { createStaff, resetStaffPassword, setStaffActive, type StaffRow } from "@/lib/actions";

type Opt = { key: string; label: string };

/** Super Admin: staff accounts — each person signs in with their own username and password. */
export function StaffAccounts({ staff, me, roles, stores }: { staff: StaffRow[]; me: string; roles: Opt[]; stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", role: "ticketing", storeId: stores[0]?.id ?? "", station: "" });
  const [error, setError] = useState<string | null>(null);
  const [handover, setHandover] = useState<{ who: string; username: string; password: string } | null>(null);
  const [pending, start] = useTransition();
  const label = (k: string) => roles.find((r) => r.key === k)?.label ?? k;

  const shown = staff.filter((s) => (s.name + s.username + s.id + label(s.role) + s.station).toLowerCase().includes(q.trim().toLowerCase()));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "บันทึกไม่สำเร็จ");
      after?.();
      router.refresh();
    });
  };

  return (
    <Panel
      title="บัญชีพนักงาน"
      aside={
        <BrandButton icon="a-plus-white" onClick={() => setOpen(true)}>
          เพิ่มบัญชี
        </BrandButton>
      }
    >
      <p className="text-[12px] leading-[1.55] text-admin-muted">
        แต่ละคนเข้าระบบด้วยชื่อผู้ใช้และรหัสผ่านของตัวเอง ระบบเปิดเมนูตามบทบาทของบัญชี ผู้ขายเห็นเฉพาะร้านที่ประจำ บัญชีลบไม่ได้แต่ปิดใช้งานได้ เพื่อให้บันทึกระบบยังรู้ว่าใครทำอะไร
      </p>
      {error && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[13px] text-[#c2414b]">
          {error}
        </p>
      )}
      {handover && (
        <p role="status" className="rounded-lg border border-admin-line bg-admin-ok-tint p-3 text-[13px] leading-[1.55] text-admin-ok">
          รหัสผ่านของ {handover.who}: ชื่อผู้ใช้ <b className="font-latin">{handover.username}</b> รหัสผ่าน <b className="font-latin">{handover.password}</b> แสดงครั้งเดียว จดแล้วส่งให้เจ้าตัว
        </p>
      )}
      <SearchBox value={q} onChange={setQ} placeholder="ค้นหาชื่อ ชื่อผู้ใช้ หรือบทบาท" />
      <DataTable
        rows={shown}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "พนักงาน", strong: true, render: (r) => <span className="flex flex-col"><span>{r.name}</span><span className="text-[11px] font-normal text-admin-muted">{r.id}</span></span> },
          { key: "user", header: "ชื่อผู้ใช้", width: 120, render: (r) => <span className="font-latin text-admin-ink">{r.username}</span> },
          { key: "role", header: "บทบาท", width: 150, render: (r) => label(r.role) },
          { key: "station", header: "จุดประจำ / ร้าน", width: 170, render: (r) => r.station },
          { key: "active", header: "สถานะ", width: 110, render: (r) => <Chip tone={r.active ? "ok" : "muted"}>{r.active ? "ใช้งานอยู่" : "ปิดใช้งาน"}</Chip> },
          {
            key: "act",
            header: "จัดการ",
            width: 210,
            render: (r) =>
              r.id === me ? (
                <span className="text-[11px]">บัญชีของคุณ</span>
              ) : (
                <span className="flex gap-3 text-[12px]">
                  <button type="button" disabled={pending} onClick={() => run(() => setStaffActive(r.id, !r.active))} className="font-medium text-admin-indigo hover:underline">
                    {r.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        setError(null);
                        const res = await resetStaffPassword(r.id);
                        if (!res.ok) return setError(res.error);
                        setHandover({ who: r.name, username: r.username, password: res.password });
                      })
                    }
                    className="text-admin-muted hover:underline"
                  >
                    ตั้งรหัสผ่านใหม่
                  </button>
                </span>
              ),
          },
        ]}
      />

      <Dialog open={open} onClose={() => setOpen(false)} title="เพิ่มบัญชีพนักงาน" className="max-w-[460px]">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await createStaff(form);
              if (!res.ok) return setError(res.error);
              setHandover({ who: res.staff.name, username: res.staff.username, password: res.password });
              setForm({ ...form, name: "", username: "", station: "" });
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <Field label="ชื่อพนักงาน *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="ชื่อผู้ใช้ (ภาษาอังกฤษ/ตัวเลข) *" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} hint="ใช้เข้าสู่ระบบ เช่น ticket2" />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-admin-ink">บทบาท *</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="min-h-[44px] rounded-lg border border-admin-line bg-white px-3 text-[13px] text-admin-ink">
              {roles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {form.role === "store" ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-admin-ink">ร้านที่ประจำ *</span>
              <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} className="min-h-[44px] rounded-lg border border-admin-line bg-white px-3 text-[13px] text-admin-ink">
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Field label="จุดประจำ" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} hint="เช่น จุดเช็กอินประตูข้าง" />
          )}
          <p className="text-[11px] leading-[1.55] text-admin-muted">ระบบสร้างรหัสผ่านชั่วคราวให้ และแสดงครั้งเดียวหลังสร้าง</p>
          {error && <p className="text-[12px] text-[#c2414b]">{error}</p>}
          <div className="flex gap-2.5">
            <OutlineButton onClick={() => setOpen(false)}>ยกเลิก</OutlineButton>
            <BrandButton type="submit" icon="a-plus-white" className="flex-1" disabled={pending}>
              สร้างบัญชี
            </BrandButton>
          </div>
        </form>
      </Dialog>
    </Panel>
  );
}
