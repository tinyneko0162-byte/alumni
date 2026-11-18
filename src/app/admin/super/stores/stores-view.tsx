"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrandButton, Field, Metric, OutlineButton, PageHeading, Panel, SearchBox } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { createStore, deleteStore, setStoreStatus, updateStore } from "@/lib/actions";
import { cx } from "@/lib/format";
import type { getStores } from "@/lib/admin-data";

type Data = Awaited<ReturnType<typeof getStores>>;
type Store = Data["stores"][number];
type Draft = { code: string; name: string; owner: string; detail: string };
/** which popup is open: create, edit one store, or confirm deleting one */
type Modal = { kind: "create" } | { kind: "edit"; store: Store } | { kind: "delete"; store: Store } | null;

const nextCode = (stores: Store[]) =>
  `ST-${String(stores.reduce((m, s) => Math.max(m, Number(s.id.slice(3)) || 0), 0) + 1).padStart(2, "0")}`;

export function StoresView({ data }: { data: Data }) {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>(data.stores);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [draft, setDraft] = useState<Draft>({ code: "", name: "", owner: "", detail: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // server data changes after each action (router.refresh) → keep the table in step
  useEffect(() => setStores(data.stores), [data.stores]);

  const shown = useMemo(() => {
    const q = query.trim();
    return stores.filter((s) => (s.name + s.owner + s.detail).includes(q) || s.id.includes(q.toUpperCase()));
  }, [stores, query]);
  const openCount = stores.filter((s) => s.status === "open").length;

  const close = () => {
    setModal(null);
    setError(null);
  };
  const openCreate = () => {
    setDraft({ code: nextCode(stores), name: "", owner: "", detail: "" });
    setError(null);
    setModal({ kind: "create" });
  };
  const openEdit = (s: Store) => {
    setDraft({ code: s.id, name: s.name, owner: s.owner, detail: s.detail });
    setError(null);
    setModal({ kind: "edit", store: s });
  };

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modal]);

  /** run a server action, show its error in the popup or a notice above the table */
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string, inModal = true) => {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        if (inModal) setError(res.error ?? "บันทึกไม่สำเร็จ");
        else setNotice(res.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setModal(null);
      setNotice(done);
      router.refresh();
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.owner.trim()) return setError("กรอกชื่อร้านและผู้ดูแลร้าน");
    if (modal?.kind === "edit") run(() => updateStore(modal.store.id, draft), `บันทึกข้อมูล ${draft.name.trim()} แล้ว`);
    else run(() => createStore(draft), `สร้าง ${draft.name.trim()} (${draft.code.trim().toUpperCase()}) แล้ว`);
  };

  const toggle = (s: Store) =>
    run(() => setStoreStatus(s.id, s.status === "open" ? "closed" : "open"), `${s.status === "open" ? "ปิด" : "เปิด"}การขาย ${s.name} แล้ว`, false);

  return (
    <>
      <PageHeading
        title="จัดการร้านค้า"
        description={data.description}
        actions={
          <BrandButton icon="a-plus-white" onClick={openCreate}>
            สร้างร้านค้า
          </BrandButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="ร้านค้าทั้งหมด" value={String(stores.length)} note={`เปิดขาย ${openCount}, ปิดขาย ${stores.length - openCount}`} />
        <Metric label="สินค้าในระบบ" value={String(data.productCount)} note={`${data.productCount} รายการ, ${data.productNames}`} />
        <Metric label="ผู้ดูแลร้าน" value={String(new Set(stores.map((s) => s.owner)).size)} note="ผู้ดูแล 1 คนต่อร้าน" />
      </div>

      {notice && (
        <p role="status" className="rounded-lg border border-admin-line bg-white px-4 py-3 text-[13px] leading-[1.55] text-admin-ink">
          {notice}
        </p>
      )}

      <Panel title={`ร้านค้าในงาน, สินค้าทั้งหมด ${data.categoryCount} หมวดหมู่`} className="min-h-[611px]">
        <SearchBox value={query} onChange={setQuery} placeholder="ค้นหาร้าน ผู้ดูแล หรือรหัสร้าน" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[15px] leading-[1.55]">
            <thead>
              <tr className="text-admin-muted">
                <th className="rounded-l-md bg-admin-head px-3 py-2.5 font-semibold">ร้านค้า</th>
                <th className="w-[150px] bg-admin-head px-3 py-2.5 font-semibold">ผู้ดูแล</th>
                <th className="w-[90px] bg-admin-head px-3 py-2.5 font-semibold">สินค้า</th>
                <th className="w-[150px] bg-admin-head px-3 py-2.5 font-semibold">สถานะ</th>
                <th className="w-[120px] rounded-r-md bg-admin-head px-3 py-2.5 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => {
                const open = s.status === "open";
                return (
                  <tr key={s.id}>
                    <td className="h-16 border-b border-admin-line px-3">
                      <p className="font-medium text-admin-ink">{s.name}</p>
                      <p className="text-[12px] text-admin-muted">
                        {s.id}
                        {s.detail ? `, ${s.detail}` : ""}
                      </p>
                    </td>
                    <td className="border-b border-admin-line px-3 text-[13px] text-admin-ink">{s.owner}</td>
                    <td className="border-b border-admin-line px-3 font-latin text-[13px] text-admin-ink">{data.productsByStore[s.id] ?? 0}</td>
                    <td className="border-b border-admin-line px-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={open}
                        aria-label={`${open ? "ปิด" : "เปิด"}การขาย ${s.name}`}
                        title={open ? "กดเพื่อปิดการขาย" : "กดเพื่อเปิดการขาย"}
                        disabled={pending}
                        onClick={() => toggle(s)}
                        className={cx(
                          "inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[13px] font-semibold transition hover:opacity-80 disabled:opacity-60",
                          open ? "bg-admin-ok-tint text-admin-ok" : "bg-[#fdecee] text-[#c2414b]",
                        )}
                      >
                        <span className={cx("size-[5px] rounded-full", open ? "bg-admin-ok" : "bg-[#c2414b]")} />
                        {open ? "เปิดขาย" : "ปิดขาย"}
                      </button>
                    </td>
                    <td className="border-b border-admin-line px-3">
                      <div className="flex items-center gap-3 text-[13px]">
                        <button type="button" onClick={() => openEdit(s)} className="font-medium text-admin-indigo hover:underline">
                          แก้ไข
                        </button>
                        <button type="button" onClick={() => setModal({ kind: "delete", store: s })} className="text-admin-muted hover:text-danger">
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-admin-muted">
                    ไม่พบร้านค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-auto text-[11px] leading-[1.55] text-admin-muted">
          กดป้ายสถานะเพื่อเปิดหรือปิดการขาย ร้านที่ปิดจะรับชำระ Token ที่บูธไม่ได้ แต่ประวัติการขายยังอยู่ครบ
        </p>
      </Panel>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" onClick={close} role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Panel
              title={modal.kind === "create" ? "สร้างร้านค้าใหม่" : modal.kind === "edit" ? `แก้ไข ${modal.store.name}` : "ลบร้านค้า"}
              aside={
                <button type="button" aria-label="ปิด" onClick={close}>
                  <Icon name="a-x" size={18} />
                </button>
              }
              className="border-0 shadow-none"
            >
              {modal.kind === "delete" ? (
                <div className="flex flex-col gap-[18px] leading-[1.55]">
                  <p className="text-[14px] text-admin-ink">
                    ลบ <b>{modal.store.name}</b> ({modal.store.id}) ออกจากระบบ
                  </p>
                  <p className="text-[12px] text-admin-muted">ลบได้เฉพาะร้านที่ยังไม่มีสินค้าและยังไม่เคยขาย ถ้ามีแล้วให้ปิดการขายแทน เพื่อให้ยอดเงินตรวจย้อนหลังได้</p>
                  {error && <ErrorText>{error}</ErrorText>}
                  <div className="h-px bg-admin-line" />
                  <div className="flex gap-2.5">
                    <OutlineButton onClick={close}>ยกเลิก</OutlineButton>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteStore(modal.store.id), `ลบ ${modal.store.name} แล้ว`)}
                      className="min-h-[42px] flex-1 rounded-lg bg-[#c2414b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#a8333c] disabled:opacity-60"
                    >
                      ลบร้านค้า
                    </button>
                  </div>
                </div>
              ) : (
                <form className="flex flex-col gap-[18px]" onSubmit={submit}>
                  <Field label="ชื่อร้านค้า / หมวด *" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  <Field
                    label="รหัสร้าน (ST-XX)"
                    value={draft.code}
                    readOnly={modal.kind === "edit"}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                    hint={modal.kind === "edit" ? "รหัสร้านเปลี่ยนไม่ได้ เพราะผูกกับสินค้าและประวัติการขาย" : `ระบบสร้างรหัสอัตโนมัติ เช่น ${nextCode(stores)}`}
                  />
                  <Field label="ผู้ดูแลร้าน / ผู้ขาย *" required value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
                  <Field label="รายละเอียดร้าน / หมวดสินค้า" rows={4} value={draft.detail} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} />
                  {error && <ErrorText>{error}</ErrorText>}
                  <div className="h-px bg-admin-line" />
                  <div className="flex gap-2.5">
                    <OutlineButton onClick={close}>ยกเลิก</OutlineButton>
                    <BrandButton type="submit" icon={modal.kind === "edit" ? "a-save-white" : "a-plus-white"} className="flex-1" disabled={pending}>
                      {modal.kind === "edit" ? "บันทึกการแก้ไข" : "สร้างร้านใหม่"}
                    </BrandButton>
                  </div>
                </form>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[13px] leading-[1.55] text-[#c2414b]">
      {children}
    </p>
  );
}
