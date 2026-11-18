"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser } from "@/lib/actions";
import { FormField } from "@/components/user/FormField";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { EventInfo } from "@/lib/data";

const PASSWORD_HINT = "อย่างน้อย 8 ตัวอักษร มีตัวอักษรและตัวเลข";
const phoneOk = (p: string) => /^0\d{8,9}$/.test(p.replace(/[\s-]/g, ""));
const strong = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export function RegisterForm({ policy }: { policy: EventInfo["policy"] }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [accepted, setAccepted] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim());
  const errors = {
    name: submitted && !f.name.trim() ? "กรอกชื่อและนามสกุล" : undefined,
    email: submitted && !emailOk ? "กรอกอีเมลให้ถูกต้อง เช่น name@gmail.com" : undefined,
    phone: submitted && !phoneOk(f.phone) ? "กรอกเบอร์โทรศัพท์ 9–10 หลัก เช่น 0812345678" : undefined,
    password: submitted && !strong(f.password) ? PASSWORD_HINT : undefined,
    confirm: submitted && (!f.confirm || f.confirm !== f.password) ? (f.confirm ? "รหัสผ่านไม่ตรงกัน" : "กรอกรหัสผ่านอีกครั้ง") : undefined,
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-[22px]"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!f.name.trim() || !emailOk || !phoneOk(f.phone) || !strong(f.password) || !f.confirm || f.confirm !== f.password || !accepted) return;
        setServerError(null);
        const res = await registerUser({ fullName: f.name.trim(), email: f.email.trim(), phone: f.phone, password: f.password });
        if (!res.ok) return setServerError(res.error);
        router.push("/shop");
      }}
    >
      <div className="flex flex-col gap-[15px]">
        <FormField label="ชื่อ–นามสกุล" icon="user-round" name="name" placeholder="ชื่อ" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} />
        <FormField label="อีเมล" icon="mail" name="email" type="email" placeholder="****@gmail.com" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} />
        <FormField label="เบอร์โทรศัพท์" icon="phone" name="phone" type="tel" placeholder="**********" autoComplete="tel" value={f.phone} onChange={set("phone")} error={errors.phone} />
        <FormField label="รหัสผ่าน" icon="lock-keyhole" name="password" type="password" placeholder="••••••••••" autoComplete="new-password" hint={PASSWORD_HINT} value={f.password} onChange={set("password")} error={errors.password} />
        <FormField label="ยืนยันรหัสผ่าน" icon="lock-keyhole" name="confirm" type="password" placeholder="••••••••••" autoComplete="new-password" hint={PASSWORD_HINT} value={f.confirm} onChange={set("confirm")} error={errors.confirm} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <label className="flex cursor-pointer items-start" aria-label="ยอมรับข้อกำหนดและนโยบาย">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 ${
                accepted ? "bg-check" : "border border-line bg-white"
              }`}
            >
              {accepted && <Icon name="check-white" size={14} />}
            </span>
          </label>
          <p className="text-[12px] leading-[1.8] text-black">
            ฉันยอมรับ
            <button type="button" onClick={() => setPolicyOpen(true)} className="text-brand-soft underline-offset-2 hover:underline">
              {policy.termsTitle}
            </button>
            และรับทราบ
            <button type="button" onClick={() => setPolicyOpen(true)} className="text-brand-soft underline-offset-2 hover:underline">
              {policy.privacyTitle}
            </button>
            <span className="block font-semibold text-brand-deep">รวมถึงรับทราบว่า{policy.refundNotice}</span>
          </p>
        </div>
        {submitted && !accepted && <p role="alert" className="text-[11px] text-danger">กรุณาติ๊กยอมรับข้อกำหนดและนโยบายก่อนลงทะเบียน</p>}
      </div>

      <Dialog open={policyOpen} onClose={() => setPolicyOpen(false)} title="ข้อกำหนดและนโยบาย">
        <div className="flex flex-col gap-5">
          <PolicySection title={policy.termsTitle} items={policy.terms} />
          <PolicySection title={policy.privacyTitle} items={policy.privacy} />
          <PrimaryButton
            onClick={() => {
              setAccepted(true);
              setPolicyOpen(false);
            }}
          >
            ยอมรับและปิด
          </PrimaryButton>
        </div>
      </Dialog>

      {serverError && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[12px] leading-[1.55] text-danger">
          {serverError}
        </p>
      )}
      <PrimaryButton type="submit">ลงทะเบียนและเลือกซื้อสินค้า</PrimaryButton>
      <p className="text-center text-[12px] text-black">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand-deep hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}

function PolicySection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[14px] font-semibold text-ink-slate">{title}</h3>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[13px] leading-[1.7] text-black marker:text-brand">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
    </section>
  );
}
