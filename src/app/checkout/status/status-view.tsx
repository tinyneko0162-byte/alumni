"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { OrderSummary } from "@/components/user/OrderSummary";
import { summarize, useCart } from "@/lib/cart";

export function StatusView({ uploadedAt }: { uploadedAt: string }) {
  const { cart } = useCart();
  const { items, total, note } = summarize(cart);

  return (
    <div className="flex flex-col gap-[22px] px-6 pt-[22px] pb-6">
      <div className="flex flex-col items-center gap-[13px] pt-[9px] pb-0.5">
        <div className="relative flex size-[110px] items-center justify-center rounded-full bg-success-tint">
          <div className="flex h-[72px] w-[59px] -rotate-8 items-center justify-center rounded-xl border border-[#d2ebdd] bg-white">
            <Icon name="file-check-2" size={38} />
          </div>
          <span className="absolute top-[68px] left-[75px] flex size-[34px] items-center justify-center rounded-[17px] bg-brand">
            <Icon name="clock-3-white" size={20} />
          </span>
        </div>
        <div className="flex flex-col items-center gap-[7px] text-center">
          <h2 className="text-[26px] font-bold text-ink">ส่งหลักฐานเรียบร้อยแล้ว</h2>
          <p className="text-[12px] leading-[1.7] text-black">
            เราได้รับสลิปของคุณแล้วทีมงานกำลังรอตรวจสอบข้อมูลการโอน
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-warning-tint px-[13px] py-[7px]">
          <Icon name="clock-3-amber" size={15} />
          <span className="text-[12px] font-semibold text-warning-ink">รอตรวจสอบหลักฐาน</span>
        </span>
      </div>

      <OrderSummary orderId={cart.orderId} items={items} note={note} total={total} />

      {cart.slip && (
        <section className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-white p-4">
          <p className="text-[14px] font-semibold text-ink">หลักฐานที่ส่ง</p>
          <div className="flex items-center gap-2.5">
            <Icon name="file-image-pink" size={25} />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <p className="truncate font-latin text-[11px] text-ink">{cart.slip.fileName}</p>
              <p className="text-[10px] text-black">
                {uploadedAt} • {cart.slip.sizeLabel}
              </p>
            </div>
            <Icon name="paperclip" size={17} />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3.5">
        <p className="text-[15px] text-ink">ขั้นตอนต่อไป</p>
        <div className="flex items-start gap-3">
          <span className="flex size-[30px] items-center justify-center rounded-[15px] bg-brand-tint">
            <Icon name="scan-line" size={16} />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-[12px] font-semibold text-ink">ทีมงานตรวจสอบยอดโอนและสลิป</p>
            <p className="text-[11px] leading-[1.7] text-black">เราจะแจ้งผลทางอีเมลที่คุณลงทะเบียน</p>
          </div>
        </div>
      </section>

      <Link href="/me/ticket" className="text-center text-[12px] text-brand-deep underline-offset-2 hover:underline">
        ไปที่บัตรของฉัน (ตัวอย่างหลังอนุมัติ)
      </Link>
    </div>
  );
}
