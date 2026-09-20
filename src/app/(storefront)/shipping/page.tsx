import type { Metadata } from "next";
export const metadata: Metadata = { title: "Shipping Information" };

export default function ShippingPage() {
  return (
    <div className="container-luxe max-w-2xl py-14">
      <h1 className="section-heading mb-6">Shipping Information</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-charcoal/75">
        <p>We currently ship across India, with a focus on fast, reliable delivery to Jammu &amp; Kashmir and the rest of the country.</p>
        <p>Orders are typically dispatched within 2–4 business days of confirmation on WhatsApp. Delivery timelines vary by location — most metro areas receive orders within 5–7 business days, while remote regions may take slightly longer.</p>
        <p>Delivery charges (if any) are calculated at checkout and shown before you place your order. Orders above our free-delivery threshold ship at no extra cost.</p>
        <p>Once your order is confirmed, we&apos;ll share tracking and delivery updates with you directly over WhatsApp.</p>
      </div>
    </div>
  );
}
