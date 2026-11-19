"use client";

import { useCallback, useEffect, useState } from "react";
import products from "@/data/products.json";
import type { SummaryItem } from "@/components/user/OrderSummary";

export type Delivery = "pickup" | "delivery";
export type Address = {
  name: string;
  phone: string;
  line: string;
  subdistrict: string;
  district: string;
  province: string;
  zip: string;
};

export type Friend = { name: string; email: string; phone: string };

/**
 * Everything on the shop page. Nothing is picked for the buyer except their own ticket:
 * shirts and friend tickets start at 0 and only open their details when added.
 */
export type Cart = {
  orderId: string;
  /** buyer's own entry ticket (tick box) */
  self: boolean;
  /** one entry per shirt, each with its own size */
  shirts: { size: string }[];
  delivery: Delivery;
  address: Address | null;
  /** one entry per ticket bought for a friend */
  friends: Friend[];
  slip: { fileName: string; sizeLabel: string; dataUrl?: string } | null;
};

const KEY = "alumni-cart-v2";

const initialCart: Cart = { orderId: "", self: true, shirts: [], delivery: "pickup", address: null, friends: [], slip: null };

export const emptyAddress: Address = { name: "", phone: "", line: "", subdistrict: "", district: "", province: "", zip: "" };
export const emptyFriend: Friend = { name: "", email: "", phone: "" };

export const ticketCount = (c: Cart) => (c.self ? 1 : 0) + c.friends.length;
/** Shirts can be picked up only by a buyer who comes to the event (has their own ticket). */
export const deliveryOf = (c: Cart): Delivery => (c.self ? c.delivery : "delivery");

// ---------- checks used before going to payment ----------

const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
export const addressErrors = (a: Address | null) => {
  const x = a ?? emptyAddress;
  return {
    name: x.name.trim() ? "" : "กรอกชื่อผู้รับ",
    phone: x.phone.replace(/\D/g, "").length >= 9 ? "" : "เบอร์โทร 9–10 หลัก",
    line: x.line.trim() ? "" : "กรอกบ้านเลขที่ / ถนน",
    subdistrict: x.subdistrict.trim() ? "" : "กรอกตำบล / แขวง",
    district: x.district.trim() ? "" : "กรอกอำเภอ / เขต",
    province: x.province.trim() ? "" : "กรอกจังหวัด",
    zip: /^\d{5}$/.test(x.zip) ? "" : "รหัสไปรษณีย์ 5 หลัก",
  };
};
export const friendErrors = (f: Friend) => ({ name: f.name.trim() ? "" : "กรอกชื่อเพื่อน", email: emailOk(f.email) ? "" : "อีเมลไม่ถูกต้อง" });

/** First problem that stops the order, or null when it can go to payment. */
export function cartProblem(c: Cart): string | null {
  if (ticketCount(c) === 0 && c.shirts.length === 0) return "เลือกบัตรหรือเสื้ออย่างน้อย 1 รายการ";
  if (c.friends.some((f) => Object.values(friendErrors(f)).some(Boolean))) return "กรอกชื่อและอีเมลของเพื่อนให้ครบทุกคน";
  if (c.shirts.length && deliveryOf(c) === "delivery" && Object.values(addressErrors(c.address)).some(Boolean)) return "กรอกที่อยู่จัดส่งเสื้อให้ครบ";
  return null;
}

/** Line items + total for the order summary card. */
export function summarize(c: Cart): { items: SummaryItem[]; total: number; note?: string } {
  const items: SummaryItem[] = [];
  if (c.self) items.push({ label: products.ticket.name, qty: 1, amount: products.ticket.price });
  if (c.friends.length) items.push({ label: "บัตรเข้างานของเพื่อน", qty: c.friends.length, amount: c.friends.length * products.ticket.price });
  const bySize = new Map<string, number>();
  c.shirts.forEach((s) => bySize.set(s.size, (bySize.get(s.size) ?? 0) + 1));
  for (const size of products.shirt.sizes) {
    const qty = bySize.get(size);
    if (qty) items.push({ label: `${products.shirt.name}, ${size}`, qty, amount: qty * products.shirt.price });
  }
  const total = items.reduce((s, i) => s + i.amount, 0);
  const note = c.shirts.length ? products.shirt.deliveryOptions.find((d) => d.id === deliveryOf(c))?.label : undefined;
  return { items, total, note };
}

/**
 * Cart kept in sessionStorage so it carries across the checkout steps.
 * Replace with an API call once the backend exists.
 */
export function useCart() {
  const [cart, setCart] = useState<Cart>(initialCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setCart({ ...initialCart, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: keep defaults */
    }
    setReady(true);
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

  return { cart, update, ready };
}
