"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandButton, Chip, DataTable, Field, OutlineButton, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getTokenCash } from "@/lib/admin-data";

type Data = Awaited<ReturnType<typeof getTokenCash>>;
type Wallet = Data["wallets"][number];

const fmt = (n: number) => n.toLocaleString("en-US");
const baht2 = (n: number) => `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const shortWallet = (id: string) => `W-•••-${id.slice(-4)}`;

export function CashView({ data }: { data: Data }) {
  const [wallets, setWallets] = useState<Wallet[]>(data.wallets);
  const [walletId, setWalletId] = useState<string | null>(data.wallets[0].id);
  const [cash, setCash] = useState(String(data.defaultCash));
  const [received, setReceived] = useState(true);
  const [saved, setSaved] = useState(false);
  const [recent, setRecent] = useState(data.recent);
  const [scanIdx, setScanIdx] = useState(0);

  const wallet = wallets.find((w) => w.id === walletId) ?? null;
  const amount = Math.max(0, Math.floor(Number(cash) || 0));

  const rescan = () => {
    // Mock camera: cycle through the sample wallets
    const next = (scanIdx + 1) % wallets.length;
    setScanIdx(next);
    setWalletId(wallets[next].id);
    setSaved(false);
  };

  const manual = () => {
    const id = prompt("กรอก Wallet ID (เช่น WLT-xxxx-0842)")?.trim();
    if (!id) return;
    const found = wallets.find((w) => w.id.toLowerCase() === id.toLowerCase() || w.id.endsWith(id));
    setWalletId(found?.id ?? null);
    setSaved(false);
  };

  const confirm = () => {
    if (!wallet || amount <= 0 || !received) return;
    setWallets((ws) => ws.map((w) => (w.id === wallet.id ? { ...w, balance: w.balance + amount } : w)));
    const nextNo = Math.max(...recent.map((r) => Number(r.id.slice(4)))) + 1;
    const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setRecent((r) => [{ id: `TOP-${String(nextNo).padStart(4, "0")}`, wallet: shortWallet(wallet.id), cash: amount, tokens: amount, time, status: "สำเร็จ" }, ...r]);
    setSaved(true);
    setReceived(false);
  };

  return (
    <>
      <PageHeading title="เติม Token ด้วยเงินสด" description={data.description} />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex flex-col gap-5 xl:w-[415px]">
          <Panel title="สแกน Wallet ลูกค้า" aside={<Icon name="a-camera" size={18} />}>
            <div className="flex h-[280px] flex-col items-center justify-center gap-4 rounded-xl bg-[#10182a]">
              <div className="flex items-center gap-1.5">
                <Icon name="a-camera-dot" size={5} />
                <p className="text-[11px] leading-[1.55] text-[#c5cde0]">กล้องพร้อม • สแกน Wallet QR</p>
              </div>
              <div className="relative flex h-[150px] w-[172px] items-center justify-center rounded-[14px] border-2 border-[#a7a0f9]">
                <Icon name="a-scan-qr-code" size={58} />
                <span className="absolute top-[86px] left-2.5 h-0.5 w-[148px] animate-pulse bg-[#b1a9ff]" />
              </div>
              <p className="text-[11px] leading-[1.55] text-[#c5cde0]">วาง QR ของลูกค้าให้อยู่ในกรอบ</p>
            </div>
            <div className="flex gap-2.5">
              <OutlineButton icon="a-refresh-cw" className="flex-1" onClick={rescan}>
                สแกนใหม่
              </OutlineButton>
              <OutlineButton icon="a-keyboard" onClick={manual}>
                กรอก Wallet ID
              </OutlineButton>
            </div>
          </Panel>
          {wallet ? (
            <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
              <Icon name="a-circle-check" size={18} />
              <p className="flex-1 text-[12px] leading-[1.55] text-admin-ok">พบ Wallet แล้ว • ตรวจชื่อและรหัสกับลูกค้าก่อนรับเงิน</p>
            </div>
          ) : (
            <div className="rounded-lg bg-[#fdecee] p-3 text-[12px] leading-[1.55] text-[#c2414b]">ไม่พบ Wallet นี้ • ลองสแกนใหม่หรือตรวจรหัสอีกครั้ง</div>
          )}
        </div>

        <Panel title="เตรียมเติม Token" aside={saved ? <Chip tone="ok">บันทึกแล้ว</Chip> : <Chip tone="warn">ยังไม่บันทึก</Chip>} className="flex-1">
          {wallet && (
            <>
              <div className="flex items-center gap-[13px] rounded-lg bg-brand-soft p-[15px]">
                <span className="flex size-10 items-center justify-center rounded-[10px] bg-white">
                  <Icon name="a-wallet" size={20} />
                </span>
                <div className="flex flex-1 flex-col gap-0.5 leading-[1.55]">
                  <p className="text-[15px] font-semibold text-admin-ink">{wallet.owner}</p>
                  <p className="text-[12px] text-black">{wallet.id}</p>
                </div>
                <Chip tone="ok">{wallet.status}</Chip>
              </div>
              <div className="flex items-center justify-between leading-[1.55]">
                <p className="text-[12px] text-admin-muted">ยอดคงเหลือปัจจุบัน</p>
                <p className="text-[13px] font-medium text-admin-ink">{fmt(wallet.balance)} Token</p>
              </div>
            </>
          )}
          <div className="h-px bg-admin-line" />
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field
              label="เงินสดที่รับ (บาท) *"
              inputMode="decimal"
              value={cash}
              onChange={(e) => {
                setCash(e.target.value);
                setSaved(false);
              }}
            />
            <Field label="จำนวนที่เติม (Token) *" value={String(amount)} readOnly />
          </div>
          <p className="text-[11px] leading-[1.55] text-admin-muted">
            {data.rateNote} • ฿{fmt(amount)} = {fmt(amount)} Token
          </p>
          <div className="flex items-center justify-between rounded-lg bg-admin-head p-4 leading-[1.55]">
            <div className="flex flex-col gap-1 text-admin-muted">
              <p className="text-[12px]">ยอดหลังเติม</p>
              <p className="text-[11px]">
                {fmt(wallet?.balance ?? 0)} + {fmt(amount)} Token
              </p>
            </div>
            <p className="font-latin text-[28px] font-semibold text-black">{fmt((wallet?.balance ?? 0) + (saved ? 0 : amount))} Token</p>
          </div>
          <label className="flex cursor-pointer items-center gap-[9px]">
            <input type="checkbox" className="sr-only" checked={received} onChange={(e) => setReceived(e.target.checked)} />
            {received ? <Icon name="a-square-check" size={19} /> : <span className="size-[19px] rounded-[4px] border-2 border-admin-side-muted" />}
            <span className="text-[12px] leading-[1.55] text-admin-ink">ได้รับเงินสด {baht2(amount)} ครบถ้วนแล้ว</span>
          </label>
          <BrandButton icon="a-plus-white" onClick={confirm} disabled={!wallet || amount <= 0 || !received} className="w-full">
            ยืนยันเติม
          </BrandButton>
          <p className="text-[11px] leading-[1.55] text-admin-muted">บันทึกเงินสดและเพิ่ม Token เพียงครั้งเดียวหลังยืนยัน</p>
        </Panel>
      </div>

      <Panel
        title="เติมเงินสดล่าสุดที่จุดนี้"
        aside={
          <Link href="/admin/token/history" className="text-[12px] text-admin-indigo hover:underline">
            ประวัติทั้งหมด →
          </Link>
        }
      >
        <DataTable
          rows={recent}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "รายการ", width: 149, strong: true, render: (r) => r.id },
            { key: "w", header: "Wallet", render: (r) => r.wallet },
            { key: "c", header: "เงินสด (บาท)", render: (r) => baht2(r.cash) },
            { key: "t", header: "เติม (Token)", render: (r) => `+${fmt(r.tokens)}` },
            { key: "time", header: "เวลา", width: 104, render: (r) => r.time },
            { key: "s", header: "สถานะ", width: 129, render: (r) => <Chip tone="ok">{r.status}</Chip> },
          ]}
        />
      </Panel>
    </>
  );
}
