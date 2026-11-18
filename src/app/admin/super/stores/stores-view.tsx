"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandButton, Field, Metric, OutlineButton, PageHeading, Panel, SearchBox } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getStores } from "@/lib/admin-data";

type Data = Awaited<ReturnType<typeof getStores>>;
type Store = Data["stores"][number];

const nextCode = (stores: Store[]) =>
  `ST-${String(stores.reduce((m, s) => Math.max(m, Number(s.id.slice(3)) || 0), 0) + 1).padStart(2, "0")}`;

export function StoresView({ data }: { data: Data }) {
  const [stores, setStores] = useState<Store[]>(data.stores);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ ...data.draft, code: nextCode(data.stores) });

  const shown = useMemo(
    () => stores.filter((s) => s.name.includes(query.trim()) || s.id.includes(query.trim().toUpperCase())),
    [stores, query],
  );

  const reset = () => setDraft({ name: "", code: nextCode(stores), owner: "", detail: "" });

  const closeForm = () => {
    setFormOpen(false);
    reset();
  };

  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeForm();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen]);

  return (
    <>
      <PageHeading
        title="จัดการร้านค้า"
        description={data.description}
        actions={
          <BrandButton icon="a-plus-white" onClick={() => setFormOpen(true)}>
            สร้างร้านค้า
          </BrandButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="ร้านค้าทั้งหมด" value={String(stores.length)} note={`${stores.length} ร้าน · ${stores.map((s) => s.name).join(" ")}`} />
        <Metric label="สินค้าในระบบ" value={String(data.productCount)} note={`${data.productCount} รายการ · ${data.productNames}`} />
        <Metric label="ผู้ดูแลร้าน" value={String(stores.length)} note={`${stores.length} คน`} />
      </div>

      <Panel title={`ร้านค้าในงาน · สินค้าทั้งหมด ${data.categoryCount} หมวดหมู่`} className="min-h-[611px]">
        <SearchBox value={query} onChange={setQuery} placeholder="ค้นหาร้าน" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-0 text-left text-[15px] leading-[1.55]">
            <thead>
              <tr className="text-admin-muted">
                <th className="rounded-l-md bg-admin-head px-3 py-2.5 font-semibold">ร้านค้า</th>
                <th className="w-[124px] bg-admin-head px-3 py-2.5 font-semibold">สถานะ</th>
                <th className="w-[96px] rounded-r-md bg-admin-head px-3 py-2.5 font-semibold">ลบร้านค้า</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td className="h-16 border-b border-admin-line px-3 font-medium text-admin-ink">{s.name}</td>
                  <td className="border-b border-admin-line px-3">
                    <span className="inline-flex items-center gap-[5px] rounded-full bg-admin-ok-tint px-[9px] py-[3px] text-[15px] font-semibold text-admin-ok">
                      <span className="size-[5px] rounded-full bg-admin-ok" />
                      {s.status === "open" ? "เปิดขาย" : "ปิดขาย"}
                    </span>
                  </td>
                  <td className="border-b border-admin-line px-3">
                    <button
                      type="button"
                      onClick={() => confirm(`ลบ ${s.name}?`) && setStores((all) => all.filter((x) => x.id !== s.id))}
                      className="text-admin-muted hover:text-danger"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-[12px] text-admin-muted">
                    ไม่พบร้านค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-auto text-[11px] leading-[1.55] text-admin-muted">
          ผู้ดูแลแต่ละร้านเห็นเฉพาะการขาย บูธ และประวัติของร้านตนเอง
        </p>
      </Panel>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onClick={closeForm}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Panel
              title="สร้างร้านค้าใหม่"
              aside={
                <button type="button" aria-label="ปิด" onClick={closeForm}>
                  <Icon name="a-x" size={18} />
                </button>
              }
              className="border-0 shadow-none"
            >
              <form
                className="flex flex-col gap-[18px]"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.name || !draft.owner) return;
                  const created: Store = { id: draft.code, name: draft.name, owner: draft.owner, detail: draft.detail, status: "open" };
                  setStores((all) => [...all, created]);
                  setDraft({ name: "", code: nextCode([...stores, created]), owner: "", detail: "" });
                  setFormOpen(false);
                }}
              >
                <Field label="ชื่อร้านค้า / หมวด *" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <Field
                  label="รหัสร้าน (ST-XX)"
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                  hint={`ระบบสร้างรหัสอัตโนมัติ เช่น ${nextCode(stores)}`}
                />
                <Field label="ผู้ดูแลร้าน / ผู้ขาย *" required value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
                <Field label="รายละเอียดร้าน / หมวดสินค้า" rows={4} value={draft.detail} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} />
                <div className="h-px bg-admin-line" />
                <div className="flex gap-2.5">
                  <OutlineButton onClick={closeForm}>ยกเลิก</OutlineButton>
                  <BrandButton type="submit" icon="a-plus-white" className="flex-1">
                    สร้างร้านใหม่
                  </BrandButton>
                </div>
              </form>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}