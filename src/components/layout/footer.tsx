import Link from "next/link";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

type SettingsLike = {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  storeEmail?: string | null;
  storeAddress?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
} | null;

const policyLinks = [
  { href: "/shipping", label: "Shipping Information" },
  { href: "/returns", label: "Returns Policy" },
  { href: "/cod-policy", label: "COD Policy" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/faq", label: "FAQ" },
];

export function Footer({ settings }: { settings: SettingsLike }) {
  const storeName = settings?.storeName ?? "Pakeeza Fashion";
  const waLink = settings?.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : "#";

  return (
    <footer className="border-t border-ivory/10 bg-charcoal text-ivory">
      <div className="container-luxe grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-2xl">{storeName}</h3>
          <p className="mt-3 max-w-xs text-sm text-ivory/60">{settings?.tagline}</p>
          <div className="mt-5 flex gap-3">
            {settings?.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-ivory/20 p-2 transition hover:-translate-y-1 hover:border-gold hover:text-gold">
                <Instagram size={16} />
              </a>
            )}
            {settings?.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-ivory/20 p-2 transition hover:-translate-y-1 hover:border-gold hover:text-gold">
                <Facebook size={16} />
              </a>
            )}
            <a href={waLink} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full border border-ivory/20 p-2 transition hover:-translate-y-1 hover:border-gold hover:text-gold">
              <MessageCircle size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="eyebrow mb-4 text-ivory/50">Shop</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-ivory/70">
            <li><Link href="/shop?gender=WOMEN" className="hover:text-gold">Women&apos;s Collection</Link></li>
            <li><Link href="/shop?gender=MEN" className="hover:text-gold">Men&apos;s Collection</Link></li>
            <li><Link href="/shop?collection=Kashmiri" className="hover:text-gold">Kashmiri Collection</Link></li>
            <li><Link href="/shop?collection=Pakistani" className="hover:text-gold">Pakistani Collection</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 text-ivory/50">Policies</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-ivory/70">
            {policyLinks.map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-gold">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 text-ivory/50">Contact</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-ivory/70">
            {settings?.storeEmail && <li>{settings.storeEmail}</li>}
            {settings?.storeAddress && <li>{settings.storeAddress}</li>}
            <li>
              <a href={waLink} target="_blank" rel="noreferrer" className="hover:text-gold">
                Chat with us on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-5 text-center text-xs text-ivory/40">
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
