"use client";

import { useCallback, useEffect, useState } from "react";
import products from "@/data/products.json";
import order from "@/data/order.json";
import type { SummaryItem } from "@/components/user/OrderSummary";

export type PurchaseType = "ticket" | "shirt" | "both";
export type Delivery = "pickup" | "delivery";

export type Cart = {
  orderId: string;
  purchaseType: PurchaseType;
  /** extra tickets bought for friends (buyer's own ticket is always 1) */
  friendTicketQty: number;
  shirts: { size: string }[];
  delivery: Delivery;
  slip: { fileName: string; sizeLabel: string } | null;
};

const KEY = "alumni-cart";

/** Starting cart, taken from the mock order JSON. */
const initialCart: Cart = {
  orderId: order.id,
  purchaseType: order.purchaseType as PurchaseType,
  friendTicketQty: order.friendTicketQty,
  shirts: order.shirts,
  delivery: order.delivery as Delivery,
  slip: { fileName: order.slip.fileName, sizeLabel: order.slip.sizeLabel },
};

export const includesTicket = (c: Cart) => c.purchaseType !== "shirt";
export const includesShirt = (c: Cart) => c.purchaseType !== "ticket";

/** Line items + total for the order summary card. */
export function summarize(c: Cart): { items: SummaryItem[]; total: number; note?: string } {
  const items: SummaryItem[] = [];
  if (includesTicket(c)) {
    const qty = 1 + c.friendTicketQty;
    items.push({ label: products.ticket.name, qty, amount: qty * products.ticket.price });
  }
  if (includesShirt(c)) {
    const bySize = new Map<string, number>();
    c.shirts.forEach((s) => bySize.set(s.size, (bySize.get(s.size) ?? 0) + 1));
    for (const size of products.shirt.sizes) {
      const qty = bySize.get(size);
      if (qty) items.push({ label: `${products.shirt.name} • ${size}`, qty, amount: qty * products.shirt.price });
    }
  }
  const total = items.reduce((s, i) => s + i.amount, 0);
  const note = includesShirt(c)
    ? products.shirt.deliveryOptions.find((d) => d.id === c.delivery)?.label
    : undefined;
  return { items, total, note };
}

/**
 * Cart kept in sessionStorage so it carries across the checkout steps.
 * Replace with an API call once the backend exists.
 */
export function useCart() {
  const [cart, setCart] = useState<Cart>(initialCart);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setCart({ ...initialCart, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: keep defaults */
    }
  }, []);

  const update = useCallback((patch: Partial<Cart> | ((c: Cart) => Partial<Cart>)) => {
    setCart((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { cart, update };
}
