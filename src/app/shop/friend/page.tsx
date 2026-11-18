import { requireUser } from "@/lib/data";
import { MobileShell } from "@/components/user/MobileShell";
import { CheckoutHeader } from "@/components/user/CheckoutHeader";
import { FriendView } from "./friend-view";

/** Figma: user / เลือกซื้อบัตรและเสื้อ – กรอกข้อมูลเพื่อน (4154:2) */
export const dynamic = "force-dynamic";

export default async function FriendPage() {
  await requireUser("/shop/friend"); // buying needs an account so the order and tickets belong to someone
  return (
    <MobileShell>
      <CheckoutHeader title="บัตรและเสื้อรุ่น" step={1} backHref="/shop" />
      <FriendView />
    </MobileShell>
  );
}
