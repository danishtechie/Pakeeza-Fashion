"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatPaise, calculateCodAdvance } from "@/lib/money";
import { toast } from "@/components/ui/toaster";
import { CheckCircle2, Copy, MessageCircle, ShoppingBag } from "lucide-react";

interface Props {
  deliveryFee: number;
  freeDeliveryAbove: number | null;
  codEnabled: boolean;
  codAdvancePercent: number;
  currency: string;
}

type FormState = {
  fullName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  addressLine: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  deliveryInstructions: string;
  sameAsMobile: boolean;
};

const initialForm: FormState = {
  fullName: "", mobile: "", whatsapp: "", email: "", addressLine: "", area: "",
  city: "", district: "", state: "", pincode: "", deliveryInstructions: "", sameAsMobile: true,
};

interface OrderResult {
  orderNumber: string;
  total: number;
  whatsappMessage: string;
  whatsappUrl: string;
}

export function CheckoutForm({ deliveryFee, freeDeliveryAbove, codEnabled, codAdvancePercent, currency }: Props) {
  const { lines, clear } = useCartStore();
  const [form, setForm] = useState<FormState>(initialForm);
  const [orderType, setOrderType] = useState<"STANDARD" | "COD">("STANDARD");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<OrderResult | null>(null);

  const subtotal = cartSubtotal(lines);
  const effectiveDeliveryFee = freeDeliveryAbove != null && subtotal >= freeDeliveryAbove ? 0 : deliveryFee;
  const total = subtotal + effectiveDeliveryFee;
  const codPreview = useMemo(() => calculateCodAdvance(total, codAdvancePercent), [total, codAdvancePercent]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value, ...(key === "mobile" && f.sameAsMobile ? { whatsapp: value as string } : {}) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          customer: {
            fullName: form.fullName,
            mobile: form.mobile,
            whatsapp: form.sameAsMobile ? form.mobile : form.whatsapp,
            email: form.email || undefined,
            addressLine: form.addressLine,
            area: form.area || undefined,
            city: form.city,
            district: form.district || undefined,
            state: form.state,
            pincode: form.pincode,
            deliveryInstructions: form.deliveryInstructions || undefined,
          },
          items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.issues?.fieldErrors) setFieldErrors(data.issues.fieldErrors);
        toast(data.error || "Something went wrong. Please try again.", "error");
        return;
      }

      setResult(data);
      clear();
      toast("Your order has been created", "success");
    } catch {
      toast("Network error — please check your connection and try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <OrderSuccess result={result} />;
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center text-charcoal/60">
        <ShoppingBag size={40} strokeWidth={1} />
        <p>Your bag is empty — add something beautiful first.</p>
        <Link href="/shop" className="rounded-full bg-charcoal px-6 py-2.5 text-sm text-ivory hover:bg-forest">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">Customer Information</legend>
          <Field label="Full Name" error={fieldErrors.fullName}>
            <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mobile Number" error={fieldErrors.mobile}>
              <input required inputMode="tel" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} className={inputClass} placeholder="98765 43210" />
            </Field>
            <Field label="WhatsApp Number" error={fieldErrors.whatsapp}>
              <div className="flex items-center gap-2">
                <input
                  required
                  inputMode="tel"
                  disabled={form.sameAsMobile}
                  value={form.sameAsMobile ? form.mobile : form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  className={`${inputClass} disabled:bg-charcoal/5`}
                />
              </div>
              <label className="mt-1 flex items-center gap-1.5 text-xs text-charcoal/50">
                <input type="checkbox" checked={form.sameAsMobile} onChange={(e) => setForm((f) => ({ ...f, sameAsMobile: e.target.checked }))} />
                Same as mobile number
              </label>
            </Field>
          </div>
          <Field label="Email (optional)" error={fieldErrors.email}>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">Delivery Address</legend>
          <Field label="Address" error={fieldErrors.addressLine}>
            <textarea required rows={2} value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Area / Locality" error={fieldErrors.area}>
              <input value={form.area} onChange={(e) => update("area", e.target.value)} className={inputClass} />
            </Field>
            <Field label="City" error={fieldErrors.city}>
              <input required value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
            </Field>
            <Field label="District" error={fieldErrors.district}>
              <input value={form.district} onChange={(e) => update("district", e.target.value)} className={inputClass} />
            </Field>
            <Field label="State" error={fieldErrors.state}>
              <input required value={form.state} onChange={(e) => update("state", e.target.value)} className={inputClass} />
            </Field>
            <Field label="PIN Code" error={fieldErrors.pincode}>
              <input required inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => update("pincode", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Delivery Instructions (optional)" error={fieldErrors.deliveryInstructions}>
            <textarea rows={2} value={form.deliveryInstructions} onChange={(e) => update("deliveryInstructions", e.target.value)} className={inputClass} />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-xs font-medium uppercase tracking-widest2 text-charcoal/50">Order Type</legend>
          <div className="flex flex-col gap-3 sm:flex-row">
            <OrderTypeOption
              label="Standard Order"
              description="Confirm your order and receive instructions on WhatsApp."
              selected={orderType === "STANDARD"}
              onClick={() => setOrderType("STANDARD")}
            />
            <OrderTypeOption
              label="Cash on Delivery"
              description={`Requires ${codAdvancePercent}% advance payment; remainder on delivery.`}
              selected={orderType === "COD"}
              disabled={!codEnabled}
              onClick={() => codEnabled && setOrderType("COD")}
            />
          </div>
          {orderType === "COD" && (
            <div className="mt-4 rounded-lg border border-gold/40 bg-gold/5 p-4 text-sm">
              <p className="font-medium">
                COD orders require a {codAdvancePercent}% advance payment. The remaining {100 - codAdvancePercent}% is payable at delivery.
              </p>
              <div className="mt-2 flex justify-between text-charcoal/70">
                <span>Advance required (estimate)</span>
                <span className="font-medium text-charcoal">{formatPaise(codPreview.advanceAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-charcoal/70">
                <span>Remaining on delivery</span>
                <span className="font-medium text-charcoal">{formatPaise(codPreview.remainingAmount, currency)}</span>
              </div>
            </div>
          )}
        </fieldset>
      </div>

      <div className="h-fit rounded-xl border border-charcoal/10 bg-cream/40 p-6">
        <h2 className="mb-4 font-display text-xl">Order Summary</h2>
        <ul className="flex flex-col gap-4">
          {lines.map((l) => (
            <li key={l.variantId} className="flex gap-3">
              <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-md bg-cream">
                <Image src={l.image} alt={l.name} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1">
                <p className="line-clamp-1 text-sm">{l.name}</p>
                <p className="text-xs text-charcoal/50">
                  {[l.size, l.color].filter(Boolean).join(" · ")} · Qty {l.quantity}
                </p>
              </div>
              <span className="text-sm">{formatPaise(l.unitPrice * l.quantity, currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-1.5 border-t border-charcoal/10 pt-4 text-sm">
          <div className="flex justify-between text-charcoal/70">
            <span>Subtotal</span><span>{formatPaise(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-charcoal/70">
            <span>Delivery</span><span>{effectiveDeliveryFee > 0 ? formatPaise(effectiveDeliveryFee, currency) : "Free"}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-charcoal/10 pt-2 text-base font-medium">
            <span>Total</span><span>{formatPaise(total, currency)}</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-charcoal py-3.5 text-sm text-ivory transition hover:bg-forest disabled:opacity-50"
        >
          {submitting ? "Placing Order…" : "Place Order"}
        </button>
        <p className="mt-3 text-center text-xs text-charcoal/45">
          No payment is collected here. You&apos;ll confirm payment directly with us on WhatsApp.
        </p>
      </div>
    </form>
  );
}

function OrderSuccess({ result }: { result: OrderResult }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <CheckCircle2 size={48} className="text-forest" strokeWidth={1.2} />
      <h2 className="font-display text-2xl">Your order has been created</h2>
      <p className="text-charcoal/60">
        Order <span className="font-medium text-charcoal">{result.orderNumber}</span> · Total {formatPaise(result.total)}
      </p>
      <p className="text-sm text-charcoal/60">
        Opening WhatsApp to complete your order — nothing has been charged yet. We&apos;ll confirm payment and delivery details with you directly.
      </p>
      <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <MessageCircle size={17} /> Continue on WhatsApp
        </a>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(result.whatsappMessage);
            setCopied(true);
            toast("Order details copied", "success");
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-charcoal/20 py-3.5 text-sm transition hover:border-charcoal"
        >
          <Copy size={16} /> {copied ? "Copied!" : "Copy Order Details"}
        </button>
      </div>
      <Link href="/shop" className="mt-4 text-sm text-gold hover:underline">Continue Shopping</Link>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-charcoal/70">{label}</span>
      {children}
      {error?.[0] && <span className="text-xs text-burgundy">{error[0]}</span>}
    </label>
  );
}

function OrderTypeOption({
  label, description, selected, disabled, onClick,
}: { label: string; description: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
        selected ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/15 hover:border-charcoal/40"
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className={`mt-1 text-xs ${selected ? "text-ivory/70" : "text-charcoal/55"}`}>{description}</p>
    </button>
  );
}

const inputClass = "rounded-md border border-charcoal/20 bg-ivory px-3.5 py-2.5 text-sm outline-none focus:border-gold";
