"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/user/FormField";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { Icon } from "@/components/ui/Icon";

const PASSWORD_HINT = "อย่างน้อย 8 ตัวอักษร มีตัวอักษรและตัวเลข";
const strong = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export function RegisterForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [accepted, setAccepted] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const errors = {
    password: submitted && !strong(f.password) ? PASSWORD_HINT : undefined,
    confirm: submitted && f.confirm !== f.password ? "รหัสผ่านไม่ตรงกัน" : undefined,
  };

  return (
    <form
      className="flex flex-col gap-[22px]"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!strong(f.password) || f.confirm !== f.password || !accepted) return;
        // Mock: no backend yet — go straight to the shop.
        router.push("/shop");
      }}
    >
      <div className="flex flex-col gap-[15px]">
        <FormField label="ชื่อ–นามสกุล" icon="user-round" name="name" placeholder="ชื่อ" autoComplete="name" value={f.name} onChange={set("name")} />
        <FormField label="อีเมล" icon="mail" name="email" type="email" placeholder="****@gmail.com" autoComplete="email" value={f.email} onChange={set("email")} />
        <FormField label="เบอร์โทรศัพท์" icon="phone" name="phone" type="tel" placeholder="**********" autoComplete="tel" value={f.phone} onChange={set("phone")} />
        <FormField label="รหัสผ่าน" icon="lock-keyhole" name="password" type="password" placeholder="••••••••••" autoComplete="new-password" hint={PASSWORD_HINT} value={f.password} onChange={set("password")} error={errors.password} />
        <FormField label="ยืนยันรหัสผ่าน" icon="lock-keyhole" name="confirm" type="password" placeholder="••••••••••" autoComplete="new-password" hint={PASSWORD_HINT} value={f.confirm} onChange={set("confirm")} error={errors.confirm} />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 ${
            accepted ? "bg-brand-soft" : "border border-line bg-white"
          }`}
        >
          {accepted && <Icon name="check-white" size={14} />}
        </span>
        <span className="text-[12px] leading-[1.8] text-black">
          <span className="block">
            ฉันยอมรับ<span className="text-brand-soft">ข้อกำหนดการใช้งาน</span>
          </span>
          <span className="block">
            และรับทราบ<span className="text-brand-soft">นโยบายความเป็นส่วนตัว</span>
          </span>
        </span>
      </label>
      {submitted && !accepted && (
        <p className="-mt-4 text-[11px] text-danger">กรุณายอมรับข้อกำหนดก่อนลงทะเบียน</p>
      )}

      <PrimaryButton type="submit">ลงทะเบียนและเลือกซื้อสินค้า</PrimaryButton>
    </form>
  );
}
