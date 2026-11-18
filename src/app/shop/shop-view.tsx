"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { FormField } from "@/components/user/FormField";
import { OrderSummary } from "@/components/user/OrderSummary";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { addressErrors, cartProblem, deliveryOf, emptyAddress, emptyFriend, friendErrors, summarize, useCart, type Address, type Friend } from "@/lib/cart";
import type { Products } from "@/lib/data";
import { baht, cx } from "@/lib/format";

const MAX = 10;

/**
 * One page for everything: tick your own ticket, add shirts (a size for each, then how to get them),
 * add tickets for friends (their name and email right below). Nothing opens until you choose it.
 */
export function ShopView({ eventName, products }: { eventName: string; products: Products }) {
  const router = useRouter();
  const { cart, update, ready } = useCart();
  const [chartOpen, setChartOpen] = useState(false);
  const [tried, setTried] = useState(false);
  const { items, total, note } = summarize(cart);
  const delivery = deliveryOf(cart);
  const hasShirt = cart.shirts.length > 0;
  const problem = cartProblem(cart);
  const addrErr = addressErrors(cart.address);

  // coming back after a finished order starts a new one (new number, new slip)
  useEffect(() => {
    if (ready && cart.orderId) update({ orderId: "", slip: null });
  }, [ready, cart.orderId, update]);

  const setShirtQty = (n: number) =>
    update((c) => {
      const shirts = c.shirts.slice(0, Math.max(0, Math.min(MAX, n)));
      while (shirts.length < n && shirts.length < MAX) shirts.push({ size: shirts.at(-1)?.size ?? "M" });
      return { shirts };
    });
  const setFriendQty = (n: number) =>
    update((c) => {
      const friends = c.friends.slice(0, Math.max(0, Math.min(MAX, n)));
      while (friends.length < n && friends.length < MAX) friends.push({ ...emptyFriend });
      return { friends };
    });
  const setFriend = (i: number, patch: Partial<Friend>) => update((c) => ({ friends: c.friends.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const setAddr = (patch: Partial<Address>) => update((c) => ({ address: { ...(c.address ?? emptyAddress), ...patch } }));

  const next = () => {
    setTried(true);
    if (!problem) router.push("/checkout/payment");
  };

  return (
    <div className="flex flex-col gap-[18px] px-6 pt-[18px] pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[25px] font-bold leading-[1.3] text-ink">{eventName}</h1>
        <p className="text-[12px] text-black/70">เลือกบัตร เสื้อ และบัตรของเพื่อนได้ในหน้านี้</p>
      </div>

      {/* ===== บัตรของฉัน ===== */}
      <ProductCard
        icon="ticket-product"
        iconBg="bg-brand-tint"
        name={products.ticket.name}
        price={products.ticket.price}
        checked={cart.self}
        onToggle={() => update((c) => ({ self: !c.self }))}
        label="ซื้อบัตรเข้างานของฉัน"
      >
        <p className="text-[12px] text-black">{cart.self ? "บัตรของคุณ, รวม 200 Token เข้ากระเป๋า" : "ไม่ซื้อบัตรของตัวเอง (เช่น ซื้อให้เพื่อนหรือซื้อเสื้ออย่างเดียว)"}</p>
      </ProductCard>

      {/* ===== เสื้อรุ่น ===== */}
      <ProductCard
        icon="shirt"
        iconBg="bg-success-tint"
        name={products.shirt.name}
        price={products.shirt.price}
        checked={hasShirt}
        onToggle={() => setShirtQty(hasShirt ? 0 : 1)}
        label="ซื้อเสื้อรุ่น"
        aside={<Stepper value={cart.shirts.length} min={0} onChange={setShirtQty} label="จำนวนเสื้อ" />}
      >
        {!hasShirt && <p className="text-[12px] text-black">กด + เพื่อเพิ่มเสื้อ แล้วเลือกไซซ์ของแต่ละตัว</p>}
        {hasShirt && (
          <div className="flex flex-col gap-[18px]">
            {cart.shirts.map((s, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <p className="text-[12px] font-medium text-ink">ตัวที่ {i + 1}</p>
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
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => update((c) => ({ shirts: c.shirts.map((x, j) => (j === i ? { size } : x)) }))}
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

            <div className="flex flex-col gap-2 border-t border-line pt-3.5">
              <p className="text-[12px] font-medium text-ink">การรับเสื้อ</p>
              <div role="radiogroup" aria-label="การรับเสื้อ" className="grid grid-cols-2 gap-2">
                {products.shirt.deliveryOptions.map((d) => {
                  const on = delivery === d.id;
                  const locked = d.id === "pickup" && !cart.self;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={locked}
                      onClick={() => update({ delivery: d.id as "pickup" | "delivery" })}
                      className={cx(
                        "h-[38px] rounded-lg border text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                        on ? "border-brand-deep bg-brand-tint text-brand-deep" : "border-line text-black hover:bg-surface-muted",
                      )}
                    >
                      {d.label}
                      {d.id === "delivery" && " (ฟรี)"}
                    </button>
                  );
                })}
              </div>
              {!cart.self && <p className="text-[11px] text-brand-deep">ไม่ได้ซื้อบัตรของตัวเอง (ไม่ได้มางาน) จึงต้องส่งเสื้อที่บ้าน</p>}
            </div>

            {delivery === "delivery" && (
              <div className="flex flex-col gap-3 rounded-xl bg-surface-muted p-3.5">
                <p className="text-[13px] font-semibold text-ink">ที่อยู่จัดส่งเสื้อ</p>
                <TextInput label="ชื่อผู้รับ *" value={cart.address?.name ?? ""} onChange={(v) => setAddr({ name: v })} error={tried ? addrErr.name : ""} />
                <TextInput label="เบอร์โทรศัพท์ *" inputMode="tel" value={cart.address?.phone ?? ""} onChange={(v) => setAddr({ phone: v })} error={tried ? addrErr.phone : ""} />
                <TextInput label="ที่อยู่ (บ้านเลขที่ / ซอย / ถนน) *" value={cart.address?.line ?? ""} onChange={(v) => setAddr({ line: v })} error={tried ? addrErr.line : ""} />
                <div className="flex gap-2.5">
                  <TextInput label="ตำบล / แขวง *" value={cart.address?.subdistrict ?? ""} onChange={(v) => setAddr({ subdistrict: v })} error={tried ? addrErr.subdistrict : ""} />
                  <TextInput label="อำเภอ / เขต *" value={cart.address?.district ?? ""} onChange={(v) => setAddr({ district: v })} error={tried ? addrErr.district : ""} />
                </div>
                <div className="flex gap-2.5">
                  <TextInput label="จังหวัด *" value={cart.address?.province ?? ""} onChange={(v) => setAddr({ province: v })} error={tried ? addrErr.province : ""} />
                  <TextInput
                    label="รหัสไปรษณีย์ *"
                    inputMode="numeric"
                    maxLength={5}
                    value={cart.address?.zip ?? ""}
                    onChange={(v) => setAddr({ zip: v.replace(/\D/g, "") })}
                    error={tried ? addrErr.zip : ""}
                  />
                </div>
                <p className="text-[11px] text-black/70">จัดส่งฟรีภายใน 14 วันหลังวันงาน</p>
              </div>
            )}
          </div>
        )}
      </ProductCard>

      {/* ===== บัตรของเพื่อน ===== */}
      <ProductCard
        icon="ticket-product"
        iconBg="bg-brand-tint"
        name={products.friendTicket.name}
        price={products.friendTicket.price}
        checked={cart.friends.length > 0}
        onToggle={() => setFriendQty(cart.friends.length ? 0 : 1)}
        label="ซื้อบัตรให้เพื่อน"
        aside={<Stepper value={cart.friends.length} min={0} onChange={setFriendQty} label="จำนวนบัตรของเพื่อน" />}
      >
        {cart.friends.length === 0 ? (
          <p className="text-[12px] text-black">กด + เพื่อซื้อบัตรให้เพื่อน เพื่อนได้บัตรและ 200 Token ของตัวเอง</p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[12px] leading-[1.6] text-black">ระบบจะส่งลิงก์บัตรไปที่อีเมลของเพื่อนแต่ละคน ไม่ต้องตั้งรหัสผ่านแทนเพื่อน</p>
            {cart.friends.map((f, i) => {
              const err = friendErrors(f);
              return (
                <fieldset key={i} className="flex flex-col gap-3 border-t border-line pt-3.5">
                  <legend className="sr-only">เพื่อนคนที่ {i + 1}</legend>
                  <p className="text-[13px] font-semibold text-brand-deep">เพื่อนคนที่ {i + 1}</p>
                  <FormField label="ชื่อ–นามสกุล" icon="user-round" name={`friend${i}-name`} placeholder="ชื่อเพื่อน" value={f.name} onChange={(v) => setFriend(i, { name: v })} error={tried ? err.name || undefined : undefined} />
                  <FormField label="อีเมล" icon="mail" name={`friend${i}-email`} type="email" placeholder="****@gmail.com" value={f.email} onChange={(v) => setFriend(i, { email: v })} error={tried ? err.email || undefined : undefined} />
                  <FormField label="เบอร์โทรศัพท์" icon="phone" name={`friend${i}-phone`} type="tel" placeholder="ไม่บังคับ" required={false} value={f.phone} onChange={(v) => setFriend(i, { phone: v })} />
                </fieldset>
              );
            })}
          </div>
        )}
      </ProductCard>

      <OrderSummary orderId={cart.orderId} items={items} note={note} total={total} />

      {tried && problem && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[12px] leading-[1.55] text-danger">
          {problem}
        </p>
      )}
      <PrimaryButton softBorder onClick={next} disabled={items.length === 0}>
        ดำเนินการชำระเงิน
      </PrimaryButton>

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
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  inputMode,
  maxLength,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  error?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[12px] font-semibold leading-[1.55] text-ink">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cx(
          "h-11 w-full rounded-lg border bg-white px-3 text-[13px] text-ink outline-none focus:border-brand-deep",
          error ? "border-danger" : "border-line",
        )}
      />
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </label>
  );
}

/** Product row with a tick box on the right; details (children) sit under it. */
function ProductCard({
  icon,
  iconBg,
  name,
  price,
  checked,
  onToggle,
  label,
  aside,
  children,
}: {
  icon: string;
  iconBg: string;
  name: string;
  price: number;
  checked: boolean;
  onToggle: () => void;
  label: string;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className={cx("flex flex-col gap-3.5 rounded-[20px] border bg-white p-4 transition", checked ? "border-brand-soft" : "border-line")}>
      <div className="flex items-center gap-[13px]">
        <div className={cx("flex h-[76px] w-[70px] shrink-0 items-center justify-center rounded-[14px]", iconBg)}>
          <Icon name={icon} size={37} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="text-[15px] text-ink">{name}</p>
          <p className="font-latin text-[19px] font-bold text-black">{baht(price)}</p>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={label}
          onClick={onToggle}
          className={cx(
            "flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border transition",
            checked ? "border-brand-deep bg-brand-deep" : "border-[#b3b3b3] bg-white hover:border-brand-deep",
          )}
        >
          {checked && <Icon name="check-white" size={14} />}
        </button>
      </div>
      {aside && <div className="flex justify-end">{aside}</div>}
      {children}
    </section>
  );
}

function Stepper({ value, min, onChange, label }: { value: number; min: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex h-[34px] items-center gap-4 rounded-[9px] border border-line px-2.5" role="group" aria-label={label}>
      <button type="button" aria-label="ลด" disabled={value <= min} onClick={() => onChange(value - 1)} className="disabled:opacity-30">
        <Icon name="minus" size={14} />
      </button>
      <span className="min-w-3 text-center font-latin text-[13px] font-semibold text-ink" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="เพิ่ม" disabled={value >= MAX} onClick={() => onChange(value + 1)} className="disabled:opacity-30">
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
