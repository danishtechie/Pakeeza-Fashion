import { db } from "@/db/client";
import {
  products,
  productVariants,
  customers,
  orders,
  orderItems,
  orderCounters,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { effectivePrice, calculateCodAdvance } from "@/lib/money";
import { formatOrderNumber } from "@/lib/order-number";
import { buildWhatsappMessage } from "@/lib/whatsapp";
import type { CreateOrderInput } from "@/lib/validation/checkout";
import { getSettings } from "@/lib/settings";

export class OrderError extends Error {
  constructor(
    message: string,
    public code: "OUT_OF_STOCK" | "PRODUCT_UNAVAILABLE" | "EMPTY_CART" | "COD_DISABLED"
  ) {
    super(message);
  }
}

/**
 * Creates an order with every trust-sensitive value (price, stock, totals,
 * COD advance) recomputed from the database inside a single transaction —
 * the client's cart is used only for product/variant IDs and quantities.
 * This is what stands between "customer edits devtools" and a real
 * financial loss.
 */
export async function createOrder(input: CreateOrderInput) {
  if (input.items.length === 0) throw new OrderError("Your bag is empty", "EMPTY_CART");

  const settings = await getSettings();
  if (input.orderType === "COD" && !settings.codEnabled) {
    throw new OrderError("Cash on Delivery is currently unavailable", "COD_DISABLED");
  }

  const variantIds = input.items.map((i) => i.variantId);
  const productIds = [...new Set(input.items.map((i) => i.productId))];

  const result = await db.transaction(async (tx) => {
    const variantRows = await tx.select().from(productVariants).where(inArray(productVariants.id, variantIds));
    const productRows = await tx.select().from(products).where(inArray(products.id, productIds));

    const variantById = new Map(variantRows.map((v) => [v.id, v]));
    const productById = new Map(productRows.map((p) => [p.id, p]));

    let subtotal = 0;
    let discountTotal = 0;
    const preparedItems: {
      productId: string;
      variantId: string;
      nameSnapshot: string;
      sizeSnapshot: string | null;
      colorSnapshot: string | null;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const line of input.items) {
      const variant = variantById.get(line.variantId);
      const product = variant ? productById.get(variant.productId) : undefined;

      if (!variant || !product || variant.productId !== line.productId) {
        throw new OrderError(`One of the items in your bag is no longer available`, "PRODUCT_UNAVAILABLE");
      }
      if (!product.isPublished) {
        throw new OrderError(`"${product.name}" is no longer available`, "PRODUCT_UNAVAILABLE");
      }
      if (variant.stock < line.quantity) {
        throw new OrderError(
          `Only ${variant.stock} left in stock for "${product.name}"${
            variant.size ? ` (Size ${variant.size})` : ""
          }`,
          "OUT_OF_STOCK"
        );
      }

      const unitPrice = effectivePrice(product.price, product.salePrice);
      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;
      discountTotal += (product.price - unitPrice) * line.quantity;

      preparedItems.push({
        productId: product.id,
        variantId: variant.id,
        nameSnapshot: product.name,
        sizeSnapshot: variant.size,
        colorSnapshot: variant.color,
        unitPrice,
        quantity: line.quantity,
        lineTotal,
      });

      // Decrement stock now, inside the same transaction — the WHERE guard
      // (stock still equal to the value we just read) makes this safe even
      // if two requests race for the last unit: whichever commits first
      // wins the guard, the loser sees rowsAffected === 0 and aborts.
      const update = await tx
        .update(productVariants)
        .set({ stock: variant.stock - line.quantity })
        .where(and(eq(productVariants.id, variant.id), eq(productVariants.stock, variant.stock)));
      if (update.rowsAffected === 0) {
        throw new OrderError(`"${product.name}" just went out of stock — please refresh your bag`, "OUT_OF_STOCK");
      }
    }

    const deliveryFee =
      settings.freeDeliveryAbove != null && subtotal >= settings.freeDeliveryAbove
        ? 0
        : settings.deliveryFee;
    const total = subtotal + deliveryFee;

    let codAdvancePercent: number | null = null;
    let advanceAmount: number | null = null;
    let remainingAmount: number | null = null;
    if (input.orderType === "COD") {
      codAdvancePercent = settings.codAdvancePercent;
      const calc = calculateCodAdvance(total, settings.codAdvancePercent);
      advanceAmount = calc.advanceAmount;
      remainingAmount = calc.remainingAmount;
    }

    // Atomic, gap-free order number for the current year.
    const year = new Date().getFullYear();
    const [existingCounter] = await tx.select().from(orderCounters).where(eq(orderCounters.year, year));
    const nextSeq = (existingCounter?.sequence ?? 0) + 1;
    if (existingCounter) {
      await tx.update(orderCounters).set({ sequence: nextSeq }).where(eq(orderCounters.year, year));
    } else {
      await tx.insert(orderCounters).values({ year, sequence: nextSeq });
    }
    const orderNumber = formatOrderNumber(year, nextSeq);

    const [customer] = await tx
      .insert(customers)
      .values({
        name: input.customer.fullName,
        phone: input.customer.mobile,
        whatsapp: input.customer.whatsapp,
        email: input.customer.email || null,
        addressLine: input.customer.addressLine,
        area: input.customer.area || null,
        city: input.customer.city,
        district: input.customer.district || null,
        state: input.customer.state,
        pincode: input.customer.pincode,
      })
      .returning();

    const whatsappMessage = buildWhatsappMessage({
      storeName: settings.storeName,
      orderNumber,
      customerName: customer!.name,
      customerPhone: customer!.phone,
      addressLine: customer!.addressLine,
      area: customer!.area,
      city: customer!.city,
      district: customer!.district,
      state: customer!.state,
      pincode: customer!.pincode,
      deliveryInstructions: input.customer.deliveryInstructions || null,
      items: preparedItems.map((i) => ({
        name: i.nameSnapshot,
        size: i.sizeSnapshot,
        color: i.colorSnapshot,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      subtotal,
      deliveryFee,
      discountTotal,
      total,
      orderType: input.orderType,
      codAdvancePercent,
      advanceAmount,
      remainingAmount,
      currency: settings.currency,
    });

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerId: customer!.id,
        deliveryInstructions: input.customer.deliveryInstructions || null,
        orderType: input.orderType,
        status: "PENDING",
        paymentStatus: "UNPAID",
        subtotal,
        deliveryFee,
        discountTotal,
        total,
        codAdvancePercent,
        advanceAmount,
        remainingAmount,
        whatsappMessage,
      })
      .returning();

    for (const item of preparedItems) {
      await tx.insert(orderItems).values({ orderId: order!.id, ...item });
    }

    return { order: order!, whatsappMessage, whatsappNumber: settings.whatsappNumber };
  });

  return result;
}
