import { db } from "@/db/client";
import { and, desc, eq, like, or } from "drizzle-orm";
import { products } from "@/db/schema";
import Link from "next/link";
import Image from "next/image";
import { formatPaise } from "@/lib/money";
import { Plus } from "lucide-react";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status ?? "all";
  const conditions = [];
  if (query) {
    conditions.push(or(like(products.name, `%${query}%`), like(products.brand, `%${query}%`), like(products.sku, `%${query}%`))!);
  }
  if (status === "published") conditions.push(eq(products.isPublished, true));
  if (status === "draft") conditions.push(eq(products.isPublished, false));
  const rows = await db.query.products.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    with: { category: true, images: true, variants: true },
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Catalog control</p>
          <h1 className="mt-1 font-display text-3xl">Products</h1>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-sm text-ivory hover:bg-forest">
          <Plus size={15} /> Add Product
        </Link>
      </div>

      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={query} placeholder="Search product, brand or SKU" className="min-w-0 flex-1 rounded-lg border border-charcoal/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold" />
        <select name="status" defaultValue={status} className="rounded-lg border border-charcoal/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold">
          <option value="all">All visibility</option>
          <option value="published">Published</option>
          <option value="draft">Unpublished</option>
        </select>
        <button className="rounded-lg bg-charcoal px-5 py-2.5 text-sm text-ivory transition hover:bg-forest">Search</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-left text-charcoal/50">
              <th className="px-4 py-3 font-normal">Product</th>
              <th className="px-4 py-3 font-normal">Brand</th>
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Price</th>
              <th className="px-4 py-3 font-normal">Stock</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              const thumb = p.images[0]?.url ?? "/placeholder-product.svg";
              return (
                <tr key={p.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded bg-cream">
                        <Image src={thumb} alt={p.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div>
                        <p className="line-clamp-1 font-medium">{p.name}</p>
                        <p className="text-xs text-charcoal/50">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{p.brand ?? "—"}</td>
                  <td className="px-4 py-3">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatPaise(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={stock === 0 ? "text-burgundy" : stock <= 5 ? "text-amber-700" : ""}>{stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${p.isPublished ? "bg-green-100 text-green-800" : "bg-charcoal/10 text-charcoal/60"}`}>
                      {p.isPublished ? "Published" : "Unpublished"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-gold hover:underline">Edit</Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-charcoal/40">No products match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
