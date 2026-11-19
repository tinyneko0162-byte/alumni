import Link from "next/link";

/** Shown on buying pages when every event is closed. */
export function EventClosed({ name }: { name?: string }) {
  return (
    <div className="flex flex-col gap-3 px-6 pt-6 pb-10 leading-[1.6]">
      <h1 className="text-[22px] font-bold text-ink">ยังไม่เปิดขายงานถัดไป</h1>
      <p className="text-[13px] text-black">
        {name ? `${name} ปิดไปแล้ว ` : ""}เมื่อทีมงานเปิดงานใหม่ คุณเข้าสู่ระบบด้วยอีเมลเดิมแล้วซื้อบัตรได้เลย ไม่ต้องสมัครใหม่
      </p>
      <Link href="/me/ticket" className="text-[13px] font-semibold text-brand-deep hover:underline">
        ดูบัตรและประวัติงานที่ผ่านมา
      </Link>
    </div>
  );
}
