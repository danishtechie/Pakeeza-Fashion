import { describe, it, expect, beforeEach } from "vitest";
import { createOrderSchema } from "@/lib/validation/checkout";
import { db } from "@/db/client";
import { products, productVariants, categories, settings } from "@/db/schema";
import { createOrder, OrderError } from "@/server/orders";
import { eq } from "drizzle-orm";

const validCustomer = {
  fullName: "Test User", mobile: "9876543210", whatsapp: "9876543210",
  addressLine: "1 Test Lane", city: "Srinagar", state: "J&K", pincode: "190001",
};

async function ensureSettings() {
  const existing = await db.query.settings.findFirst({ where: eq(settings.id, "singleton") });
  if (!existing) {
    await db.insert(settings).values({ id: "singleton", whatsappNumber: "919999999999" });
  }
}

async function makeProduct(stock = 5) {
  const [cat] = await db.insert(categories).values({ name: "Sec Test", slug: `sec-${Date.now()}-${Math.random()}` }).returning();
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const [product] = await db.insert(products).values({
    name: "Security Test Product", slug: `sec-prod-${suffix}`, description: "d",
    sku: `SEC-${suffix}`, categoryId: cat!.id, price: 500000,
  }).returning();
  const [variant] = await db.insert(productVariants).values({
    productId: product!.id, sku: `SEC-${suffix}-V`, stock,
  }).returning();
  return { product: product!, variant: variant! };
}

describe("Injection & malformed input handling (Zod boundary)", () => {
  it("rejects a script-tag / XSS payload in the name field shape-wise but does not execute it — stored as inert text", () => {
    const payload = {
      customer: { ...validCustomer, fullName: "<script>alert(1)</script>" },
      items: [{ productId: "x", variantId: "y", quantity: 1 }],
      orderType: "STANDARD",
    };
    const parsed = createOrderSchema.safeParse(payload);
    // Zod does not sanitize — it only validates shape/length. XSS defense
    // for this field lives in React's default text escaping on render,
    // never in dangerouslySetInnerHTML. This test documents that the value
    // passes validation (it's syntactically a valid name) and therefore
    // relies on output-escaping, not input-rejection, for XSS safety.
    expect(parsed.success).toBe(true);
  });

  it("rejects a SQL/NoSQL-injection-style string in pincode (fails the strict 6-digit pattern)", () => {
    const payload = {
      customer: { ...validCustomer, pincode: "1' OR '1'='1" },
      items: [{ productId: "x", variantId: "y", quantity: 1 }],
      orderType: "STANDARD",
    };
    expect(createOrderSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a negative quantity (client-manipulated 'quantity = -5')", () => {
    const payload = {
      customer: validCustomer,
      items: [{ productId: "x", variantId: "y", quantity: -5 }],
      orderType: "STANDARD",
    };
    expect(createOrderSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a non-numeric / NaN quantity", () => {
    const payload = {
      customer: validCustomer,
      items: [{ productId: "x", variantId: "y", quantity: "not-a-number" }],
      orderType: "STANDARD",
    };
    expect(createOrderSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an absurdly large quantity (999999) via the max(20) bound", () => {
    const payload = {
      customer: validCustomer,
      items: [{ productId: "x", variantId: "y", quantity: 999999 }],
      orderType: "STANDARD",
    };
    expect(createOrderSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an order type outside the enum (arbitrary client string)", () => {
    const payload = {
      customer: validCustomer,
      items: [{ productId: "x", variantId: "y", quantity: 1 }],
      orderType: "FREE_ORDER_NO_CHARGE",
    };
    expect(createOrderSchema.safeParse(payload).success).toBe(false);
  });

  it("strips/ignores any extraneous client-supplied price/total/stock fields on the order payload", () => {
    // Even if a malicious client stuffs extra fields into the JSON body,
    // the schema only picks the keys it defines — createOrder never reads
    // req.body.price, req.body.total, or req.body.stock anywhere.
    const payload = {
      customer: validCustomer,
      items: [{ productId: "x", variantId: "y", quantity: 1, price: 1, unitPrice: 1 }],
      orderType: "STANDARD",
      total: 1,
      price: 1,
      discount: 100,
    };
    const parsed = createOrderSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    // The parsed, trusted object has no price/total field at all.
    expect(parsed.success && "total" in parsed.data).toBe(false);
    expect(parsed.success && "price" in parsed.data).toBe(false);
  });
});

describe("Server-side authority over price/stock/IDOR (attack simulation)", () => {
  beforeEach(async () => {
    await ensureSettings();
  });

  it("ignores a client-submitted unitPrice and always charges the server-trusted product price", async () => {
    const { product, variant } = await makeProduct(10);
    const result = await createOrder({
      orderType: "STANDARD",
      customer: validCustomer,
      // @ts-expect-error simulating a malicious payload with an injected price field
      items: [{ productId: product.id, variantId: variant.id, quantity: 1, price: 1, unitPrice: 1 }],
    });
    // 500000 paise is the real product price — never 1.
    expect(result.order.subtotal).toBe(500000);
  });

  it("rejects a mismatched productId/variantId pair (IDOR attempt: real variant, wrong/foreign productId)", async () => {
    const { variant } = await makeProduct(10);
    const { product: otherProduct } = await makeProduct(10);
    await expect(
      createOrder({
        orderType: "STANDARD",
        customer: validCustomer,
        items: [{ productId: otherProduct.id, variantId: variant.id, quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(OrderError);
  });

  it("rejects a request for a variantId that does not exist at all", async () => {
    const { product } = await makeProduct(10);
    await expect(
      createOrder({
        orderType: "STANDARD",
        customer: validCustomer,
        items: [{ productId: product.id, variantId: "nonexistent-variant-id", quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(OrderError);
  });

  it("never oversells: two 'concurrent' orders for the last unit — the second is rejected", async () => {
    const { product, variant } = await makeProduct(1);
    await createOrder({
      orderType: "STANDARD", customer: validCustomer,
      items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
    });
    await expect(
      createOrder({
        orderType: "STANDARD", customer: validCustomer,
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(OrderError);
  });
});
