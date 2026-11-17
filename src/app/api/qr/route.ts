import QRCode from "qrcode";
import { entryPayload, walletPayload } from "@/lib/qr-payload";

/** GET /api/qr?type=entry|wallet&id=… → PNG download of that QR. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id")?.trim();
  const type = u.searchParams.get("type");
  if (!id || id.length > 60 || (type !== "entry" && type !== "wallet")) return new Response("bad request", { status: 400 });
  const png = await QRCode.toBuffer(type === "entry" ? entryPayload(id) : walletPayload(id), { margin: 3, width: 720, errorCorrectionLevel: "M" });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="${type}-${id}.png"`, "Cache-Control": "no-store" },
  });
}
