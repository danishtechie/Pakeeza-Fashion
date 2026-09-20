import { db } from "@/db/client";
import { orders, customers } from "@/db/schema";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { StatusBadge } from "@/components/admin/status-badge";

type SearchParams = Record<string, string | string[] | undefined>;
function first(v: string | string[] | undefined) { return Array.isArray(v) ? v[0] : v; }

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = first(sp.q);
  const status = first(sp.status);
  const paymentStatus = first(sp.payment);

  const conditions = [];
  if (status) conditions.push(eq(orders.status, status as (typeof orders.status.enumValues)[number]));
  if (paymentStatus) conditions.push(eq(orders.paymentStatus, paymentStatus as (typeof orders.paymentStatus.enumValues)[number]));

  let orderRows = await db.query.orders.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(orders.createdAt)],
    with: { customer: true },
    limit: 100,
  });

  if (q) {
    const needle = q.toLowerCase();
    orderRows = orderRows.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(needle) ||
        o.customer.name.toLowerCase().includes(needle) ||
        o.customer.phone.includes(needle)
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Orders</h1>
      </div>

      <form className="mb-5 flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order ID, name, phone…"
          className="min-w-[220px] flex-1 rounded-md border border-charcoal/20 bg-ivory px-3.5 py-2 text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-charcoal/20 bg-ivory px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {["PENDING","WHATSAPP_CONTACTED","AWAITING_ADVANCE","ADVANCE_RECEIVED","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","RETURNED"].map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
        <select name="payment" defaultValue={paymentStatus ?? ""} className="rounded-md border border-charcoal/20 bg-ivory px-3 py-2 text-sm">
          <option value="">All payment statuses</option>
          {["UNPAID","ADVANCE_PENDING","ADVANCE_RECEIVED","FULLY_PAID","REFUNDED"].map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
        <button className="rounded-md bg-charcoal px-4 py-2 text-sm text-ivory">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-left text-charcoal/50">
              <th className="px-4 py-3 font-normal">Order ID</th>
              <th className="px-4 py-3 font-normal">Customer</th>
              <th className="px-4 py-3 font-normal">Date</th>
              <th className="px-4 py-3 font-normal">Total</th>
              <th className="px-4 py-3 font-normal">COD</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Payment</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.map((o) => (
              <tr key={o.id} className="border-b border-charcoal/5 hover:bg-charcoal/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="text-gold hover:underline">{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3">{o.customer.name}<br /><span className="text-xs text-charcoal/50">{o.customer.phone}</span></td>
                <td className="px-4 py-3 text-charcoal/60">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">{formatPaise(o.total)}</td>
                <td className="px-4 py-3">{o.orderType === "COD" ? `Yes (${formatPaise(o.advanceAmount ?? 0)} adv.)` : "—"}</td>
                <td className="px-4 py-3"><StatusBadge value={o.status} /></td>
                <td className="px-4 py-3"><StatusBadge value={o.paymentStatus} /></td>
              </tr>
            ))}
            {orderRows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-charcoal/40">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
