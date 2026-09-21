import type { Metadata } from "next";
export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  { q: "How do I place an order?", a: "Browse our collection, add items to your bag, and proceed to checkout. After you place your order, you'll be redirected to WhatsApp to confirm details and payment directly with us." },
  { q: "Is Cash on Delivery available?", a: "Yes, COD is available on eligible orders and requires a partial advance payment, confirmed over WhatsApp — see our COD Policy for details." },
  { q: "Do I need to create an account to order?", a: "No — guest checkout is fully supported. You're welcome to create an account in the future, but it's never required." },
  { q: "How long does delivery take?", a: "Most orders arrive within 5–7 business days across India, though remote areas may take a little longer. See our Shipping Information page for details." },
  { q: "Can I return or exchange an item?", a: "Yes, for damaged, defective, or incorrect items — message us on WhatsApp within 3 days of delivery. See our Returns Policy for full details." },
  { q: "Is my payment information safe?", a: "We never collect payment details through this website. All payment is confirmed directly and manually with us on WhatsApp." },
];

export default function FaqPage() {
  return (
    <div className="container-luxe max-w-3xl py-14">
      <div className="rounded-[24px] bg-[#111111] p-6 text-white shadow-[0_20px_45px_rgba(0,0,0,0.12)] sm:p-8">
        <h1 className="section-heading mb-6 text-white">Frequently Asked Questions</h1>
        <div className="flex flex-col divide-y divide-white/10">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none text-sm font-medium marker:content-none text-white">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
