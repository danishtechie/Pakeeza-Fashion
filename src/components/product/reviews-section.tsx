"use client";

import { Star } from "lucide-react";

interface ReviewData {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

export function ReviewsSection({ reviews, avgRating }: { reviews: ReviewData[]; avgRating: number | null }) {
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section className="mt-16 border-t border-charcoal/10 pt-12">
      <h2 className="section-heading mb-8">Customer Reviews</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-charcoal/60">No reviews yet — be the first to share your experience.</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div>
            <p className="text-4xl font-display">{avgRating?.toFixed(1)}</p>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < Math.round(avgRating ?? 0) ? "fill-gold text-gold" : "text-charcoal/20"} />
              ))}
            </div>
            <p className="mt-1 text-sm text-charcoal/60">{reviews.length} reviews</p>
            <div className="mt-4 flex flex-col gap-1.5">
              {breakdown.map((b) => (
                <div key={b.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-charcoal/50">{b.star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal/10">
                    <div
                      className="h-full bg-gold"
                      style={{ width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-5 text-charcoal/40">{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-charcoal/10 pb-6 last:border-none">
                <div className="mb-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < r.rating ? "fill-gold text-gold" : "text-charcoal/20"} />
                  ))}
                </div>
                {r.title && <p className="font-medium">{r.title}</p>}
                <p className="mt-1 text-sm text-charcoal/70">{r.body}</p>
                <p className="mt-2 text-xs text-charcoal/45">
                  {r.customerName}
                  {r.isVerifiedPurchase && " · Verified Purchase"} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
