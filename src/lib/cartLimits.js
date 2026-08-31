/** Max copies of one product line (same image + material + size). */
export const MAX_LINE_QUANTITY = 50;

/** Max total items (sum of quantities) in one checkout. */
export const MAX_ORDER_TOTAL_QUANTITY = 50;

export function clampLineQuantity(quantity) {
  const n = Math.max(1, Math.floor(Number(quantity) || 1));
  return Math.min(MAX_LINE_QUANTITY, n);
}

export function sumCartQuantities(cartItems) {
  return (cartItems || []).reduce(
    (sum, item) => sum + clampLineQuantity(item.quantity),
    0
  );
}

/**
 * @param {Array<{ quantity?: number }>} cartItems
 * @returns {{ ok: true, total: number } | { ok: false, error: string }}
 */
export function validateOrderQuantities(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { ok: false, error: "Cart is empty." };
  }

  let total = 0;
  for (const item of cartItems) {
    const qty = clampLineQuantity(item.quantity);
    if (qty > MAX_LINE_QUANTITY) {
      return {
        ok: false,
        error: `Maximum ${MAX_LINE_QUANTITY} copies per product line.`,
      };
    }
    total += qty;
  }

  if (total > MAX_ORDER_TOTAL_QUANTITY) {
    return {
      ok: false,
      error: `Maximum ${MAX_ORDER_TOTAL_QUANTITY} items per order (you have ${total}).`,
    };
  }

  return { ok: true, total };
}
