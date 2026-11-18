"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginUser } from "@/lib/actions";
import { FormField } from "@/components/user/FormField";
import { PrimaryButton } from "@/components/user/PrimaryButton";

export function UserLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-[22px]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) return setError("กรอกอีเมลและรหัสผ่าน");
        setBusy(true);
        const res = await loginUser(email, password);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        router.push(next);
        router.refresh();
      }}
    >
      <div className="flex flex-col gap-[15px]">
        <FormField label="อีเมล" icon="mail" name="email" type="email" placeholder="****@gmail.com" autoComplete="email" value={email} onChange={setEmail} />
        <FormField label="รหัสผ่าน" icon="lock-keyhole" name="password" type="password" placeholder="••••••••••" autoComplete="current-password" value={password} onChange={setPassword} />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[12px] leading-[1.55] text-danger">
          {error}
        </p>
      )}
      <PrimaryButton type="submit" disabled={busy}>
        {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </PrimaryButton>
      <p className="text-center text-[12px] text-black">
        ยังไม่มีบัญชี?{" "}
        <Link href="/" className="font-semibold text-brand-deep hover:underline">
          ลงทะเบียน
        </Link>
        {" • "}เพื่อนที่ได้บัตรจากคุณ ลงทะเบียนด้วยอีเมลที่ได้รับลิงก์ บัตรและ Token จะขึ้นให้เอง
      </p>
      <p className="rounded-lg bg-brand-tint p-3 text-[12px] leading-[1.55] text-ink-slate">บัญชีทดลอง: kittiphong@example.com รหัสผ่าน 12345678</p>
    </form>
  );
}
