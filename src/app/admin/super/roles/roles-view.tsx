"use client";

import { useState, useTransition } from "react";
import { Chip, Guidance, PageHeading, Panel } from "@/components/admin/ui";
import { setRoleEnabled } from "@/lib/actions";
import { cx } from "@/lib/format";

type Role = { key: string; label: string; pages: string[]; enabled: boolean; locked: boolean };

export function RolesView({ initial }: { initial: Role[] }) {
  const [roles, setRoles] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (r: Role) => {
    setError(null);
    start(async () => {
      const res = await setRoleEnabled(r.key, !r.enabled);
      if (!res.ok) return setError(res.error ?? "บันทึกไม่สำเร็จ");
      setRoles((all) => all.map((x) => (x.key === r.key ? { ...x, enabled: !x.enabled } : x)));
    });
  };

  return (
    <>
      <PageHeading title="จัดการบทบาท" description="เปิดหรือปิดการใช้งานบทบาทเจ้าหน้าที่ บทบาทที่ปิดจะเข้าสู่ระบบไม่ได้ และคนที่ล็อกอินอยู่จะถูกออกจากระบบเมื่อเปิดหน้าถัดไป" />
      {error && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[13px] text-[#c2414b]">
          {error}
        </p>
      )}
      <Panel title="บทบาททั้งหมด">
        <ul className="flex flex-col divide-y divide-admin-line">
          {roles.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 flex-col gap-1 leading-[1.55]">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-admin-ink">{r.label}</p>
                  <Chip tone={r.enabled ? "ok" : "danger"}>{r.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Chip>
                </div>
                <p className="text-[12px] text-admin-muted">เมนู: {r.pages.join(", ")}</p>
              </div>
              {r.locked ? (
                <span className="text-[12px] text-admin-muted">ปิดไม่ได้ (กันล็อกตัวเอง)</span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`${r.enabled ? "ปิด" : "เปิด"}ใช้งาน ${r.label}`}
                  disabled={pending}
                  onClick={() => toggle(r)}
                  className={cx("relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60", r.enabled ? "bg-admin-ok" : "bg-[#b3b3b3]")}
                >
                  <span className={cx("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", r.enabled ? "left-[22px]" : "left-0.5")} />
                </button>
              )}
            </li>
          ))}
        </ul>
        <Guidance>ทุกครั้งที่เปิด/ปิดบทบาท ระบบจะบันทึกลงหน้า “บันทึกระบบ” อัตโนมัติ</Guidance>
      </Panel>
    </>
  );
}
