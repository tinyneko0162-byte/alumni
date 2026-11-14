"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { getStorePos } from "@/lib/admin-data";
import { usePosCart } from "@/lib/store-cart";
import { StoreSwitcher } from "../StoreSwitcher";

type Store = Awaited<ReturnType<typeof getStorePos>>["stores"][number];

export function PosView({ boothName, store, stores }: { boothName: string; store: Store; stores: { id: string; name: string }[] }) {
  const { qty, setQty } = usePosCart(store.id);
  const p = store.product;
  const total = qty * p.price;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-bold leading-[1.55] text-admin-ink">{boothName}</h1>
        <StoreSwitcher current={store.id} stores={stores} />
      </div>

      <section className="flex flex-wrap items-center gap-[18px] rounded-xl border border-admin-line bg-white p-[18px]">
        <div className="relative h-[133px] w-[153px] shrink-0 overflow-hidden rounded-[3px]">
          <Image src={p.image} alt={p.name} fill sizes="153px" className="object-cover" />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1.5 leading-[1.55]">
          <p className="text-[22px] font-bold text-admin-ink">{p.name}</p>
          <p className="text-[14px] text-admin-side-muted">{p.tagline}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-0.5 leading-[1.55]">
            <p className="text-[12px] text-admin-side-muted">ราคา</p>
            <p className="text-[24px] font-bold text-black">{p.price} Token</p>
          </div>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="flex h-[72px] w-[88px] flex-col items-center justify-center rounded-[10px] bg-brand transition hover:brightness-95 active:scale-[0.98]"
          >
            <Icon name="a-plus-white-lg" size={22} />
            <span className="text-[11px] font-semibold leading-[1.4] text-white">เพิ่มลงตะกร้า</span>
          </button>
        </div>
      </section>

      <section className="mt-6 flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-admin-line bg-white">
        <div className="flex items-center justify-between border-b border-admin-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Icon name="a-shopping-basket" size={20} />
            <h2 className="text-[16px] font-bold leading-[1.55] text-admin-ink">ตะกร้าสินค้า</h2>
          </div>
          <span className="rounded-full bg-brand px-2.5 py-[3px] text-[11px] font-semibold leading-[1.4] text-white">{qty > 0 ? 1 : 0} รายการ</span>
        </div>

        {qty > 0 ? (
          <div className="flex items-center gap-4 border-b border-admin-line px-5 py-4">
            <div className="relative h-[67px] w-[77px] shrink-0 overflow-hidden rounded-[3px]">
              <Image src={p.image} alt="" fill sizes="77px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold leading-[1.55] text-admin-ink">{p.name}</p>
                <button type="button" aria-label="ลบออกจากตะกร้า" onClick={() => setQty(0)} className="rounded-md p-1 text-[16px] leading-none text-brand hover:bg-brand-tint">
                  ✕
                </button>
              </div>
              <p className="text-[13px] leading-[1.55] text-admin-side-muted">
                {p.price} Token / {p.unit}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center overflow-hidden rounded-lg border border-admin-line">
                  <button type="button" aria-label="ลด" onClick={() => setQty(qty - 1)} className="bg-admin-head px-4 py-1.5 text-[18px] font-semibold leading-none text-admin-indigo hover:bg-admin-line">
                    −
                  </button>
                  <span className="border-x border-admin-line bg-white px-[18px] py-1.5 text-[15px] font-semibold leading-none text-admin-ink">{qty}</span>
                  <button type="button" aria-label="เพิ่ม" onClick={() => setQty(qty + 1)} className="bg-admin-head px-4 py-1.5 text-[18px] font-semibold leading-none text-admin-indigo hover:bg-admin-line">
                    +
                  </button>
                </div>
                <p className="text-[16px] font-bold leading-[1.55] text-black">{total} Token</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="border-b border-admin-line px-5 py-10 text-center text-[13px] text-admin-muted">ยังไม่มีสินค้าในตะกร้า · กด “เพิ่มลงตะกร้า”</p>
        )}

        <div className="flex flex-col gap-3.5 px-5 pt-4 pb-5">
          <div className="flex items-center justify-between leading-[1.55]">
            <p className="text-[14px] text-admin-muted">รวมทั้งหมด ({qty > 0 ? 1 : 0} รายการ)</p>
            <p className="flex items-baseline gap-1 text-black">
              <span className="text-[22px] font-bold">{total}</span>
              <span className="text-[14px] font-semibold">Token</span>
            </p>
          </div>
          <Link
            href={qty > 0 ? `/admin/store/checkout?store=${store.id}` : "#"}
            aria-disabled={qty === 0}
            className={`flex h-[84px] items-center justify-center gap-2.5 rounded-[10px] bg-brand px-6 text-[24px] font-bold leading-[1.55] text-white transition hover:brightness-95 ${
              qty === 0 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            ไปหน้าชำระเงิน <span className="text-[16px]">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
