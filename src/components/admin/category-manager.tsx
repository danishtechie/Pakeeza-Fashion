"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  imageUrl: string | null; sortOrder: number; isEnabled: boolean;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, imageUrl, sortOrder: categories.length, isEnabled: true }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast(data.error || "Failed to add category", "error");
      return;
    }
    setCategories((c) => [...c, data.category]);
    setName(""); setSlug(""); setImageUrl("");
    toast("Category added", "success");
    router.refresh();
  }

  async function toggleEnabled(cat: Category) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cat, isEnabled: !cat.isEnabled }),
    });
    if (res.ok) {
      setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, isEnabled: !c.isEnabled } : c)));
    } else {
      toast("Failed to update category", "error");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory lg:col-span-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 text-left text-charcoal/50">
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Slug</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-charcoal/5">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-charcoal/60">{c.slug}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${c.isEnabled ? "bg-green-100 text-green-800" : "bg-charcoal/10 text-charcoal/60"}`}>
                    {c.isEnabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleEnabled(c)} className="text-gold hover:underline">
                    {c.isEnabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addCategory} className="h-fit rounded-xl border border-charcoal/10 bg-ivory p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">Add Category</h2>
        <div className="flex flex-col gap-3">
          <input required placeholder="Name" value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} className="rounded-md border border-charcoal/20 px-3 py-2 text-sm" />
          <input required placeholder="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="rounded-md border border-charcoal/20 px-3 py-2 text-sm" />
          <input placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="rounded-md border border-charcoal/20 px-3 py-2 text-sm" />
          <button type="submit" disabled={saving} className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-charcoal py-2.5 text-sm text-ivory hover:bg-forest disabled:opacity-50">
            <Plus size={14} /> {saving ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
