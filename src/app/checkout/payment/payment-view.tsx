"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitOrder } from "@/lib/actions";
import { BankAccount } from "@/components/user/BankAccount";
import { OrderSummary } from "@/components/user/OrderSummary";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { SlipUpload } from "@/components/user/SlipUpload";
import { summarize, useCart } from "@/lib/cart";
import type { EventInfo } from "@/lib/data";
import { num } from "@/lib/format";

export function PaymentView({ event }: { event: EventInfo }) {
  const router = useRouter();
  const { cart, update } = useCart();
  const { items, total, note } = summarize(cart);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!cart.slip || busy) return;
    setBusy(true);
    setError(null);
    let profile = {
      name: "กิตติพงศ์ วัฒนกุล",
      email: "kittiphong@example.com",
    };
    try {
      const raw = localStorage.getItem("alumni-profile");
      if (raw) profile = { ...profile, ...JSON.parse(raw) };
    } catch {
      /* use sample profile */
    }
    const qty =
      items
        .filter((i) => i.label.includes("บัตร"))
        .reduce((n, i) => n + i.qty, 0) || 1;
    const res = await submitOrder({
      ...profile,
      ticketType: items[0]?.label ?? "บัตร",
      qty,
      amount: total,
      slipFile: cart.slip.fileName,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    try {
      sessionStorage.setItem("alumni-order-id", res.id);
    } catch {
      /* status page falls back to the latest order */
    }
    router.push("/checkout/status");
  };

  return (
    <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
      <div className="flex flex-col gap-[5px]">
        <h2 className="text-[25px] font-bold text-ink">โอนเงิน แล้วแนบสลิป</h2>
        <p className="text-[12px] leading-[1.7] text-black">
          โอนตามยอดด้านล่าง
          <br />
          พร้อมส่งหลักฐานทีมงานจะตรวจสอบก่อนยืนยันคำสั่งซื้อ
        </p>
      </div>

      <section className="overflow-hidden rounded-[20px] border border-line bg-white">
        <div className="flex flex-col items-center gap-[5px] bg-brand-deep p-[18px]">
          <p className="text-[12px] text-brand-lilac">ยอดที่ต้องโอน (บาท)</p>
          <p className="font-latin text-[36px] font-bold text-white">
            {num(total)}
          </p>
          <p className="text-[10px] text-brand-lilac">
            กรุณาโอนให้ตรงยอด เพื่อความรวดเร็วในการตรวจสอบ
          </p>
        </div>
        <BankAccount account={event.bankAccount} />
      </section>

      <OrderSummary
        orderId={cart.orderId}
        items={items}
        note={note}
        total={total}
      />
      {cart.delivery === "delivery" && cart.address && (
        <section className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-ink">
              ที่อยู่จัดส่งเสื้อ
            </p>
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="text-[11px] text-brand-deep hover:underline"
            >
              แก้ไข
            </button>
          </div>
          <p className="text-[13px] font-medium text-ink">
            {cart.address.name} · {cart.address.phone}
          </p>
          <p className="text-[12px] leading-[1.55] text-ink/70">
            {cart.address.line} ต.{cart.address.subdistrict} อ.
            {cart.address.district} จ.{cart.address.province} {cart.address.zip}
          </p>
        </section>
      )}

      <SlipUpload
        value={cart.slip}
        onChange={(slip) => update({ slip })}
        accept={event.slipRule.accept}
        maxSizeMb={event.slipRule.maxSizeMb}
      />

      <div className="flex flex-col gap-2.5 pt-2">
        <PrimaryButton softBorder disabled={!cart.slip || busy} onClick={send}>
          {busy ? "กำลังส่ง…" : "ส่งหลักฐานการโอน"}
        </PrimaryButton>
        {error && (
          <p role="alert" className="text-center text-[12px] text-danger">
            {error}
          </p>
        )}
        <p className="text-center text-[11px] leading-[1.7] text-black">
          การแนบสลิปยังไม่ใช่การยืนยันชำระเงินคำสั่งซื้อจะรอทีมงานตรวจสอบหลักฐาน
        </p>
      </div>
    </div>
  );
}
