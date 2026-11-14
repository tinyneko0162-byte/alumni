"use client";

import { useRouter } from "next/navigation";
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
          <p className="font-latin text-[36px] font-bold text-white">{num(total)}</p>
          <p className="text-[10px] text-brand-lilac">กรุณาโอนให้ตรงยอด เพื่อความรวดเร็วในการตรวจสอบ</p>
        </div>
        <BankAccount account={event.bankAccount} />
      </section>

      <OrderSummary orderId={cart.orderId} items={items} note={note} total={total} />

      <SlipUpload
        value={cart.slip}
        onChange={(slip) => update({ slip })}
        accept={event.slipRule.accept}
        maxSizeMb={event.slipRule.maxSizeMb}
      />

      <div className="flex flex-col gap-2.5 pt-2">
        <PrimaryButton softBorder disabled={!cart.slip} onClick={() => router.push("/checkout/status")}>
          ส่งหลักฐานการโอน
        </PrimaryButton>
        <p className="text-center text-[11px] leading-[1.7] text-black">
          การแนบสลิปยังไม่ใช่การยืนยันชำระเงินคำสั่งซื้อจะรอทีมงานตรวจสอบหลักฐาน
        </p>
      </div>
    </div>
  );
}
