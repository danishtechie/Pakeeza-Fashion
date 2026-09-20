import { db } from "@/db/client";
import { ReviewModeration } from "@/components/admin/review-moderation";

export default async function AdminReviewsPage() {
  const reviews = await db.query.reviews.findMany({
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    with: { product: true },
  });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Reviews</h1>
      <ReviewModeration
        initialReviews={reviews.map((r) => ({
          id: r.id, productName: r.product.name, customerName: r.customerName, rating: r.rating,
          title: r.title, body: r.body, isVerifiedPurchase: r.isVerifiedPurchase,
          isApproved: r.isApproved, isFeatured: r.isFeatured,
        }))}
      />
    </div>
  );
}
