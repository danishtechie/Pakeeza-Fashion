import { db } from "@/db/client";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.sortOrder)] });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Categories</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
