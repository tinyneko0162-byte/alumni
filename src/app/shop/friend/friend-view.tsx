"use client";

import { useRouter } from "next/navigation";
import { FormField } from "@/components/user/FormField";
import { OrderSummary } from "@/components/user/OrderSummary";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { summarize, useCart } from "@/lib/cart";

export function FriendView() {
  const router = useRouter();
  const { cart } = useCart();
  const { items, total, note } = summarize(cart);
  const count = Math.max(1, cart.friendTicketQty);

  return (
    <form
      className="flex flex-col gap-[18px] px-6 pt-[18px] pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/checkout/payment");
      }}
    >
      <div className="rounded-[20px] bg-brand-deep p-[18px]">
        <p className="font-latin text-[25px] font-bold text-white">กรอกข้อมูลเพื่อนของคุณ</p>
      </div>

      {Array.from({ length: count }, (_, i) => (
        <fieldset key={i} className="mt-[14px] flex flex-col gap-[15px]">
          {count > 1 && (
            <legend className="mb-2 text-[13px] font-semibold text-brand-deep">เพื่อนคนที่ {i + 1}</legend>
          )}
          <FormField label="ชื่อ–นามสกุล" icon="user-round" name={`friend${i}-name`} placeholder="ชื่อ" />
          <FormField label="อีเมล" icon="mail" name={`friend${i}-email`} type="email" placeholder="****@gmail.com" />
          <FormField label="เบอร์โทรศัพท์" icon="phone" name={`friend${i}-phone`} type="tel" placeholder="**********" />
          <FormField
            label="รหัสผ่าน"
            icon="lock-keyhole"
            name={`friend${i}-password`}
            type="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            hint="อย่างน้อย 8 ตัวอักษร มีตัวอักษรและตัวเลข"
          />
        </fieldset>
      ))}

      <div className="h-5" />
      <OrderSummary orderId={cart.orderId} items={items} note={note} total={total} />
      <PrimaryButton type="submit" softBorder>
        ดำเนินการชำระเงิน
      </PrimaryButton>
    </form>
  );
}
