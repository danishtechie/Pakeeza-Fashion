"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Category = { id: string; name: string; slug: string };

export function ShopFilters({ categories }: { categories: Category[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeCategory = searchParams.get("category");
  const activeGender = searchParams.get("gender");
  const activeCollection = searchParams.get("collection");

  const content = (
    <div className="flex flex-col gap-8">
      <FilterGroup title="Category">
        {categories.map((c) => (
          <FilterOption
            key={c.id}
            label={c.name}
            active={activeCategory === c.slug}
            onClick={() => updateParam("category", activeCategory === c.slug ? null : c.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Gender">
        {["WOMEN", "MEN", "UNISEX"].map((g) => (
          <FilterOption
            key={g}
            label={g === "WOMEN" ? "Women" : g === "MEN" ? "Men" : "Unisex"}
            active={activeGender === g}
            onClick={() => updateParam("gender", activeGender === g ? null : g)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Collection">
        {["Kashmiri", "Pakistani"].map((c) => (
          <FilterOption
            key={c}
            label={c}
            active={activeCollection === c}
            onClick={() => updateParam("collection", activeCollection === c ? null : c)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price Range">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const min = (form.elements.namedItem("min") as HTMLInputElement).value;
            const max = (form.elements.namedItem("max") as HTMLInputElement).value;
            const params = new URLSearchParams(searchParams.toString());
            if (min) params.set("min", min); else params.delete("min");
            if (max) params.set("max", max); else params.delete("max");
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <input name="min" type="number" placeholder="Min" defaultValue={searchParams.get("min") ?? ""} className="w-20 rounded-md border border-charcoal/20 px-2 py-1.5 text-sm" />
          <span className="text-charcoal/40">–</span>
          <input name="max" type="number" placeholder="Max" defaultValue={searchParams.get("max") ?? ""} className="w-20 rounded-md border border-charcoal/20 px-2 py-1.5 text-sm" />
          <button type="submit" className="rounded-md bg-charcoal px-3 py-1.5 text-xs text-ivory">Go</button>
        </form>
      </FilterGroup>

      <button
        onClick={() => router.push(pathname)}
        className="self-start text-xs text-burgundy underline"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      <button
        className="mb-2 flex items-center gap-2 self-start rounded-full border border-charcoal/20 px-4 py-2 text-sm lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <SlidersHorizontal size={15} /> Filters
      </button>

      <aside className="hidden w-56 flex-shrink-0 lg:block">{content}</aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-charcoal/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28 }}
              className="fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto bg-ivory p-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-medium">Filters</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close filters"><X size={20} /></button>
              </div>
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">{title}</h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FilterOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left text-sm transition ${active ? "font-medium text-gold" : "text-charcoal/70 hover:text-charcoal"}`}
    >
      {label}
    </button>
  );
}
