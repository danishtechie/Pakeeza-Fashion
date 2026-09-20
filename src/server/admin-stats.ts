import { db } from "@/db/client";
import { orders, products, productVariants, reviews, customers } from "@/db/schema";
import { sql, eq, gte, and, inArray } from "drizzle-orm";

export async function getDashboardStats() {
  const [
    totalOrders, pending, confirmed, delivered, cancelled,
    revenueRow, pendingAdvanceRow, totalProducts, lowStockRow,
    pendingReviews, totalCustomers,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(orders).then((r) => r[0]?.c ?? 0),
    db.select({ c: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "PENDING")).then((r) => r[0]?.c ?? 0),
    db.select({ c: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "CONFIRMED")).then((r) => r[0]?.c ?? 0),
    db.select({ c: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "DELIVERED")).then((r) => r[0]?.c ?? 0),
    db.select({ c: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "CANCELLED")).then((r) => r[0]?.c ?? 0),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(inArray(orders.status, ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]))
      .then((r) => r[0]?.total ?? 0),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.advanceAmount}), 0)` })
      .from(orders)
      .where(and(eq(orders.orderType, "COD"), eq(orders.paymentStatus, "ADVANCE_PENDING")))
      .then((r) => r[0]?.total ?? 0),
    db.select({ c: sql<number>`count(*)` }).from(products).then((r) => r[0]?.c ?? 0),
    db
      .select({ c: sql<number>`count(*)` })
      .from(productVariants)
      .where(sql`${productVariants.stock} <= ${productVariants.lowStockThreshold} AND ${productVariants.stock} > 0`)
      .then((r) => r[0]?.c ?? 0),
    db.select({ c: sql<number>`count(*)` }).from(reviews).where(eq(reviews.isApproved, false)).then((r) => r[0]?.c ?? 0),
    db.select({ c: sql<number>`count(*)` }).from(customers).then((r) => r[0]?.c ?? 0),
  ]);

  const recentOrders = await db.query.orders.findMany({
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 8,
    with: { customer: true },
  });

  return {
    totalOrders, pending, confirmed, delivered, cancelled,
    revenue: revenueRow, pendingAdvance: pendingAdvanceRow,
    totalProducts, lowStock: lowStockRow, pendingReviews, totalCustomers,
    recentOrders,
  };
}
