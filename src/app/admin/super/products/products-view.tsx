"use client";

import { useMemo, useState } from "react";
import { BrandButton, Chip, Field, Guidance, OutlineButton, PageHeading, Panel, SearchBox } from "@/components/admin/ui";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { createProduct, saveProduct } from "@/lib/actions";
import type { getProductCatalog } from "@/lib/admin-data";
import { cx } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getProductCatalog>>;
type Product = Data["products"][number];

export function ProductsView({ data }: { data: Data }) {
  const [products, setProducts] = useState<Product[]>(data.products);
  const [tab, setTab] = useState<string>("ทุกร้าน");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(data.products.at(-1)!.sku);
  const current = products.find((p) => p.sku === selected) ?? products[0];
  const [form, setForm] = useState({ stock: String(current.stock), price: String(current.price), status: current.status });

  const [editOpen, setEditOpen] = useState(false); // popup แก้ไขสินค้า

  const [addOpen, setAddOpen] = useState(false);
  const blank = { name: "", store: data.storeTabs[0], category: "สิ่งของ", price: "", stock: "" };
  const [add, setAdd] = useState(blank);
  const addPrice = Number(add.price);
  const addValid = add.name.trim() !== "" && Number.isFinite(addPrice) && addPrice > 0;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const create = async () => {
    if (!addValid || saving) return;
    setSaving(true);
    const res = await createProduct({ name: add.name, store: add.store, category: add.category, price: addPrice, stock: Number(add.stock) });
    setSaving(false);
    if (!res.ok) return setMessage({ ok: false, text: res.error });
    setProducts((all) => [...all, res.product]);
    setTab("ทุกร้าน");
    setQuery("");
    select(res.product);
    setAdd(blank);
    setAddOpen(false);
    setMessage({ ok: true, text: `เพิ่ม "${res.product.name}" แล้ว` });
  };

  const select = (p: Product) => {
    setSelected(p.sku);
    setForm({ stock: String(p.stock), price: String(p.price), status: p.status });
  };

  // กดปุ่ม "แก้ไข" ในตาราง → เลือกสินค้า + เปิด popup
  const openEdit = (p: Product) => {
    select(p);
    setMessage(null);
    setEditOpen(true);
  };

  const shown = useMemo(
    () =>
      products.filter(
        (p) => (tab === "ทุกร้าน" || p.store === tab) && (p.name + p.store + p.sku).includes(query.trim()),
      ),
    [products, tab, query],
  );
  const [page, setPage] = useState(1);
  const per = data.pageSize;
  const pages = Math.max(1, Math.ceil(shown.length / per));
  const cur = Math.min(page, pages); // a filter can shrink the list below the current page
  const paged = shown.slice((cur - 1) * per, cur * per);

  const save = async () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price <= 0 || saving) return;
    setSaving(true);
    const res = await saveProduct(current.sku, { price, stock: Number.isFinite(stock) ? stock : current.stock, status: form.status });
    setSaving(false);
    if (!res.ok) return setMessage({ ok: false, text: res.error });
    setProducts((all) => all.map((p) => (p.sku === current.sku ? res.product : p)));
    setEditOpen(false); // บันทึกสำเร็จแล้วปิด popup
    setMessage({ ok: true, text: `บันทึกแล้ว, หน้าขายสินค้าจะใช้ราคา ${res.product.price} Token ทันที` });
  };

  return (
    <>
      <PageHeading title={data.title} description={data.description} actions={<BrandButton icon="a-plus-white" onClick={() => setAddOpen(true)}>เพิ่มสินค้า</BrandButton>} />

      {message && message.ok && (
        <p role="status" className="rounded-lg bg-admin-ok-tint p-3 text-[13px] text-admin-ok">
          {message.text}
        </p>
      )}
      <Guidance>{data.guidance}</Guidance>

      <Panel title="รายการสินค้า" className="min-h-[600px]">
        <div role="tablist" className="flex gap-2 overflow-x-auto border-b border-admin-line">
          {["ทุกร้าน", ...data.storeTabs].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cx(
                "-mb-px shrink-0 border-b-2 px-4 py-[11px] text-[13px] leading-[1.55]",
                tab === t ? "border-admin-indigo font-semibold text-admin-indigo" : "border-transparent text-admin-muted hover:text-admin-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <SearchBox value={query} onChange={setQuery} placeholder="ค้นหาชื่อสินค้า / ร้านค้า" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-[12px] leading-[1.55]">
            <thead>
              <tr className="text-[11px] text-admin-muted">
                <th className="rounded-l-md bg-admin-head px-3 py-2.5 font-semibold">สินค้า / ร้านค้า / SKU</th>
                <th className="w-[119px] bg-admin-head px-3 py-2.5 font-semibold">ราคา Token / บาท</th>
                <th className="w-[124px] bg-admin-head px-3 py-2.5 font-semibold">สถานะ / Stock</th>
                <th className="w-[74px] rounded-r-md bg-admin-head px-3 py-2.5 font-semibold">แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.sku}>
                  <td className="h-16 border-b border-admin-line px-3 text-admin-ink">
                    <p className="font-medium">{p.name}</p>
                    <p className="font-bold">{p.store}</p>
                  </td>
                  <td className="border-b border-admin-line px-3 text-admin-muted">
                    <p>{p.price} Token</p>
                    <p>{p.price} บาท</p>
                  </td>
                  <td className="border-b border-admin-line px-3">
                    <Chip tone={p.status === "ขายอยู่" ? "ok" : "muted"}>{p.status}</Chip>
                  </td>
                  <td className="border-b border-admin-line px-3">
                    <button type="button" onClick={() => openEdit(p)} className="text-admin-muted hover:text-brand">
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] leading-[1.55] text-admin-muted">
            {shown.length ? `แสดง ${(cur - 1) * per + 1}–${Math.min(cur * per, shown.length)} จาก ${shown.length} สินค้า` : "ไม่พบสินค้า"}
          </p>
          <div className="flex gap-2">
            <OutlineButton icon="a-chevron-left" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>ก่อนหน้า</OutlineButton>
            <span className="rounded-md bg-admin-indigo-tint p-2.5 text-[12px] leading-[1.55] text-admin-indigo">{cur}</span>
            <OutlineButton icon="a-chevron-right-dark" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>ถัดไป</OutlineButton>
          </div>
        </div>
      </Panel>

      {/* การตั้งค่าเติม Token ย้ายมาอยู่ใต้ตารางแทน */}
      <Panel title="การตั้งค่าเติม Token">
        <div className="flex items-center justify-between leading-[1.55]">
          <p className="text-[12px] text-admin-muted">อัตราแลกเปลี่ยนของงาน</p>
          <p className="text-[13px] font-medium text-admin-indigo">{data.exchangeRate}</p>
        </div>
        <div className="flex items-start gap-2.5 rounded-lg bg-warning-tint p-3">
          <Icon name="a-info-warn" size={18} />
          <p className="flex-1 text-[12px] leading-[1.55] text-admin-warn">{data.topUpNote}</p>
        </div>
      </Panel>

      {/* ===== Popup แก้ไขราคาสินค้า ===== */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="แก้ไขราคาสินค้า">
        <div className="flex flex-col gap-4">
          {message && !message.ok && (
            <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[13px] text-[#c2414b]">
              {message.text}
            </p>
          )}
          <LockedField label="ชื่อสินค้า" value={current.name} />
          <LockedField label="ร้านค้า" value={`${current.store}, ${current.storeCode}`} />
          <LockedField label="หมวดหมู่" value={current.category} />
          <Field label="Stock" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} hint={`หน่วย: ${current.unit}`} />
          <Field
            label="ราคา Token / บาท *"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            hint="ใช้ราคาเดียวกันทุกอุปกรณ์ของร้าน, 1 Token = 1 บาท"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold leading-[1.55] text-admin-ink">สถานะการขาย</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="min-h-[44px] rounded-lg border border-admin-line bg-white px-3 text-[13px] text-admin-ink outline-none focus:border-brand-soft"
            >
              <option value="ขายอยู่">เปิดขาย</option>
              <option value="ปิดขาย">ปิดขาย</option>
            </select>
          </label>
          <div className="h-px bg-admin-line" />
          <Detail label="ราคาปัจจุบัน" value={`${current.price} Token / ${current.price} บาท`} />
          <Detail label="อัปเดตล่าสุด" value={current.updatedAt} />
          <div className="flex gap-2.5">
            <OutlineButton onClick={() => setEditOpen(false)}>ยกเลิก</OutlineButton>
            <BrandButton icon="a-save-white" onClick={save} className="flex-1">
              บันทึกราคาสินค้า
            </BrandButton>
          </div>
        </div>
      </Dialog>

      {/* ===== Popup เพิ่มสินค้า (ของเดิม) ===== */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="เพิ่มสินค้าใหม่">
        <div className="flex flex-col gap-4">
          <Field label="ชื่อสินค้า *" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold leading-[1.55] text-admin-ink">ร้านค้า</span>
            <select
              value={add.store}
              onChange={(e) => setAdd({ ...add, store: e.target.value })}
              className="min-h-[44px] rounded-lg border border-admin-line bg-white px-3 text-[13px] text-admin-ink outline-none focus:border-brand-soft"
            >
              {data.storeTabs.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold leading-[1.55] text-admin-ink">หมวดหมู่</span>
            <select
              value={add.category}
              onChange={(e) => setAdd({ ...add, category: e.target.value })}
              className="min-h-[44px] rounded-lg border border-admin-line bg-white px-3 text-[13px] text-admin-ink outline-none focus:border-brand-soft"
            >
              {Array.from(new Set(["สิ่งของ", ...products.map((p) => p.category)])).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Field label="ราคา Token / บาท *" inputMode="numeric" value={add.price} onChange={(e) => setAdd({ ...add, price: e.target.value })} hint="1 Token = 1 บาท" />
          <Field label="Stock" inputMode="numeric" value={add.stock} onChange={(e) => setAdd({ ...add, stock: e.target.value })} />
          <BrandButton onClick={create} disabled={!addValid} className="w-full">
            เพิ่มสินค้า
          </BrandButton>
        </div>
      </Dialog>
    </>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[12px] font-semibold leading-[1.55] text-admin-ink">{label}</p>
      <p className="min-h-[44px] rounded-lg border border-brand bg-brand-tint p-3 text-[13px] leading-[1.55] text-admin-ink">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className="text-[13px] font-medium text-admin-ink">{value}</p>
    </div>
  );
}