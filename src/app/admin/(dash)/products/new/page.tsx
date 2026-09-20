import { db } from "@/db/client";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.sortOrder)] });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Add Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
