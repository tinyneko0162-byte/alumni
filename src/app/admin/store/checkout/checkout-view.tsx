"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip, DataTable, OutlineButton, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { QrScanner } from "@/components/ui/QrScanner";
import { lookupWallet, payPos } from "@/lib/actions";
import { parseQr } from "@/lib/qr-payload";
import type { getStorePos } from "@/lib/admin-data";
import { usePosCart } from "@/lib/store-cart";

type Data = Awaited<ReturnType<typeof getStorePos>>;

export function CheckoutView({ store, recent: initialRecent }: { store: Data["stores"][number]; recent: Data["recent"] }) {
  const { qty, setQty } = usePosCart(store.id);
  const [wallet, setWallet] = useState<{ id: string; owner: string; balance: number; status: string } | null>(null);
  const scanned = wallet !== null;
  const [scanMsg, setScanMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [paid, setPaid] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState(initialRecent);
  const p = store.product;
  const total = qty * p.price;
  const balance = wallet?.balance ?? 0;
  const enough = balance >= total;
  const onSale = p.status === "ขายอยู่" && p.stock >= qty;

  const onScan = async (text: string) => {
    const qr = parseQr(text);
    if (qr?.kind === "entry") return setScanMsg({ ok: false, text: "นี่คือ QR บัตรเข้างาน ไม่ใช่ QR กระเป๋า Token" });
    if (qr?.kind !== "wallet") return setScanMsg({ ok: false, text: "ไม่ใช่ QR กระเป๋า Token" });
    const res = await lookupWallet(qr.id);
    if (!res.ok) return setScanMsg({ ok: false, text: res.error });
    setWallet(res.wallet);
    setPaid(null);
    setPayError(null);
    setScanMsg({ ok: true, text: `สแกนสำเร็จ, ${res.wallet.owner}` });
  };

  const pay = async () => {
    if (!wallet || qty === 0 || !enough || !onSale || busy) return;
    setBusy(true);
    setPayError(null);
    const res = await payPos({ storeId: store.id, walletId: wallet.id, qty });
    setBusy(false);
    if (!res.ok) return setPayError(res.error);
    const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setRecent((r) => [{ id: res.saleId, wallet: `W-•••-${wallet.id.slice(-4)}`, amount: res.total, time, status: "สำเร็จ" }, ...r]);
    setWallet({ ...wallet, balance: res.balance });
    setPaid(res.saleId);
    setQty(0);
  };

  return (
    <>
      <PageHeading title="ชำระเงินค่าสินค้า" description="สแกน Wallet ลูกค้า" />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex flex-col gap-5 xl:w-[611px]">
          <Panel title="สแกน Wallet ลูกค้า" aside={<Icon name="a-camera" size={18} />}>
            <QrScanner onScan={onScan} className="h-[280px]" />
            {scanMsg && (
              <p role="status" className={scanMsg.ok ? "text-[12px] text-admin-ok" : "text-[12px] text-[#c2414b]"}>
                {scanMsg.text}
              </p>
            )}
            <div className="flex gap-2.5">
              <OutlineButton icon="a-refresh-cw" className="flex-1" onClick={() => { setWallet(null); setScanMsg(null); setPaid(null); }}>
                สแกนใหม่
              </OutlineButton>
              <OutlineButton icon="a-keyboard" onClick={() => { const id = prompt("กรอก Wallet ID")?.trim(); if (id) onScan(`ALUMNI-WALLET:${id}`); }}>
                กรอก Wallet ID
              </OutlineButton>
            </div>
          </Panel>

          <Panel
            title="รายการล่าสุด"
            aside={
              <Link href={`/admin/store/history?store=${store.id}`} className="text-[12px] text-admin-indigo hover:underline">
                ประวัติทั้งหมด
              </Link>
            }
          >
            <DataTable
              rows={recent}
              rowKey={(r) => r.id}
              columns={[
                { key: "id", header: "รายการ", width: 149, strong: true, render: (r) => r.id },
                { key: "w", header: "Wallet", render: (r) => r.wallet },
                { key: "a", header: "ชำระเงิน (Token)", render: (r) => r.amount },
                { key: "t", header: "เวลา", width: 104, render: (r) => r.time },
                { key: "s", header: "สถานะ", width: 129, render: (r) => <Chip tone="ok">{r.status}</Chip> },
              ]}
            />
          </Panel>
        </div>

        <Panel
          title="เตรียมชำระเงิน"
          aside={paid ? <Chip tone="ok">บันทึกแล้ว</Chip> : <Chip tone="warn">ยังไม่บันทึก</Chip>}
          className="min-h-[640px] flex-1 [&_h2]:text-[16px]"
        >
          {wallet ? (
            <div className="flex items-center gap-[13px] rounded-lg bg-brand-tint p-[15px]">
              <span className="flex size-10 items-center justify-center rounded-[10px] bg-white">
                <Icon name="a-wallet" size={20} />
              </span>
              <div className="flex flex-1 flex-col leading-[1.55]">
                <p className="text-[16px] font-semibold text-admin-ink">{wallet.owner}</p>
                <p className="text-[16px] text-brand">{wallet.id}</p>
              </div>
              <Chip tone="ok">{wallet.status}</Chip>
            </div>
          ) : (
            <p className="rounded-lg bg-admin-head p-4 text-[13px] text-admin-muted">ยังไม่ได้สแกน Wallet</p>
          )}

          <div className="flex flex-col gap-3 px-0 sm:px-6">
            {qty > 0 ? (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-[3px] text-[20px] leading-[1.55]">
                    <p className="font-medium text-admin-ink">{p.name}</p>
                    <p className="text-admin-muted">
                      {p.price} Token / {p.unit}
                    </p>
                  </div>
                  <button type="button" aria-label="ลบสินค้า" onClick={() => setQty(0)}>
                    <Icon name="a-trash-2" size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex overflow-hidden rounded-lg border border-admin-line">
                    <button type="button" aria-label="ลด" onClick={() => setQty(qty - 1)} className="flex size-9 items-center justify-center hover:bg-admin-head">
                      <Icon name="a-minus" size={15} />
                    </button>
                    <span className="flex h-9 w-11 items-center justify-center bg-admin-head text-[20px] font-semibold text-admin-ink">{qty}</span>
                    <button type="button" aria-label="เพิ่ม" onClick={() => setQty(qty + 1)} className="flex size-9 items-center justify-center hover:bg-admin-head">
                      <Icon name="a-plus" size={15} />
                    </button>
                  </div>
                  <p className="text-[20px] font-semibold leading-[1.55] text-admin-ink">{total} Token</p>
                </div>
                <div className="h-px bg-admin-line" />
              </>
            ) : paid ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
                <Icon name="a-circle-check" size={18} />
                <p className="flex-1 text-[12px] leading-[1.55] text-admin-ok">
                  ชำระสำเร็จ, {paid}, ยอดคงเหลือ Wallet {balance.toLocaleString("en-US")} Token
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-admin-muted">ไม่มีสินค้าในตะกร้า</p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-3 sm:px-6">
            <div className="flex items-center justify-between text-[16px] leading-[1.55]">
              <p className="text-admin-muted">รวมสินค้า</p>
              <p className="font-medium text-admin-ink">{qty > 0 ? 1 : 0} รายการ</p>
            </div>
            <div className="flex items-center justify-between font-semibold leading-[1.55]">
              <p className="text-[24px] text-admin-ink">ยอดชำระ</p>
              <p className="font-latin text-[29px] text-black">{total} Token</p>
            </div>
            {scanned && qty > 0 && !enough && <p className="text-[12px] text-danger">ยอด Token ใน Wallet ไม่พอ (มี {balance.toLocaleString("en-US")} Token)</p>}
            {qty > 0 && !onSale && <p className="text-[12px] text-danger">สินค้าหยุดขายหรือเหลือไม่พอ (คงเหลือ {p.stock} {p.unit})</p>}
            {payError && <p role="alert" className="text-[12px] text-danger">{payError}</p>}
            <button
              type="button"
              onClick={pay}
              disabled={!scanned || qty === 0 || !enough || !onSale || busy}
              className="mx-auto mt-2 flex h-[72px] w-full max-w-[388px] items-center justify-center gap-2 rounded-lg bg-brand text-[20px] font-semibold leading-[1.55] text-white transition hover:brightness-95 disabled:opacity-50"
            >
              <Icon name="a-scan-line-white" size={17} />
              {scanned ? (busy ? "กำลังตัดยอด…" : "ยืนยันชำระ") : "สแกน Wallet เพื่อชำระ"}
            </button>
            {paid && (
              <Link href={`/admin/store/pos?store=${store.id}`} className="text-center text-[12px] text-admin-indigo hover:underline">
                ← กลับไปขายรายการถัดไป
              </Link>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
