import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container-luxe max-w-2xl py-14">
      <h1 className="section-heading mb-6">Privacy Policy</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-charcoal/75">
        <p>Pakeeza Fashion collects only the information needed to process and deliver your order: your name, phone/WhatsApp number, email (optional), and delivery address.</p>
        <p>We do not sell, rent, or share your personal information with third parties for marketing purposes. Your details are used solely to fulfill your order and communicate with you about it, primarily over WhatsApp.</p>
        <p>We do not collect or store any payment card or bank account information — all payment confirmation happens directly with us over WhatsApp.</p>
        <p>You may request that we delete your personal data at any time by messaging us on WhatsApp, subject to any records we&apos;re required to retain for accounting or legal purposes.</p>
      </div>
    </div>
  );
}
