"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { EventInfo } from "@/lib/data";

/** Bank name, account number with copy button, account holder. */
export function BankAccount({
  account,
  className,
}: {
  account: EventInfo["bankAccount"];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber.replace(/-/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className={`flex flex-col gap-3 p-[18px] ${className ?? ""}`}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-[11px] bg-success-tint">
          <Icon name="landmark" size={21} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-semibold text-ink">{account.bankName}</p>
          <p className="text-[10px] text-black">{account.accountType}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-latin text-[22px] text-ink">{account.accountNumber}</p>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-brand-tint"
        >
          <Icon name="copy-sm" size={14} />
          <span className="text-[11px] text-brand-deep">
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </span>
        </button>
      </div>
      <p className="text-[12px] text-black">ชื่อบัญชี: {account.accountName}</p>
    </div>
  );
}
