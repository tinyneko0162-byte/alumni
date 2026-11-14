import { getEvent, getProducts } from "@/lib/data";
import { MobileShell } from "@/components/user/MobileShell";
import { CheckoutHeader } from "@/components/user/CheckoutHeader";
import { ShopView } from "./shop-view";

/** Figma: user / เลือกซื้อบัตรและเสื้อ (4069:179) */
export default async function ShopPage() {
  const [event, products] = await Promise.all([getEvent(), getProducts()]);
  return (
    <MobileShell>
      <CheckoutHeader title="บัตรและเสื้อรุ่น" step={1} backHref="/" />
      <ShopView eventName={event.name} products={products} />
    </MobileShell>
  );
}
