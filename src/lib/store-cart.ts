"use client";

import { useCallback, useEffect, useState } from "react";

/** POS cart for the Store Operator: quantity of each store's product, kept per store in sessionStorage (mock),
 *  so switching stores or going back and forth never loses another store's cart. */
const KEY = "alumni-pos-carts";

function readAll(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function usePosCart(storeId: string) {
  const [qty, setQtyState] = useState(0);

  useEffect(() => {
    setQtyState(Math.max(0, Math.min(99, Number(readAll()[storeId]) || 0)));
  }, [storeId]);

  const setQty = useCallback(
    (next: number) => {
      const value = Math.max(0, Math.min(99, next));
      setQtyState(value);
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ ...readAll(), [storeId]: value }));
      } catch {
        /* ignore */
      }
    },
    [storeId],
  );

  return { qty, setQty };
}
