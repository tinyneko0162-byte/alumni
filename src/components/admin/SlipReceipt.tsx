import { Icon } from "@/components/ui/Icon";

/** Mock bank-transfer slip shown in review screens (ticket slips + token top-ups). */
export function SlipReceipt({
  amount,
  purpose,
  fromName,
  fromAccount,
  toName,
  toAccount,
  paidAt,
  reference,
  fileName,
  footer,
}: {
  amount: number;
  purpose: string;
  fromName: string;
  fromAccount: string;
  toName: string;
  toAccount: string;
  paidAt: string;
  reference: string;
  fileName: string;
  footer?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg bg-brand-tint p-[22px]">
      <div className="flex w-full items-start justify-between">
        <p className="text-[10px] leading-[1.55] text-admin-muted">{fileName}</p>
        <button type="button" aria-label="ซูม">
          <Icon name="a-zoom-in" size={17} />
        </button>
      </div>
      <div className="flex w-[265px] max-w-full flex-col items-center gap-3.5 rounded-md bg-white p-[22px] leading-[1.55] shadow-[0_3px_12px_rgba(27,33,64,0.03)]">
        <span className="flex size-10 items-center justify-center rounded-full bg-admin-ok-tint">
          <Icon name="a-check-green" size={20} />
        </span>
        <p className="text-[15px] font-semibold text-admin-ink">โอนเงินสำเร็จ</p>
        <p className="text-[10px] text-admin-muted">สลิปจำลองเพื่อการออกแบบ</p>
        <p className="font-latin text-[28px] font-semibold text-admin-ink">
          {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[11px] text-admin-muted">บาท • {purpose}</p>
        <div className="h-px w-full bg-admin-line" />
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-[12px] text-admin-muted">จาก</p>
          <p className="text-[13px] font-medium text-admin-ink">{fromName}</p>
        </div>
        <p className="text-[10px] text-admin-muted">{fromAccount}</p>
        <Icon name="a-arrow-down" size={16} />
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-[12px] text-admin-muted">ถึง</p>
          <p className="text-[13px] font-medium text-admin-ink">{toName}</p>
        </div>
        <p className="text-[10px] text-admin-muted">{toAccount}</p>
        <div className="h-px w-full bg-admin-line" />
        <p className="text-[10px] text-admin-muted">{paidAt}</p>
        <p className="text-[10px] text-admin-muted">{reference}</p>
      </div>
      {footer && <p className="text-[10px] leading-[1.55] text-admin-muted">{footer}</p>}
    </div>
  );
}
