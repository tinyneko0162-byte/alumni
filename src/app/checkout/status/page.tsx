import { requireUser } from "@/lib/data";
import { getCurrentOrder } from "@/lib/data";
import { MobileShell } from "@/components/user/MobileShell";
import { CheckoutHeader } from "@/components/user/CheckoutHeader";
import { StatusView } from "./status-view";

/** Figma: user / ส่งหลักฐานแล้ว รอตรวจสอบ (4069:2) */
export const dynamic = "force-dynamic";

export default async function StatusPage() {
  await requireUser("/checkout/status"); // buying needs an account so the order and tickets belong to someone
  const order = await getCurrentOrder();
  return (
    <MobileShell>
      <CheckoutHeader title="สถานะคำสั่งซื้อ" step={3} backHref="/checkout/payment" />
      <StatusView uploadedAt={order.slip.uploadedAt} />
    </MobileShell>
  );
}
