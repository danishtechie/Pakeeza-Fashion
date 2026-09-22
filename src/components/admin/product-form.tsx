"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface Category { id: string; name: string }
interface VariantRow { id?: string; size: string; color: string; sku: string; stock: number; lowStockThreshold: number }
interface ImageRow { url: string; altText: string }

interface InitialProduct {
  id?: string;
  name: string; brand: string; slug: string; description: string; shortDescription: string; sku: string;
  gender: "WOMEN" | "MEN" | "UNISEX"; collection: string; fabric: string; careInstructions: string;
  price: number; salePrice: number | null; categoryId: string; tags: string; seoTitle: string; seoDesc: string;
  isFeatured: boolean; isTrending: boolean; isBestseller: boolean; isNewArrival: boolean; isPublished: boolean;
  images: ImageRow[]; variants: VariantRow[];
}

const emptyProduct: InitialProduct = {
  name: "", brand: "", slug: "", description: "", shortDescription: "", sku: "",
  gender: "UNISEX", collection: "", fabric: "", careInstructions: "",
  price: 0, salePrice: null, categoryId: "", tags: "", seoTitle: "", seoDesc: "",
  isFeatured: false, isTrending: false, isBestseller: false, isNewArrival: false, isPublished: true,
  images: [], variants: [{ size: "", color: "", sku: "", stock: 0, lowStockThreshold: 5 }],
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ProductForm({ categories, initial }: { categories: Category[]; initial?: InitialProduct }) {
  const [form, setForm] = useState<InitialProduct>(initial ?? emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof InitialProduct>(key: K, value: InitialProduct[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateVariant(idx: number, patch: Partial<VariantRow>) {
    setForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)) }));
  }
  function addVariant() {
    setForm((f) => ({ ...f, variants: [...f.variants, { size: "", color: "", sku: "", stock: 0, lowStockThreshold: 5 }] }));
  }
  function removeVariant(idx: number) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast(data.error || `Upload failed (${res.status})`, "error");
            continue;
          }
          setForm((f) => ({ ...f, images: [...f.images, { url: data.url, altText: f.name }] }));
        } catch {
          toast("Upload request failed. Confirm the admin session is active and try again.", "error");
        }
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }
  function moveImage(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const imgs = [...f.images];
      const target = idx + dir;
      if (target < 0 || target >= imgs.length) return f;
      [imgs[idx], imgs[target]] = [imgs[target]!, imgs[idx]!];
      return { ...f, images: imgs };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      variants: form.variants.map((v) => ({ ...v, size: v.size || undefined, color: v.color || undefined })),
    };

    const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.issues?.fieldErrors ?? {});
        toast(data.error || "Failed to save product", "error");
        return;
      }
      toast(isEdit ? "Product updated" : "Product created", "success");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Section title="Basic Information">
          <Field label="Product Name" error={errors.name}>
            <input
              required value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!isEdit) set("slug", slugify(e.target.value));
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Brand" error={errors.brand}>
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Gul Ahmed, Sapphire, Zenvy" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" error={errors.slug}>
              <input required value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={inputClass} />
            </Field>
            <Field label="SKU" error={errors.sku}>
              <input required value={form.sku} onChange={(e) => set("sku", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Short Description" error={errors.shortDescription}>
            <input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Full Description" error={errors.description}>
            <textarea required rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
          </Field>
        </Section>

        <Section title="Category & Attributes">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={errors.categoryId}>
              <select required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Gender" error={errors.gender}>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value as InitialProduct["gender"])} className={inputClass}>
                <option value="WOMEN">Women</option>
                <option value="MEN">Men</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </Field>
            <Field label="Collection (e.g. Kashmiri, Pakistani)" error={errors.collection}>
              <input value={form.collection} onChange={(e) => set("collection", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Fabric" error={errors.fabric}>
              <input value={form.fabric} onChange={(e) => set("fabric", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Care Instructions" error={errors.careInstructions}>
            <textarea rows={2} value={form.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tags (comma-separated)" error={errors.tags}>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputClass} />
          </Field>
        </Section>

        <Section title="Pricing">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)" error={errors.price}>
              <input required type="number" step="0.01" min="0" value={form.price ? form.price / 100 : ""} onChange={(e) => set("price", Math.round(Number(e.target.value || 0) * 100))} className={inputClass} />
            </Field>
            <Field label="Sale Price (₹, optional)" error={errors.salePrice}>
                <input type="number" step="0.01" min="0" value={form.salePrice ? form.salePrice / 100 : ""} onChange={(e) => set("salePrice", e.target.value ? Math.round(Number(e.target.value) * 100) : null)} className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section title="Images">
          <div className="flex flex-wrap gap-3">
            {form.images.map((img, idx) => (
              <div key={img.url} className="relative h-24 w-20 overflow-hidden rounded-md border border-charcoal/10">
                <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute right-1 top-1 rounded-full bg-charcoal/80 p-0.5 text-ivory">
                  <X size={11} />
                </button>
                <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                  <button type="button" onClick={() => moveImage(idx, -1)} className="rounded bg-ivory/90 px-1 text-[10px]">←</button>
                  <button type="button" onClick={() => moveImage(idx, 1)} className="rounded bg-ivory/90 px-1 text-[10px]">→</button>
                </div>
              </div>
            ))}
            <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-charcoal/30 text-charcoal/40 hover:border-gold hover:text-gold">
              <Plus size={16} />
              <span className="text-[10px]">{uploading ? "Uploading…" : "Add Image"}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          <p className="mt-2 text-xs text-charcoal/45">JPEG, PNG or WebP, up to 5MB each. First image is the thumbnail. Uploads are converted to WebP automatically.</p>
        </Section>

        <Section title="Variants (Size / Color / Stock)">
          <div className="flex flex-col gap-3">
            {form.variants.map((v, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1.4fr_0.8fr_0.8fr_auto] items-end gap-2">
                <Field label="Size"><input value={v.size} onChange={(e) => updateVariant(idx, { size: e.target.value })} className={inputClass} /></Field>
                <Field label="Color"><input value={v.color} onChange={(e) => updateVariant(idx, { color: e.target.value })} className={inputClass} /></Field>
                <Field label="Variant SKU"><input required value={v.sku} onChange={(e) => updateVariant(idx, { sku: e.target.value })} className={inputClass} /></Field>
                <Field label="Stock"><input required type="number" min="0" value={v.stock} onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })} className={inputClass} /></Field>
                <Field label="Low Stock At"><input type="number" min="0" value={v.lowStockThreshold} onChange={(e) => updateVariant(idx, { lowStockThreshold: Number(e.target.value) })} className={inputClass} /></Field>
                <button type="button" onClick={() => removeVariant(idx)} className="mb-0.5 p-2 text-charcoal/40 hover:text-burgundy"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {errors.variants && <p className="mt-2 text-xs text-burgundy">{errors.variants[0]}</p>}
          <button type="button" onClick={addVariant} className="mt-3 flex items-center gap-1.5 text-sm text-gold hover:underline">
            <Plus size={14} /> Add Variant
          </button>
        </Section>

        <Section title="SEO">
          <Field label="SEO Title" error={errors.seoTitle}><input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={inputClass} /></Field>
          <Field label="SEO Description" error={errors.seoDesc}><input value={form.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} className={inputClass} /></Field>
        </Section>
      </div>

      <div className="flex flex-col gap-6">
        <Section title="Flags">
          <div className="flex flex-col gap-2 text-sm">
            {([
              ["isPublished", "Published"], ["isFeatured", "Featured"], ["isTrending", "Trending"],
              ["isBestseller", "Bestseller"], ["isNewArrival", "New Arrival"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </Section>
        <button type="submit" disabled={saving} className="rounded-full bg-charcoal py-3 text-sm text-ivory hover:bg-forest disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-charcoal/10 bg-ivory p-5">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-charcoal/60">{label}</span>
      {children}
      {error?.[0] && <span className="text-xs text-burgundy">{error[0]}</span>}
    </label>
  );
}

const inputClass = "rounded-md border border-charcoal/20 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold";
