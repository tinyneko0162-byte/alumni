/* eslint-disable @next/next/no-img-element -- private slip served by our own API, not a static asset */
"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";

/** The slip the attendee actually uploaded (image or PDF). Click to enlarge. */
export function SlipImage({ url, fileName }: { url: string; fileName: string }) {
  const [open, setOpen] = useState(false);
  const pdf = fileName.toLowerCase().endsWith(".pdf");
  if (pdf) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-admin-line p-4 text-[13px] font-semibold text-admin-indigo hover:underline">
        เปิดสลิป PDF ({fileName})
      </a>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex justify-center rounded-lg bg-admin-head p-3" aria-label="ขยายสลิป">
        <img src={url} alt={`สลิป ${fileName}`} className="max-h-[420px] w-auto rounded-md object-contain" />
      </button>
      <p className="text-[11px] leading-[1.55] text-admin-muted">สลิปจริงที่ผู้ร่วมงานแนบมา ({fileName}) กดที่รูปเพื่อขยาย</p>
      <Dialog open={open} onClose={() => setOpen(false)} title="สลิปที่แนบมา" className="max-w-[640px]">
        <img src={url} alt={`สลิป ${fileName}`} className="w-full rounded-md object-contain" />
      </Dialog>
    </>
  );
}
