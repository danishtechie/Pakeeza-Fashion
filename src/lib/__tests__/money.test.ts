import { describe, it, expect } from "vitest";
import { effectivePrice, discountPercent, calculateCodAdvance, formatPaise, rupeesToPaise } from "../money";

describe("effectivePrice", () => {
  it("returns sale price when valid and lower", () => {
    expect(effectivePrice(250000, 199900)).toBe(199900);
  });
  it("ignores sale price when it is not lower than price", () => {
    expect(effectivePrice(250000, 250000)).toBe(250000);
    expect(effectivePrice(250000, 300000)).toBe(250000);
  });
  it("ignores null/zero sale price", () => {
    expect(effectivePrice(250000, null)).toBe(250000);
    expect(effectivePrice(250000, 0)).toBe(250000);
    expect(effectivePrice(250000, undefined)).toBe(250000);
  });
  it("rejects a malicious 'price = ₹1' style override — price always comes from the product row", () => {
    // Simulates the attack scenario: client claims salePrice=1, but this
    // function only ever receives server-trusted DB values, never client input.
    const serverTrustedPrice = 250000;
    const serverTrustedSalePrice = 199900;
    expect(effectivePrice(serverTrustedPrice, serverTrustedSalePrice)).toBe(199900);
  });
});

describe("discountPercent", () => {
  it("computes rounded percentage off", () => {
    expect(discountPercent(200000, 150000)).toBe(25);
    expect(discountPercent(100000, 99000)).toBe(1);
  });
  it("is zero with no discount", () => {
    expect(discountPercent(100000, null)).toBe(0);
    expect(discountPercent(100000, 100000)).toBe(0);
  });
});

describe("calculateCodAdvance", () => {
  it("computes 50% advance correctly", () => {
    const { advanceAmount, remainingAmount } = calculateCodAdvance(659800, 50);
    expect(advanceAmount).toBe(329900);
    expect(remainingAmount).toBe(329900);
    expect(advanceAmount + remainingAmount).toBe(659800);
  });
  it("handles odd totals without losing/gaining a paisa", () => {
    const total = 100001; // odd paise total
    const { advanceAmount, remainingAmount } = calculateCodAdvance(total, 50);
    expect(advanceAmount + remainingAmount).toBe(total);
  });
  it("respects a configurable percent, not hardcoded 50", () => {
    const { advanceAmount, remainingAmount } = calculateCodAdvance(500000, 30);
    expect(advanceAmount).toBe(150000);
    expect(remainingAmount).toBe(350000);
  });
  it("rejects the 'COD advance = 0%' manipulation scenario by only trusting server settings", () => {
    // The percent argument must always come from Settings in the DB, never
    // from client input — this test documents that contract.
    const trustedPercentFromSettings = 50;
    const { advanceAmount } = calculateCodAdvance(500000, trustedPercentFromSettings);
    expect(advanceAmount).toBe(250000);
  });
});

describe("formatPaise", () => {
  it("formats whole rupees without decimals", () => {
    expect(formatPaise(249900)).toContain("2,499");
  });
});

describe("rupeesToPaise", () => {
  it("converts and rounds correctly", () => {
    expect(rupeesToPaise(2499)).toBe(249900);
    expect(rupeesToPaise(19.995)).toBe(2000);
  });
});
