"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { orderStatus } from "@/lib/actions";
import { Icon } from "@/components/ui/Icon";
import { OrderSummary } from "@/components/user/OrderSummary";
import { summarize, useCart } from "@/lib/cart";

export function StatusView({ uploadedAt }: { uploadedAt: string }) {
  const { cart } = useCart();
  const { items, total, note } = summarize(cart);
  const [state, setState] = useState<Awaited<ReturnType<typeof orderStatus>>>({ status: "pending" });

  useEffect(() => {
    let id = "";
    try {
      id = sessionStorage.getItem("alumni-order-id") ?? "";
    } catch {
      /* no stored order */
    }
    if (!id) return;
    const poll = () => void orderStatus(id).then(setState);
    poll();
    const t = setInterval(poll, 4000); // picks up the ticketing officer's decision without reloading
    return () => clearInterval(t);
  }, []);
  const approved = state.status === "approved";
  const rejected = state.status === "rejected";
  const tickets = state.holders ?? [];
  const friendTickets = state.self === false ? tickets : tickets.slice(1);
  const shirt = state.shirt;
  const tone = approved ? "ok" : rejected ? "bad" : "wait";

  return (
    <div className="flex flex-col gap-[22px] px-6 pt-[22px] pb-6">
      <div className="flex flex-col items-center gap-[13px] pt-[9px] pb-0.5">
        <div className="relative flex size-[110px] items-center justify-center rounded-full bg-success-tint">
          <div className="flex h-[72px] w-[59px] -rotate-8 items-center justify-center rounded-xl border border-[#d2ebdd] bg-white">
            <Icon name="file-check-2" size={38} />
          </div>
          <span className={`absolute top-[68px] left-[75px] flex size-[34px] items-center justify-center rounded-[17px] ${tone === "ok" ? "bg-success" : tone === "bad" ? "bg-danger" : "bg-brand"}`}>
            {tone === "ok" ? <Icon name="check-white" size={18} /> : tone === "bad" ? <span className="text-[18px] font-bold text-white">!</span> : <Icon name="clock-3-white" size={20} />}
          </span>
        </div>
        <div className="flex flex-col items-center gap-[7px] text-center">
          <h2 className="text-[26px] font-bold text-ink">{approved ? "อนุมัติแล้ว ยินดีต้อนรับ!" : rejected ? "สลิปไม่ผ่านการตรวจสอบ" : "ส่งหลักฐานเรียบร้อยแล้ว"}</h2>
          <p className="text-[12px] leading-[1.7] text-black">
            {approved
              ? tickets.length > friendTickets.length
                ? "ทีมงานตรวจสลิปเรียบร้อยแล้ว เปิดบัตรเข้างานและ QR ของคุณได้เลย"
                : friendTickets.length
                ? "ทีมงานตรวจสลิปเรียบร้อยแล้ว ระบบส่งลิงก์บัตรให้เพื่อนทางอีเมล"
                : "ทีมงานตรวจสลิปเรียบร้อยแล้ว เราจะจัดส่งเสื้อตามที่อยู่ที่คุณกรอกไว้"
              : rejected ? "กรุณาติดต่อทีมงานหรือส่งหลักฐานใหม่อีกครั้ง" : "เราได้รับสลิปของคุณแล้วทีมงานกำลังรอตรวจสอบข้อมูลการโอน"}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-[13px] py-[7px] ${tone === "ok" ? "bg-success-tint" : tone === "bad" ? "bg-[#fdecee]" : "bg-warning-tint"}`}>
          {tone === "wait" ? <Icon name="clock-3-amber" size={15} /> : <span className={`size-2 rounded-full ${tone === "ok" ? "bg-success" : "bg-danger"}`} />}
          <span className={`text-[12px] font-semibold ${tone === "ok" ? "text-success-ink" : tone === "bad" ? "text-danger" : "text-warning-ink"}`}>{approved ? "อนุมัติแล้ว" : rejected ? "ไม่ผ่านการตรวจสอบ" : "รอตรวจสอบหลักฐาน"}</span>
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
                {state.sentAt ?? uploadedAt}, {cart.slip.sizeLabel}
              </p>
            </div>
            <Icon name="paperclip" size={17} />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3.5">
        <p className="text-[15px] text-ink">ขั้นตอนต่อไป</p>
        {(!approved
          ? [
              rejected
                ? ["ติดต่อทีมงานหรือส่งสลิปใหม่", "สลิปไม่ตรงกับยอดหรือบัญชีผู้รับ ทีมงานจะแจ้งรายละเอียดทางอีเมล"]
                : ["ทีมงานตรวจสอบยอดโอนและสลิป", "หน้านี้จะอัปเดตเองเมื่อทีมงานอนุมัติ และแจ้งผลทางอีเมลที่คุณลงทะเบียน"],
            ]
          : [
              ...(tickets.length > friendTickets.length ? [["แสดง QR ที่ประตูงาน", `บัตร ${tickets[0]?.ticketId} ของคุณ ใช้เข้างานได้ 1 ครั้ง`]] : []),
              ...(friendTickets.length ? [["เพื่อนได้รับลิงก์บัตรทางอีเมล", friendTickets.map((t) => `${t.name} (${t.email})`).join(", ")]] : []),
              ...(shirt ? [[shirt.delivery === "delivery" ? "จัดส่งเสื้อถึงบ้าน" : "รับเสื้อที่หน้างาน", shirt.status === "shipped" ? "ส่งเสื้อแล้ว" : shirt.status === "picked" ? "รับเสื้อแล้ว" : `เสื้อ ${shirt.count} ตัว ${shirt.delivery === "delivery" ? "จะส่งภายใน 14 วันหลังวันงาน" : "แสดงบัตรที่จุดรับเสื้อ"}`]] : []),
            ]
        ).map(([title, body]) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[15px] bg-brand-tint">
              <Icon name="scan-line" size={16} />
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[12px] font-semibold text-ink">{title}</p>
              <p className="text-[11px] leading-[1.7] text-black">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {approved && tickets.length > friendTickets.length ? (
        <Link href="/me/ticket" className="text-center text-[12px] font-semibold text-brand-deep underline-offset-2 hover:underline">
          เปิดบัตรของฉัน
        </Link>
      ) : (
        !approved && <p className="text-center text-[11px] text-black/60">ปุ่มเปิดบัตรจะขึ้นที่นี่เมื่อทีมงานอนุมัติ</p>
      )}
    </div>
  );
}
