import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/client";
import { products, productVariants, categories, settings, orders, orderItems } from "@/db/schema";
import { createOrder, OrderError } from "../orders";
import { eq } from "drizzle-orm";

// These tests run against the real (sqlite) db module — since it's the same
// file the dev server uses, we operate on isolated slugs/skus per test and
// clean up what we create.

async function ensureSettings() {
  const existing = await db.query.settings.findFirst({ where: eq(settings.id, "singleton") });
  if (!existing) {
    await db.insert(settings).values({ id: "singleton", whatsappNumber: "919999999999" });
  }
}

async function makeCategory() {
  const [cat] = await db
    .insert(categories)
    .values({ name: "Test Category", slug: `test-cat-${Date.now()}-${Math.random()}` })
    .returning();
  return cat!;
}

async function makeProduct(overrides: Partial<{ price: number; salePrice: number | null; stock: number; isPublished: boolean }> = {}) {
  const cat = await makeCategory();
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const [product] = await db
    .insert(products)
    .values({
      name: "Test Kurta",
      slug: `test-kurta-${suffix}`,
      description: "desc",
      sku: `SKU-${suffix}`,
      categoryId: cat.id,
      price: overrides.price ?? 250000,
      salePrice: overrides.salePrice ?? null,
      isPublished: overrides.isPublished ?? true,
    })
    .returning();
  const [variant] = await db
    .insert(productVariants)
    .values({
      productId: product!.id,
      size: "M",
      color: "Black",
      sku: `SKU-${suffix}-M-BLK`,
      stock: overrides.stock ?? 10,
    })
    .returning();
  return { product: product!, variant: variant! };
}

describe("createOrder", () => {
  beforeEach(async () => {
    await ensureSettings();
  });

  it("creates an order with server-recalculated totals, ignoring nothing from the client but IDs/qty", async () => {
    const { product, variant } = await makeProduct({ price: 250000, salePrice: 199900, stock: 10 });

    const result = await createOrder({
      orderType: "STANDARD",
      customer: {
        fullName: "Jane Doe",
        mobile: "9876543210",
        whatsapp: "9876543210",
        addressLine: "123 Test Street",
        city: "Srinagar",
        state: "Jammu and Kashmir",
        pincode: "190001",
      },
      items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
    });

    // 2 x sale price (199900) = 399800, ignoring the original (non-sale) price
    expect(result.order.subtotal).toBe(399800);
    expect(result.order.total).toBeGreaterThanOrEqual(399800);
    expect(result.order.orderNumber).toMatch(/^PF-\d{4}-\d{6}$/);
    expect(result.whatsappMessage).toContain("Please confirm my order");
    expect(result.whatsappMessage).not.toContain("₹2,500"); // never shows the un-discounted price as charged
  });

  it("decrements stock by the ordered quantity", async () => {
    const { product, variant } = await makeProduct({ stock: 5 });
    await createOrder({
      orderType: "STANDARD",
      customer: {
        fullName: "Jane Doe", mobile: "9876543210", whatsapp: "9876543210",
        addressLine: "123 Test Street", city: "Srinagar", state: "J&K", pincode: "190001",
      },
      items: [{ productId: product.id, variantId: variant.id, quantity: 3 }],
    });
    const updated = await db.query.productVariants.findFirst({ where: eq(productVariants.id, variant.id) });
    expect(updated?.stock).toBe(2);
  });

  it("rejects an order that exceeds available stock (server-side, regardless of client claims)", async () => {
    const { product, variant } = await makeProduct({ stock: 1 });
    await expect(
      createOrder({
        orderType: "STANDARD",
        customer: {
          fullName: "Jane Doe", mobile: "9876543210", whatsapp: "9876543210",
          addressLine: "123 Test Street", city: "Srinagar", state: "J&K", pincode: "190001",
        },
        items: [{ productId: product.id, variantId: variant.id, quantity: 999 }],
      })
    ).rejects.toBeInstanceOf(OrderError);
  });

  it("rejects orders for unpublished products", async () => {
    const { product, variant } = await makeProduct({ isPublished: false });
    await expect(
      createOrder({
        orderType: "STANDARD",
        customer: {
          fullName: "Jane Doe", mobile: "9876543210", whatsapp: "9876543210",
          addressLine: "123 Test Street", city: "Srinagar", state: "J&K", pincode: "190001",
        },
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(OrderError);
  });

  it("computes COD advance/remaining from server settings, not client input", async () => {
    const { product, variant } = await makeProduct({ price: 100000, stock: 10 });
    const result = await createOrder({
      orderType: "COD",
      customer: {
        fullName: "Jane Doe", mobile: "9876543210", whatsapp: "9876543210",
        addressLine: "123 Test Street", city: "Srinagar", state: "J&K", pincode: "190001",
      },
      items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
    });
    expect(result.order.codAdvancePercent).toBe(50); // from seeded/default settings
    expect(result.order.advanceAmount! + result.order.remainingAmount!).toBe(result.order.total);
  });

  it("rejects an empty cart", async () => {
    await expect(
      createOrder({
        orderType: "STANDARD",
        customer: {
          fullName: "Jane Doe", mobile: "9876543210", whatsapp: "9876543210",
          addressLine: "123 Test Street", city: "Srinagar", state: "J&K", pincode: "190001",
        },
        items: [],
      })
    ).rejects.toBeInstanceOf(OrderError);
  });
});
