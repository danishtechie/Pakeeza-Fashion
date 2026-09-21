import { listProducts, listCategories } from "@/server/catalog";
import { ProductCard } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ShopSortAndCount } from "@/components/shop/shop-sort";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const category = first(sp.category);
  const collection = first(sp.collection);
  const gender = first(sp.gender) as "WOMEN" | "MEN" | "UNISEX" | undefined;
  const search = first(sp.q);
  const sort = (first(sp.sort) as "newest" | "price_asc" | "price_desc" | "popular" | "trending" | undefined) ?? "newest";
  const page = Number(first(sp.page) ?? "1") || 1;
  const minPrice = first(sp.min) ? Number(first(sp.min)) * 100 : undefined;
  const maxPrice = first(sp.max) ? Number(first(sp.max)) * 100 : undefined;

  const [{ items, total, pageCount }, categories] = await Promise.all([
    listProducts({ categorySlug: category, collection, gender, search, sort, page, minPrice, maxPrice, pageSize: 12 }),
    listCategories(),
  ]);

  return (
    <div className="container-luxe py-10 sm:py-14">
      <div className="mb-8 rounded-[24px] bg-[#111111] px-6 py-8 text-white shadow-[0_18px_45px_rgba(0,0,0,0.12)] sm:px-8">
        <p className="eyebrow text-[#F7C767]">Shop</p>
        <h1 className="section-heading mt-2 text-white">
          {collection ? `${collection} Collection` : gender ? `${gender === "WOMEN" ? "Women's" : "Men's"} Collection` : "All Products"}
        </h1>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <ShopFilters categories={categories} />

        <div className="flex-1">
          <ShopSortAndCount total={total} sort={sort} />

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-24 text-center text-charcoal/60">
              <p className="text-lg">No products match these filters.</p>
              <p className="text-sm">Try adjusting or clearing your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={{ ...p, reviewCount: 0, rating: 5 }} index={i} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: pageCount }).map((_, i) => {
                const p = i + 1;
                const params = new URLSearchParams(sp as Record<string, string>);
                params.set("page", String(p));
                return (
                  <a
                    key={p}
                    href={`/shop?${params.toString()}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                      p === page ? "bg-[#F7C767] text-[#111111]" : "border border-white/10 bg-[#111111] text-white hover:border-[#F7C767]"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
