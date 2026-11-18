"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/user/FormField";
import { OrderSummary } from "@/components/user/OrderSummary";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { summarize, useCart, type Friend } from "@/lib/cart";

const blank: Friend = { name: "", email: "", phone: "" };
const validEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());

export function FriendView() {
  const router = useRouter();
  const { cart, update } = useCart();
  const { items, total, note } = summarize(cart);
  const count = Math.max(1, cart.friendTicketQty);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [tried, setTried] = useState(false);

  // one form per friend ticket, pre-filled with what was typed before
  useEffect(() => {
    setFriends(Array.from({ length: count }, (_, i) => cart.friends[i] ?? blank));
  }, [count, cart.friends]);

  const set = (i: number, patch: Partial<Friend>) => setFriends((all) => all.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const errors = friends.map((f) => ({
    name: f.name.trim() ? "" : "กรอกชื่อเพื่อน",
    email: validEmail(f.email) ? "" : "อีเมลไม่ถูกต้อง ตัวอย่าง name@gmail.com",
  }));

  return (
    <form
      className="flex flex-col gap-[18px] px-6 pt-[18px] pb-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (errors.some((x) => x.name || x.email)) return;
        update({ friends: friends.map((f) => ({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() })) });
        router.push("/checkout/payment");
      }}
    >
      <div className="rounded-[20px] bg-brand-deep p-[18px]">
        <p className="font-latin text-[25px] font-bold text-white">กรอกข้อมูลเพื่อนของคุณ</p>
      </div>
      <p className="text-[12px] leading-[1.55] text-black">
        เมื่อชำระเงินผ่านแล้ว ระบบจะส่งลิงก์บัตรเข้างานไปที่อีเมลของเพื่อนแต่ละคน ไม่ต้องตั้งรหัสผ่านแทนเพื่อน
      </p>

      {friends.map((f, i) => (
        <fieldset key={i} className="mt-[14px] flex flex-col gap-[15px]">
          {count > 1 && <legend className="mb-2 text-[13px] font-semibold text-brand-deep">เพื่อนคนที่ {i + 1}</legend>}
          <FormField
            label="ชื่อ–นามสกุล"
            icon="user-round"
            name={`friend${i}-name`}
            placeholder="ชื่อ"
            value={f.name}
            onChange={(v) => set(i, { name: v })}
            error={tried ? errors[i]?.name : undefined}
          />
          <FormField
            label="อีเมล"
            icon="mail"
            name={`friend${i}-email`}
            type="email"
            placeholder="****@gmail.com"
            value={f.email}
            onChange={(v) => set(i, { email: v })}
            error={tried ? errors[i]?.email : undefined}
          />
          <FormField
            label="เบอร์โทรศัพท์"
            icon="phone"
            name={`friend${i}-phone`}
            type="tel"
            placeholder="**********"
            required={false}
            value={f.phone}
            onChange={(v) => set(i, { phone: v })}
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
