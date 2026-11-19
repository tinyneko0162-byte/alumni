import { requireUser } from "@/lib/data";
import { getEvent } from "@/lib/data";
import { MobileShell } from "@/components/user/MobileShell";
import { CheckoutHeader } from "@/components/user/CheckoutHeader";
import { PaymentView } from "./payment-view";
import { EventClosed } from "@/components/user/EventClosed";

/** Figma: user / โอนธนาคารและแนบสลิป (4069:88) */
export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  await requireUser("/checkout/payment"); // buying needs an account so the order and tickets belong to someone
  const event = await getEvent();
  return (
    <MobileShell>
      <CheckoutHeader title="ชำระเงิน" step={2} backHref="/shop" />
      {event.open ? <PaymentView event={event} /> : <EventClosed name={event.closedName} />}
    </MobileShell>
  );
}
