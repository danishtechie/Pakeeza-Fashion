import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { formatPaise } from "@/lib/money";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { customer: true, items: true },
  });
  if (!order) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-charcoal/50">
            Placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-xl border border-charcoal/10 bg-ivory p-5">
            <h2 className="mb-3 font-medium">Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-left text-charcoal/50">
                  <th className="py-2 font-normal">Product</th>
                  <th className="py-2 font-normal">Variant</th>
                  <th className="py-2 font-normal">Qty</th>
                  <th className="py-2 font-normal">Unit Price</th>
                  <th className="py-2 font-normal">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-charcoal/5">
                    <td className="py-2.5">{item.nameSnapshot}</td>
                    <td className="py-2.5 text-charcoal/60">{[item.sizeSnapshot, item.colorSnapshot].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="py-2.5">{item.quantity}</td>
                    <td className="py-2.5">{formatPaise(item.unitPrice)}</td>
                    <td className="py-2.5">{formatPaise(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-col items-end gap-1 text-sm">
              <div className="flex w-48 justify-between text-charcoal/70"><span>Subtotal</span><span>{formatPaise(order.subtotal)}</span></div>
              {order.discountTotal > 0 && (
                <div className="flex w-48 justify-between text-charcoal/70"><span>Discount</span><span>-{formatPaise(order.discountTotal)}</span></div>
              )}
              <div className="flex w-48 justify-between text-charcoal/70"><span>Delivery</span><span>{formatPaise(order.deliveryFee)}</span></div>
              <div className="flex w-48 justify-between border-t border-charcoal/10 pt-1 font-medium"><span>Total</span><span>{formatPaise(order.total)}</span></div>
              {order.orderType === "COD" && (
                <>
                  <div className="mt-2 flex w-48 justify-between text-charcoal/70"><span>Advance ({order.codAdvancePercent}%)</span><span>{formatPaise(order.advanceAmount ?? 0)}</span></div>
                  <div className="flex w-48 justify-between text-charcoal/70"><span>Remaining COD</span><span>{formatPaise(order.remainingAmount ?? 0)}</span></div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-charcoal/10 bg-ivory p-5">
            <h2 className="mb-3 font-medium">Customer</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-charcoal/50">Name</dt><dd>{order.customer.name}</dd></div>
              <div><dt className="text-charcoal/50">Phone</dt><dd>{order.customer.phone}</dd></div>
              <div><dt className="text-charcoal/50">WhatsApp</dt><dd>{order.customer.whatsapp}</dd></div>
              <div><dt className="text-charcoal/50">Email</dt><dd>{order.customer.email || "—"}</dd></div>
              <div className="col-span-2"><dt className="text-charcoal/50">Address</dt>
                <dd>{[order.customer.addressLine, order.customer.area, order.customer.city, order.customer.district, order.customer.state, order.customer.pincode].filter(Boolean).join(", ")}</dd>
              </div>
              {order.deliveryInstructions && (
                <div className="col-span-2"><dt className="text-charcoal/50">Delivery Notes</dt><dd>{order.deliveryInstructions}</dd></div>
              )}
            </dl>
            <a
              href={`https://wa.me/${order.customer.whatsapp.replace(/\D/g, "")}`}
              target="_blank" rel="noreferrer"
              className="mt-4 inline-block rounded-full bg-[#25D366] px-4 py-2 text-xs font-medium text-white"
            >
              Message on WhatsApp
            </a>
          </section>

          <section className="rounded-xl border border-charcoal/10 bg-ivory p-5">
            <h2 className="mb-3 font-medium">WhatsApp Message Sent</h2>
            <pre className="whitespace-pre-wrap rounded-md bg-cream/50 p-4 text-xs text-charcoal/70">{order.whatsappMessage}</pre>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
            currentNotes={order.adminNotes ?? ""}
            orderType={order.orderType}
          />
        </div>
      </div>
    </div>
  );
}
