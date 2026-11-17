"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";

/**
 * Opens the camera and calls onScan(text) when a QR code is read.
 * A code is reported once; it can be reported again only after it has left the frame. Needs https or localhost.
 */
export function QrScanner({ onScan, paused = false, className }: { onScan: (text: string) => void; paused?: boolean; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cb = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    cb.current = onScan;
  });

  useEffect(() => {
    if (paused) return;
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    let last = "";
    let lastSeen = 0;
    const v = video.current;
    const c = canvas.current;
    if (!v || !c) return;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (v.readyState < 2 || !v.videoWidth) return;
      const scale = Math.min(1, 640 / v.videoWidth);
      const w = Math.round(v.videoWidth * scale);
      const h = Math.round(v.videoHeight * scale);
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      const now = Date.now();
      if (!code?.data) {
        if (now - lastSeen > 1500) last = ""; // QR left the frame: allow the next scan
        return;
      }
      lastSeen = now;
      if (code.data !== last) {
        last = code.data;
        cb.current(code.data);
      }
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("เบราว์เซอร์นี้เปิดกล้องไม่ได้ (ต้องเปิดผ่าน https หรือ localhost)");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        v.srcObject = stream;
        await v.play();
        setError(null);
        setReady(true);
        tick();
      } catch (e) {
        const name = (e as DOMException).name;
        setError(
          name === "NotAllowedError"
            ? "ยังไม่ได้อนุญาตให้ใช้กล้อง กดไอคอนกุญแจข้าง URL แล้วเลือกอนุญาตกล้อง"
            : name === "NotFoundError"
              ? "ไม่พบกล้องในอุปกรณ์นี้"
              : "เปิดกล้องไม่สำเร็จ ลองรีเฟรชหน้าหรือปิดแอปอื่นที่ใช้กล้องอยู่",
        );
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      setReady(false);
    };
  }, [paused, attempt]);

  return (
    <div className={cx("relative flex items-center justify-center overflow-hidden rounded-xl bg-[#10182a]", className)}>
      <video ref={video} muted playsInline className={cx("absolute inset-0 size-full object-cover", !ready && "hidden")} />
      <canvas ref={canvas} className="hidden" />
      {ready && (
        <div className="pointer-events-none relative flex size-[60%] max-h-[220px] max-w-[220px] items-center justify-center rounded-[14px] border-2 border-[#e82c87]">
          <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-[#e82c87]" />
        </div>
      )}
      {!ready && !error && <p className="px-6 text-center text-[12px] text-[#c5cde0]">{paused ? "หยุดสแกนชั่วคราว" : "กำลังเปิดกล้อง…"}</p>}
      {error && (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <p className="text-[12px] leading-[1.55] text-[#c5cde0]">{error}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="rounded-lg border border-[#3a4066] px-4 py-2 text-[12px] font-semibold text-white hover:bg-white/10">
            ลองเปิดกล้องอีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
}
