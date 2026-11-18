"use client";

import { useState } from "react";
import { BrandButton, Chip, Field, Guidance, PageHeading, Panel } from "@/components/admin/ui";
import { checkIn } from "@/lib/actions";
import { QrScanner } from "@/components/ui/QrScanner";
import { parseQr, entryPayload } from "@/lib/qr-payload";
import { cx } from "@/lib/format";

type Result = { tone: "ok" | "dup" | "bad"; title: string; detail: string };
type Entry = { id: string; name: string; time: string };

export function ScanView() {
  const [log, setLog] = useState<Entry[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [manual, setManual] = useState("");

  const handle = async (text: string) => {
    const qr = parseQr(text);
    if (!qr) return setResult({ tone: "bad", title: "ไม่ใช่ QR ของงานนี้", detail: "ลองสแกนใหม่ หรือกรอกเลขบัตรเอง" });
    if (qr.kind === "wallet") return setResult({ tone: "bad", title: "นี่คือ QR กระเป๋า Token", detail: "ใช้สแกนที่ร้านค้า ไม่ใช่บัตรเข้างาน" });
    const res = await checkIn(qr.id);
    if (!res.ok) return setResult({ tone: "bad", title: "เข้างานไม่ได้", detail: res.error });
    if (res.status === "dup") return setResult({ tone: "dup", title: "บัตรนี้เช็กอินไปแล้ว", detail: `${res.name} · ${qr.id} · เข้าเมื่อ ${res.time}` });
    setLog((l) => [{ id: qr.id, name: res.name, time: res.time }, ...l]);
    setResult({ tone: "ok", title: "เข้างานได้", detail: `${res.name} · ${qr.id}${res.shirt ? ` · ${res.shirt}` : ""}` });
  };

  const submitManual = () => {
    const id = manual.trim().toUpperCase();
    if (id) handle(entryPayload(id));
    setManual("");
  };

  return (
    <>
      <PageHeading title="สแกนบัตรเข้างาน" description="สแกน QR บัตรเข้างานเพื่อบันทึกเวลาเช็กอิน" actions={<Chip tone="ok">เช็กอินในรอบนี้ {log.length} คน</Chip>} />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel title="กล้องสแกน" className="xl:w-[520px]">
          <QrScanner onScan={handle} className="h-[340px]" />
          <div className="flex items-end gap-2">
            <Field label="กรอกเลขบัตรเอง" placeholder="เช่น TKT-0400" value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitManual()} />
            <BrandButton onClick={submitManual} disabled={!manual.trim()} className="mb-px shrink-0">
              เช็กอิน
            </BrandButton>
          </div>
          <Guidance>กล้องใช้ได้เมื่อเปิดผ่าน https หรือ localhost และต้องกดอนุญาตกล้องในเบราว์เซอร์</Guidance>
        </Panel>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Panel title="ผลการสแกนล่าสุด">
            {result ? (
              <div
                role="status"
                className={cx(
                  "flex flex-col gap-1 rounded-lg p-4 leading-[1.55]",
                  result.tone === "ok" ? "bg-admin-ok-tint text-admin-ok" : result.tone === "dup" ? "bg-warning-tint text-admin-warn" : "bg-[#fdecee] text-[#c2414b]",
                )}
              >
                <p className="text-[18px] font-semibold">{result.title}</p>
                <p className="text-[13px]">{result.detail}</p>
              </div>
            ) : (
              <p className="rounded-lg bg-admin-head p-4 text-[13px] text-admin-muted">ยังไม่มีการสแกน — จ่อ QR ให้อยู่ในกรอบ</p>
            )}
          </Panel>

          <Panel title="รายการเช็กอินวันนี้">
            {log.length === 0 && <p className="text-[12px] text-admin-muted">ยังไม่มีรายการ</p>}
            <ul className="flex flex-col divide-y divide-admin-line">
              {log.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                  <span className="flex flex-col leading-[1.55]">
                    <span className="font-medium text-admin-ink">{e.name}</span>
                    <span className="text-[11px] text-admin-muted">{e.id}</span>
                  </span>
                  <span className="text-[12px] text-admin-muted">{e.time}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
