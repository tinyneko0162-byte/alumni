"use client";

import { useCallback, useEffect, useState } from "react";

/** POS cart for the Store Operator: quantity of the store's product. Kept in sessionStorage (mock). */
export type PosCart = { storeId: string; qty: number };

const KEY = "alumni-pos-cart";

export function usePosCart(storeId: string) {
  const [cart, setCart] = useState<PosCart>({ storeId, qty: 0 });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PosCart;
        setCart(saved.storeId === storeId ? saved : { storeId, qty: 0 });
      } else {
        setCart({ storeId, qty: 0 });
      }
    } catch {
      setCart({ storeId, qty: 0 });
    }
  }, [storeId]);

  const setQty = useCallback(
    (qty: number) => {
      const next = { storeId, qty: Math.max(0, Math.min(99, qty)) };
      setCart(next);
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storeId],
  );

  return { qty: cart.qty, setQty };
}
