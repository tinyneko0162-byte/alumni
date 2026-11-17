import QRCode from "qrcode";

/** Real, scannable QR code (server-rendered PNG data-URL). Always dark-on-white so scanners read it in dark mode too. */
export async function QrCode({ value, size = 218, alt }: { value: string; size?: number; alt: string }) {
  const src = await QRCode.toDataURL(value, { margin: 2, width: size * 2, errorCorrectionLevel: "M" });
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={alt} className="rounded-lg bg-white" />;
}
