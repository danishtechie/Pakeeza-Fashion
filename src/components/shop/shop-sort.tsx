"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Popular" },
  { value: "trending", label: "Trending" },
];

export function ShopSortAndCount({ total, sort }: { total: number; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="mb-6 flex items-center justify-between">
      <p className="text-sm text-charcoal/60">{total} product{total === 1 ? "" : "s"}</p>
      <select
        value={sort}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-full border border-charcoal/15 bg-[#111111] px-3 py-2 text-sm text-white shadow-sm outline-none focus:border-[#F7C767]"
        aria-label="Sort products"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
