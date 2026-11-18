"use client";

import { useEffect, useState } from "react";
import { SlipUpload, type SlipFile } from "@/components/user/SlipUpload";
import { PrimaryButton } from "@/components/user/PrimaryButton";
import { myTopups, requestTopup } from "@/lib/actions";

const SAMPLE: SlipFile = { fileName: "slip_CF26-0148.jpg", sizeLabel: "1.2 MB" };
const STATE: Record<string, string> = { pending: "รอเจ้าหน้าที่ตรวจ", done: "เติมสำเร็จ", resubmit: "ขอหลักฐานใหม่" };

export function WalletTopUp({ accept, maxSizeMb }: { accept: string; maxSizeMb: number }) {
  const [slip, setSlip] = useState<SlipFile | null>(SAMPLE);
  const [amount, setAmount] = useState("500");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [list, setList] = useState<{ id: string; amount: number; state: string }[]>([]);

  useEffect(() => {
    void myTopups().then(setList);
    const t = setInterval(() => void myTopups().then(setList), 5000); // see staff decisions without reloading
    return () => clearInterval(t);
  }, []);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const res = await requestTopup({ amount: Number(amount), slipFile: slip?.fileName ?? "" });
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: `ส่งคำขอ ${res.id} แล้ว เจ้าหน้าที่จะตรวจและเติม Token ให้` });
    setList(await myTopups());
  };

  return (
    <div className="flex flex-col gap-3">
      <SlipUpload value={slip} onChange={setSlip} accept={accept} maxSizeMb={maxSizeMb} dashedBg={false} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-ink-slate">จำนวนเงินที่โอน (บาท)</span>
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          className="h-[48px] rounded-xl border border-line-slate bg-white px-4 text-[15px] text-ink-slate outline-none focus:border-brand-soft"
        />
      </label>
      <PrimaryButton onClick={submit} disabled={busy}>
        {busy ? "กำลังส่ง…" : "ส่งหลักฐานเติม Token"}
      </PrimaryButton>
      {msg && (
        <p role="status" className={`text-[12px] leading-[1.55] ${msg.ok ? "text-[#167a52]" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
      {list.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-xl bg-surface-upload p-3 text-[12px] text-black">
          {list.map((t) => (
            <li key={t.id} className="flex justify-between">
              <span>
                {t.id} · ฿{t.amount.toLocaleString("en-US")}
              </span>
              <span className="font-semibold">{STATE[t.state] ?? t.state}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
