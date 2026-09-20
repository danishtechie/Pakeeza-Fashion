"use client";

import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface ReviewRow {
  id: string; productName: string; customerName: string; rating: number;
  title: string | null; body: string; isVerifiedPurchase: boolean; isApproved: boolean; isFeatured: boolean;
}

export function ReviewModeration({ initialReviews }: { initialReviews: ReviewRow[] }) {
  const [reviews, setReviews] = useState(initialReviews);

  async function update(id: string, patch: Partial<Pick<ReviewRow, "isApproved" | "isFeatured">>) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    if (res.ok) {
      setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    } else {
      toast("Failed to update review", "error");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews((rs) => rs.filter((r) => r.id !== id));
      toast("Review deleted", "success");
    } else {
      toast("Failed to delete review", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-charcoal/10 bg-ivory p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-charcoal/50">{r.productName}</p>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className={i < r.rating ? "fill-gold text-gold" : "text-charcoal/20"} />
                ))}
              </div>
              {r.title && <p className="mt-1 font-medium">{r.title}</p>}
              <p className="mt-1 text-sm text-charcoal/70">{r.body}</p>
              <p className="mt-2 text-xs text-charcoal/45">
                {r.customerName}{r.isVerifiedPurchase && " · Verified Purchase"}
              </p>
            </div>
            <button onClick={() => remove(r.id)} className="p-1.5 text-charcoal/40 hover:text-burgundy"><Trash2 size={16} /></button>
          </div>
          <div className="mt-3 flex gap-4 border-t border-charcoal/10 pt-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={r.isApproved} onChange={(e) => update(r.id, { isApproved: e.target.checked })} />
              Approved
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={r.isFeatured} onChange={(e) => update(r.id, { isFeatured: e.target.checked })} />
              Featured
            </label>
          </div>
        </div>
      ))}
      {reviews.length === 0 && <p className="text-center text-charcoal/40">No reviews yet.</p>}
    </div>
  );
}
