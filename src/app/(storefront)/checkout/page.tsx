import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const settings = await getSettings();

  return (
    <div className="container-luxe max-w-4xl py-10 sm:py-14">
      <p className="eyebrow">Checkout</p>
      <h1 className="section-heading mt-2 mb-8">Complete Your Order</h1>
      <CheckoutForm
        deliveryFee={settings.deliveryFee}
        freeDeliveryAbove={settings.freeDeliveryAbove}
        codEnabled={settings.codEnabled}
        codAdvancePercent={settings.codAdvancePercent}
        currency={settings.currency}
      />
    </div>
  );
}
