import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <div className="container-luxe max-w-3xl py-14">
      <div className="rounded-[24px] bg-[#111111] p-6 text-white shadow-[0_20px_45px_rgba(0,0,0,0.12)] sm:p-8">
        <h1 className="section-heading mb-6 text-white">Terms &amp; Conditions</h1>
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-white/75">
          <p>By placing an order with Fashion, you agree to the following terms:</p>
          <p>Product prices, availability, and stock are confirmed at the time your order is placed. In the rare case an item becomes unavailable after ordering, we&apos;ll notify you on WhatsApp with alternatives or a full refund of any advance paid.</p>
          <p>Placing an order on this website does not constitute a completed payment. Orders are confirmed only after you&apos;ve communicated with us directly on WhatsApp and, for COD orders, paid the required advance.</p>
          <p>Product images are for illustration; actual colors may vary slightly due to photography and screen settings, particularly for hand-dyed and hand-embroidered pieces.</p>
          <p>We reserve the right to decline or cancel any order at our discretion, including in cases of suspected fraud or abuse.</p>
        </div>
      </div>
    </div>
  );
}
