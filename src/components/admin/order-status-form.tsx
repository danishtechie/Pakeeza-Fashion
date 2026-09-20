"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";

const statuses = [
  "PENDING","WHATSAPP_CONTACTED","AWAITING_ADVANCE","ADVANCE_RECEIVED","CONFIRMED",
  "PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","RETURNED",
];
const paymentStatuses = ["UNPAID","ADVANCE_PENDING","ADVANCE_RECEIVED","FULLY_PAID","REFUNDED"];

export function OrderStatusForm({
  orderId, currentStatus, currentPaymentStatus, currentNotes, orderType,
}: { orderId: string; currentStatus: string; currentPaymentStatus: string; currentNotes: string; orderType: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, paymentStatus, adminNotes: notes }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Order updated", "success");
      router.refresh();
    } else {
      toast("Failed to update order", "error");
    }
  }

  return (
    <section className="rounded-xl border border-charcoal/10 bg-ivory p-5">
      <h2 className="mb-3 font-medium">Manage Order</h2>
      {orderType === "COD" && (
        <p className="mb-3 rounded-md bg-gold/10 p-2.5 text-xs text-charcoal/70">
          COD order — confirm advance receipt on WhatsApp, then update payment status here.
        </p>
      )}
      <label className="mb-3 flex flex-col gap-1.5 text-sm">
        <span className="text-charcoal/60">Order Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-charcoal/20 px-3 py-2 text-sm">
          {statuses.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      <label className="mb-3 flex flex-col gap-1.5 text-sm">
        <span className="text-charcoal/60">Payment Status</span>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="rounded-md border border-charcoal/20 px-3 py-2 text-sm">
          {paymentStatuses.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      <label className="mb-4 flex flex-col gap-1.5 text-sm">
        <span className="text-charcoal/60">Internal Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="rounded-md border border-charcoal/20 px-3 py-2 text-sm" placeholder="Not visible to customer" />
      </label>
      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-full bg-charcoal py-2.5 text-sm text-ivory hover:bg-forest disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </section>
  );
}
