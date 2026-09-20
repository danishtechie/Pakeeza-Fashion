import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cash on Delivery Policy" };

export default async function CodPolicyPage() {
  const settings = await getSettings();
  return (
    <div className="container-luxe max-w-2xl py-14">
      <h1 className="section-heading mb-6">Cash on Delivery Policy</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-charcoal/75">
        <p>Cash on Delivery (COD) is available on eligible orders across India.</p>
        <p>
          To confirm a COD order, we require an advance payment of {settings.codAdvancePercent}% of your order
          total. This advance is collected manually and confirmed directly with you over WhatsApp — we never
          collect payment details through this website.
        </p>
        <p>The remaining {100 - settings.codAdvancePercent}% is payable in cash to our delivery partner when your order arrives.</p>
        <p>Orders without a confirmed advance payment will not be dispatched. If you&apos;d prefer not to pay an advance, you&apos;re welcome to place a Standard Order instead and discuss payment options with us on WhatsApp.</p>
      </div>
    </div>
  );
}
