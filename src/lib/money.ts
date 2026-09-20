/**
 * All money in this app is stored and calculated as an integer number of
 * paise (1 INR = 100 paise) to avoid floating-point rounding bugs. These
 * helpers are the ONLY place formatting/rounding happens.
 */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatPaise(paise: number, currency: string = "INR"): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

/** Effective unit price for a product: sale price if set and valid, else price. */
export function effectivePrice(price: number, salePrice: number | null | undefined): number {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

export function discountPercent(price: number, salePrice: number | null | undefined): number {
  const eff = effectivePrice(price, salePrice);
  if (eff >= price || price <= 0) return 0;
  return Math.round(((price - eff) / price) * 100);
}

/**
 * COD advance calculation — the single source of truth used both when an
 * order is created and anywhere the UI needs to preview it. Always derives
 * from server-trusted `total` and `percent`, never from client input.
 */
export function calculateCodAdvance(totalPaise: number, percent: number) {
  const advance = Math.round((totalPaise * percent) / 100);
  const remaining = totalPaise - advance;
  return { advanceAmount: advance, remainingAmount: remaining };
}
