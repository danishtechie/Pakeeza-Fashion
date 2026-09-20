"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";

interface SettingsShape {
  storeName: string; tagline: string; whatsappNumber: string; storePhone: string;
  storeEmail: string; storeAddress: string; deliveryFee: number; freeDeliveryAbove?: number;
  codEnabled: boolean; codAdvancePercent: number; instagramUrl: string; facebookUrl: string;
}

export function SettingsForm({ initial }: { initial: SettingsShape }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function set<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deliveryFee: Math.round(form.deliveryFee * 100),
        freeDeliveryAbove: form.freeDeliveryAbove ? Math.round(form.freeDeliveryAbove * 100) : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Settings updated", "success");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Failed to update settings", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl grid-cols-1 gap-4 rounded-xl border border-charcoal/10 bg-ivory p-6 sm:grid-cols-2">
      <Field label="Store Name"><input value={form.storeName} onChange={(e) => set("storeName", e.target.value)} className={inputClass} /></Field>
      <Field label="Tagline"><input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass} /></Field>

      <Field label="WhatsApp Business Number" hint="Digits only, with country code — e.g. 919999999999">
        <input value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Store Phone"><input value={form.storePhone} onChange={(e) => set("storePhone", e.target.value)} className={inputClass} /></Field>

      <Field label="Store Email"><input type="email" value={form.storeEmail} onChange={(e) => set("storeEmail", e.target.value)} className={inputClass} /></Field>
      <Field label="Store Address"><input value={form.storeAddress} onChange={(e) => set("storeAddress", e.target.value)} className={inputClass} /></Field>

      <Field label="Delivery Fee (₹)"><input type="number" min="0" value={form.deliveryFee} onChange={(e) => set("deliveryFee", Number(e.target.value))} className={inputClass} /></Field>
      <Field label="Free Delivery Above (₹, optional)">
        <input type="number" min="0" value={form.freeDeliveryAbove ?? ""} onChange={(e) => set("freeDeliveryAbove", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
      </Field>

      <Field label="COD Advance Percent" hint="e.g. 50 for 50% advance">
        <input type="number" min="1" max="100" value={form.codAdvancePercent} onChange={(e) => set("codAdvancePercent", Number(e.target.value))} className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
        <input type="checkbox" checked={form.codEnabled} onChange={(e) => set("codEnabled", e.target.checked)} />
        Cash on Delivery Enabled
      </label>

      <Field label="Instagram URL"><input value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} className={inputClass} /></Field>
      <Field label="Facebook URL"><input value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} className={inputClass} /></Field>

      <button type="submit" disabled={saving} className="col-span-full mt-2 rounded-full bg-charcoal py-3 text-sm text-ivory hover:bg-forest disabled:opacity-50">
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-charcoal/60">{label}</span>
      {children}
      {hint && <span className="text-xs text-charcoal/40">{hint}</span>}
    </label>
  );
}

const inputClass = "rounded-md border border-charcoal/20 px-3 py-2 text-sm outline-none focus:border-gold";
