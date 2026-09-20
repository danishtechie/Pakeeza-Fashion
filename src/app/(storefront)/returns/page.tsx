import type { Metadata } from "next";
export const metadata: Metadata = { title: "Returns Policy" };

export default function ReturnsPage() {
  return (
    <div className="container-luxe max-w-2xl py-14">
      <h1 className="section-heading mb-6">Returns Policy</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-charcoal/75">
        <p>We want you to love what you order. If an item arrives damaged, defective, or different from what you ordered, please message us on WhatsApp within 3 days of delivery with photos of the item.</p>
        <p>Once we verify the issue, we&apos;ll arrange a replacement or refund as appropriate. Refunds for any advance paid are processed to the original payment method within 7 business days of approval.</p>
        <p>Due to the handcrafted and made-to-order nature of some pieces, we&apos;re unable to accept returns for change of mind on customized or altered items. Standard ready-to-ship items may be eligible for exchange — please reach out on WhatsApp to discuss your specific order.</p>
      </div>
    </div>
  );
}
