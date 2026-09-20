import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { sql } from "drizzle-orm";

export default async function AdminCustomersPage() {
  const customerRows = await db.query.customers.findMany({
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });

  const orderAgg = await db
    .select({
      customerId: orders.customerId,
      orderCount: sql<number>`count(*)`,
      totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
      lastOrderAt: sql<string>`max(${orders.createdAt})`,
    })
    .from(orders)
    .groupBy(orders.customerId);

  const aggByCustomer = new Map(orderAgg.map((a) => [a.customerId, a]));

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Customers</h1>
      <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-left text-charcoal/50">
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Phone</th>
              <th className="px-4 py-3 font-normal">City</th>
              <th className="px-4 py-3 font-normal">Orders</th>
              <th className="px-4 py-3 font-normal">Total Spent</th>
              <th className="px-4 py-3 font-normal">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {customerRows.map((c) => {
              const agg = aggByCustomer.get(c.id);
              return (
                <tr key={c.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3">{agg?.orderCount ?? 0}</td>
                  <td className="px-4 py-3">₹{((agg?.totalSpent ?? 0) / 100).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-charcoal/60">
                    {agg?.lastOrderAt ? new Date(agg.lastOrderAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              );
            })}
            {customerRows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/40">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
