"use client";

import { useMemo, useState } from "react";
import { BrandButton, Chip, Field, OutlineButton, PageHeading, Panel, SearchBox } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getProductCatalog } from "@/lib/admin-data";
import { cx } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getProductCatalog>>;
type Product = Data["products"][number];

const nowLabel = () => {
  const d = new Date();
  const date = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
};

export function ProductsView({ data }: { data: Data }) {
  const [products, setProducts] = useState<Product[]>(data.products);
  const [tab, setTab] = useState<string>("ทุกร้าน");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(data.products.at(-1)!.sku);
  const current = products.find((p) => p.sku === selected) ?? products[0];
  const [form, setForm] = useState({ stock: String(current.stock), price: String(current.price), status: current.status });

  const select = (p: Product) => {
    setSelected(p.sku);
    setForm({ stock: String(p.stock), price: String(p.price), status: p.status });
  };

  const shown = useMemo(
    () =>
      products.filter(
        (p) => (tab === "ทุกร้าน" || p.store === tab) && (p.name + p.store + p.sku).includes(query.trim()),
      ),
    [products, tab, query],
  );

  const save = () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price <= 0) return;
    setProducts((all) =>
      all.map((p) => (p.sku === current.sku ? { ...p, price, stock: Number.isFinite(stock) ? stock : p.stock, status: form.status, updatedAt: nowLabel() } : p)),
    );
  };

  return (
    <>
      <PageHeading title={data.title} description={data.description} actions={<BrandButton icon="a-plus-white">เพิ่มสินค้า</BrandButton>} />

      <div className="flex items-start gap-2.5 rounded-lg bg-brand-soft p-3">
        <Icon name="a-info-dark" size={18} />
        <p className="flex-1 text-[12px] leading-[1.55] text-black">{data.guidance}</p>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel title="รายการสินค้า" className="min-h-[600px] flex-1">
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
                {shown.map((p) => (
                  <tr key={p.sku} className={p.sku === current.sku ? "bg-brand-tint/50" : undefined}>
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
                      <button type="button" onClick={() => select(p)} className="text-admin-muted hover:text-brand">
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
              แสดง 1–{Math.min(data.pageSize, shown.length)} จาก {data.totalProducts} สินค้า
            </p>
            <div className="flex gap-2">
              <OutlineButton icon="a-chevron-left">ก่อนหน้า</OutlineButton>
              <span className="rounded-md bg-admin-indigo-tint p-2.5 text-[12px] leading-[1.55] text-admin-indigo">1</span>
              <OutlineButton icon="a-chevron-right-dark">ถัดไป</OutlineButton>
            </div>
          </div>
        </Panel>

        <div className="flex flex-col gap-5 xl:w-[350px]">
          <Panel title="แก้ไขราคาสินค้า">
            <LockedField label="ชื่อสินค้า" value={current.name} />
            <LockedField label="ร้านค้า" value={`${current.store} · ${current.storeCode}`} />
            <LockedField label="หมวดหมู่" value={current.category} />
            <Field label="Stock" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} hint={`หน่วย: ${current.unit}`} />
            <Field
              label="ราคา Token / บาท *"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              hint="ใช้ราคาเดียวกันทุกอุปกรณ์ของร้าน • 1 Token = 1 บาท"
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
            <BrandButton icon="a-save-white" onClick={save} className="w-full">
              บันทึกราคาสินค้า
            </BrandButton>
          </Panel>

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
        </div>
      </div>
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
