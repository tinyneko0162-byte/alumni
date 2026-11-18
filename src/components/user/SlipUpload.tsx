"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";

export type SlipFile = { fileName: string; sizeLabel: string } | null;

const sizeLabel = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Dashed upload area + attached-file row. File is kept client-side only (mock). */
export function SlipUpload({
  value,
  onChange,
  accept,
  maxSizeMb,
  dashedBg = true,
}: {
  value: SlipFile;
  onChange: (f: SlipFile) => void;
  accept: string;
  maxSizeMb: number;
  dashedBg?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > maxSizeMb * 1024 * 1024) {
      alert(`ไฟล์ต้องไม่เกิน ${maxSizeMb} MB`);
      return;
    }
    onChange({ fileName: f.name, sizeLabel: sizeLabel(f.size) });
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex items-start justify-between">
        <p className="text-[16px] text-ink">แนบสลิปโอนเงิน</p>
        <p className="text-[11px] text-black">จำเป็น, 1 ไฟล์</p>
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
        className={`flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-brand-soft p-4 transition hover:bg-brand-tint ${
          dashedBg ? "bg-surface-upload" : "bg-white"
        }`}
      >
        <Icon name="image-up" size={25} />
        <span className="text-[13px] font-semibold text-brand-soft">
          เลือกรูปสลิปจากอุปกรณ์
        </span>
        <span className="text-[10px] text-black">{accept}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {value && (
        <div className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-white p-3">
          <div className="flex h-10 w-[34px] items-center justify-center rounded-[7px] bg-success-tint">
            <Icon name="file-image-green" size={20} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <p className="truncate font-latin text-[11px] font-medium text-ink">
              {value.fileName}
            </p>
            <p className="text-[10px] text-success-ink">
              {value.sizeLabel}, แนบไฟล์แล้ว
            </p>
          </div>
          <button
            type="button"
            aria-label="ลบไฟล์"
            onClick={() => onChange(null)}
            className="rounded p-1 hover:bg-surface-muted"
          >
            <Icon name="trash-2" size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
