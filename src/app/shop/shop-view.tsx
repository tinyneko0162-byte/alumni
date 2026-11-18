"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { OrderSummary } from "@/components/user/OrderSummary";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { deliveryOf, includesShirt, includesTicket, summarize, useCart, type PurchaseType } from "@/lib/cart";
import type { Products } from "@/lib/data";
import { baht, cx } from "@/lib/format";

const emptyAddress = { name: "", phone: "", line: "", subdistrict: "", district: "", province: "", zip: "" };

export function ShopView({ eventName, products }: { eventName: string; products: Products }) {
  const { cart, update } = useCart();
  const [chartOpen, setChartOpen] = useState(false);
  const { items, total, note } = summarize(cart);
  const hasTicket = includesTicket(cart);
  const hasShirt = includesShirt(cart);
  const needsFriendInfo = hasTicket && cart.friendTicketQty > 0;
  const delivery = deliveryOf(cart);

  // coming back after a finished order starts a new one (new number, new slip)
  useEffect(() => {
    if (cart.orderId) update({ orderId: "", slip: null });
  }, [cart.orderId, update]);

  // ===== ที่อยู่จัดส่ง =====
  const [addrOpen, setAddrOpen] = useState(false);
const [addr, setAddr] = useState(cart.address ?? emptyAddress);
const addrSaved = !!cart.address;
  const addrValid =
    addr.name.trim() !== "" &&
    addr.phone.replace(/\D/g, "").length >= 9 &&
    addr.line.trim() !== "" &&
    addr.subdistrict.trim() !== "" &&
    addr.district.trim() !== "" &&
    addr.province.trim() !== "" &&
    /^\d{5}$/.test(addr.zip);

 const saveAddress = () => {
  if (!addrValid) return;
  update({ address: addr });
  setAddrOpen(false);
};
  // ปิด popup โดยยังไม่เคยบันทึกที่อยู่ → กลับไปเลือก "รับเสื้อที่หน้างาน"
  const closeAddress = () => {
    if (!addrSaved && hasTicket) update({ delivery: "pickup" });
    setAddrOpen(false);
  };

  const setShirtQty = (qty: number) =>
    update((c) => {
      const n = Math.max(1, Math.min(10, qty));
      const shirts = c.shirts.slice(0, n);
      while (shirts.length < n) shirts.push({ size: shirts.at(-1)?.size ?? "M" });
      return { shirts };
    });

  return (
    <div className="flex flex-col gap-[18px] px-6 pt-[18px] pb-6">
      <div className="rounded-[20px] bg-brand-deep p-[18px]">
        <p className="font-latin text-[25px] font-bold text-white">{eventName}</p>
      </div>

      {/* Purchase type segmented control */}
      <div role="radiogroup" aria-label="ประเภทการซื้อ" className="flex gap-1.5 rounded-xl bg-brand-tint p-1">
        {products.purchaseTypes.map((t) => {
          const on = cart.purchaseType === t.id;
          return (
            <button
              key={t.id}
              role="radio"
              aria-checked={on}
              onClick={() => {
                update({ purchaseType: t.id as PurchaseType });
                // shirt only: no ticket, so the shirt has to be shipped → ask for the address
                if (t.id === "shirt" && !cart.address) setAddrOpen(true);
              }}
              className={cx(
                "h-[39px] flex-1 rounded-[9px] text-[11px] font-semibold transition",
                on ? "bg-brand-deep text-white" : "bg-brand-tint-2 text-black hover:brightness-95",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {hasTicket && (
        <ProductCard icon="ticket-product" iconBg="bg-brand-tint" name={products.ticket.name} price={products.ticket.price}>
          <p className="text-right text-[12px] text-black">
            {baht(products.ticket.price)} / {products.ticket.unitLabel}
          </p>
        </ProductCard>
      )}

      {hasShirt && (
        <ProductCard
          icon="shirt"
          iconBg="bg-success-tint"
          name={products.shirt.name}
          price={products.shirt.price}
          borderClass="border-[#b3b3b3]"
        >
          <div className="flex flex-col gap-[18px]">
            {cart.shirts.map((s, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <p className="text-[12px] font-medium text-ink">ตัวที่{i + 1}</p>
                  <button type="button" onClick={() => setChartOpen(true)} className="text-[11px] text-brand-deep hover:underline">
                    ตารางไซซ์
                  </button>
                </div>
                <div role="radiogroup" aria-label={`ไซซ์ตัวที่ ${i + 1}`} className="flex gap-2">
                  {products.shirt.sizes.map((size) => {
                    const on = s.size === size;
                    return (
                      <button
                        key={size}
                        role="radio"
                        aria-checked={on}
                        onClick={() =>
                          update((c) => ({
                            shirts: c.shirts.map((x, j) => (j === i ? { size } : x)),
                          }))
                        }
                        className={cx(
                          "h-[34px] flex-1 rounded-lg font-latin text-[12px] font-semibold transition",
                          on ? "bg-brand-deep text-white" : "bg-surface-muted text-black hover:bg-line",
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Stepper value={cart.shirts.length} min={1} onChange={setShirtQty} label="จำนวนเสื้อ" />
          </div>
          <div role="radiogroup" aria-label="การรับเสื้อ" className="flex justify-end gap-4">
            {products.shirt.deliveryOptions.map((d) => {
              const on = delivery === d.id;
              const locked = d.id === "pickup" && !hasTicket;
              return (
                <label key={d.id} className={cx("flex items-center gap-1 text-[12px] text-black", locked ? "cursor-not-allowed opacity-40" : "cursor-pointer")}>
                  <input
                    type="radio"
                    name="delivery"
                    className="sr-only"
                    checked={on}
                    disabled={locked}
                    onChange={() => {
                      update({ delivery: d.id as "pickup" | "delivery" });
                      if (d.id === "delivery") setAddrOpen(true); // เลือกส่งที่บ้าน → เปิด popup
                    }}
                  />
                  <span
                    className={cx(
                      "flex size-4 items-center justify-center rounded-full border",
                      on ? "border-ink" : "border-black/60",
                    )}
                  >
                    {on && <span className="size-2 rounded-full bg-ink" />}
                  </span>
                  {d.label}
                </label>
              );
            })}
          </div>

          {/* สรุปที่อยู่ที่กรอกแล้ว */}
          {!hasTicket && (
            <p className="text-right text-[11px] text-brand-deep">ซื้อเสื้ออย่างเดียว (ไม่ได้มางาน) ต้องเลือกส่งที่บ้าน</p>
          )}
          {delivery === "delivery" && !cart.address && (
            <button type="button" onClick={() => setAddrOpen(true)} className="self-end text-[12px] font-semibold text-brand-deep hover:underline">
              กรอกที่อยู่จัดส่ง
            </button>
          )}
          {delivery === "delivery" && cart.address && (
  <div className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted p-3">
    <div className="flex flex-col gap-0.5 text-[12px] leading-[1.55] text-ink">
      <p className="font-semibold">
        {cart.address.name} · {cart.address.phone}
      </p>
      <p className="text-ink/70">
        {cart.address.line} ต.{cart.address.subdistrict} อ.{cart.address.district} จ.{cart.address.province} {cart.address.zip}
      </p>
    </div>
    <button
      type="button"
      onClick={() => {
        setAddr(cart.address!);
        setAddrOpen(true);
      }}
      className="shrink-0 text-[11px] text-brand-deep hover:underline"
    >
      แก้ไข
    </button>
  </div>
)}
        </ProductCard>
      )}

      {hasTicket && (
        <div className="flex items-center justify-between rounded-[20px] border border-line bg-white p-4">
          <div className="flex flex-col gap-[3px]">
            <p className="text-[15px] text-ink">{products.friendTicket.name}</p>
            <p className="font-latin text-[19px] font-bold text-black">{baht(products.friendTicket.price)}</p>
          </div>
          <Stepper
            value={cart.friendTicketQty}
            min={0}
            onChange={(v) => update({ friendTicketQty: Math.max(0, Math.min(10, v)) })}
            label="จำนวนบัตรของเพื่อน"
          />
        </div>
      )}

      <OrderSummary orderId={cart.orderId} items={items} note={note} total={total} />

      <PrimaryButton
        softBorder
        href={needsFriendInfo ? "/shop/friend" : "/checkout/payment"}
        disabled={items.length === 0 || (hasShirt && delivery === "delivery" && !addrSaved)}
      >
        {needsFriendInfo ? "กรอกข้อมูลของเพื่อน" : "ดำเนินการชำระเงิน"}
      </PrimaryButton>

      {/* ===== Popup ตารางไซซ์ ===== */}
      <Dialog open={chartOpen} onClose={() => setChartOpen(false)} title="ตารางไซซ์เสื้อ">
        <table className="w-full text-center text-[13px] text-ink">
          <thead>
            <tr className="border-b border-line text-[12px] text-ink/60">
              <th className="py-2 font-medium">ไซซ์</th>
              <th className="py-2 font-medium">รอบอก ({products.shirt.sizeChart.unit})</th>
              <th className="py-2 font-medium">ความยาว ({products.shirt.sizeChart.unit})</th>
            </tr>
          </thead>
          <tbody>
            {products.shirt.sizeChart.rows.map((r) => (
              <tr key={r.size} className="border-b border-line last:border-0">
                <td className="py-2.5 font-latin font-semibold">{r.size}</td>
                <td className="py-2.5 font-latin">{r.chest}</td>
                <td className="py-2.5 font-latin">{r.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] leading-[1.55] text-ink/60">{products.shirt.sizeChart.note}</p>
      </Dialog>

      {/* ===== Popup รายละเอียดการจัดส่ง ===== */}
      <Dialog open={addrOpen} onClose={closeAddress} title="รายละเอียดการจัดส่ง">
        <div className="flex flex-col gap-3.5">
          <TextInput label="ชื่อผู้รับ *" value={addr.name} onChange={(v) => setAddr({ ...addr, name: v })} />
          <TextInput label="เบอร์โทรศัพท์ *" inputMode="tel" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} />
          <TextInput label="ที่อยู่ (บ้านเลขที่ / ซอย / ถนน) *" value={addr.line} onChange={(v) => setAddr({ ...addr, line: v })} />
          <div className="flex gap-3">
            <TextInput label="ตำบล / แขวง *" value={addr.subdistrict} onChange={(v) => setAddr({ ...addr, subdistrict: v })} />
            <TextInput label="อำเภอ / เขต *" value={addr.district} onChange={(v) => setAddr({ ...addr, district: v })} />
          </div>
          <div className="flex gap-3">
            <TextInput label="จังหวัด *" value={addr.province} onChange={(v) => setAddr({ ...addr, province: v })} />
            <TextInput
              label="รหัสไปรษณีย์ *"
              inputMode="numeric"
              maxLength={5}
              value={addr.zip}
              onChange={(v) => setAddr({ ...addr, zip: v.replace(/\D/g, "") })}
            />
          </div>
          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={closeAddress}
              className="h-11 flex-1 rounded-xl border border-line text-[13px] font-semibold text-ink hover:bg-surface-muted"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={saveAddress}
              disabled={!addrValid}
              className="h-11 flex-1 rounded-xl bg-brand-deep text-[13px] font-semibold text-white transition disabled:opacity-40"
            >
              บันทึกที่อยู่
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[12px] font-semibold leading-[1.55] text-ink">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-line bg-transparent px-3 text-[13px] text-ink outline-none focus:border-brand-deep"
      />
    </label>
  );
}

function ProductCard({
  icon,
  iconBg,
  name,
  price,
  children,
  borderClass = "border-line",
}: {
  icon: string;
  iconBg: string;
  name: string;
  price: number;
  children?: React.ReactNode;
  borderClass?: string;
}) {
  return (
    <section className={cx("flex flex-col gap-3.5 rounded-[20px] border bg-white p-4", borderClass)}>
      <div className="flex items-center gap-[13px]">
        <div className={cx("flex h-[76px] w-[70px] items-center justify-center rounded-[14px]", iconBg)}>
          <Icon name={icon} size={37} />
        </div>
        <div className="flex flex-1 flex-col gap-[3px]">
          <p className="text-[15px] text-ink">{name}</p>
          <p className="font-latin text-[19px] font-bold text-black">{baht(price)}</p>
        </div>
        <span className="flex size-[21px] items-center justify-center rounded-[7px] bg-brand-deep">
          <Icon name="check-white" size={14} />
        </span>
      </div>
      {children}
    </section>
  );
}

function Stepper({
  value,
  min,
  onChange,
  label,
}: {
  value: number;
  min: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex h-[34px] items-center gap-4 rounded-[9px] border border-line px-2.5" aria-label={label}>
      <button
        type="button"
        aria-label="ลด"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="disabled:opacity-30"
      >
        <Icon name="minus" size={14} />
      </button>
      <span className="min-w-3 text-center font-latin text-[13px] font-semibold text-ink" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="เพิ่ม" onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}