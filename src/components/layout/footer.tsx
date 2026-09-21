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
  const storeName = settings?.storeName ?? "Fashion";
  const waLink = settings?.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : "#";

  return (
    <footer className="border-t border-white/10 bg-[#0d0d0d] text-white">
      <div className="container-luxe grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-2xl uppercase tracking-[-0.04em] text-white">{storeName}</h3>
          <p className="mt-3 max-w-xs text-sm text-white/60">{settings?.tagline ?? "Premium Fashion & Style for Everyday Confidence"}</p>
          <div className="mt-5 flex gap-3">
            {settings?.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-white/20 p-2 text-white transition hover:-translate-y-1 hover:border-[#F7C767] hover:text-[#F7C767]">
                <Instagram size={16} />
              </a>
            )}
            {settings?.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-white/20 p-2 text-white transition hover:-translate-y-1 hover:border-[#F7C767] hover:text-[#F7C767]">
                <Facebook size={16} />
              </a>
            )}
            <a href={waLink} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full border border-white/20 p-2 text-white transition hover:-translate-y-1 hover:border-[#F7C767] hover:text-[#F7C767]">
              <MessageCircle size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="eyebrow mb-4 text-white/60">Quick Links</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-white/70">
            <li><Link href="/" className="hover:text-[#F7C767]">Home</Link></li>
            <li><Link href="/shop" className="hover:text-[#F7C767]">Shop All</Link></li>
            <li><Link href="/shop?category=football" className="hover:text-[#F7C767]">Football</Link></li>
            <li><Link href="/shop?category=full-sleeves-jerseys" className="hover:text-[#F7C767]">Jerseys</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 text-white/60">Categories</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-white/70">
            <li><Link href="/shop?category=football-cleats" className="hover:text-[#F7C767]">Football Cleats</Link></li>
            <li><Link href="/shop?category=full-sleeves-jerseys" className="hover:text-[#F7C767]">Full Sleeve Jerseys</Link></li>
            <li><Link href="/shop?category=grip-socks" className="hover:text-[#F7C767]">Grip Socks & Sleves</Link></li>
            <li><Link href="/shop" className="hover:text-[#F7C767]">More Categories</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 text-white/60">Contact</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-white/70">
            {settings?.storeEmail && <li>{settings.storeEmail}</li>}
            {settings?.storeAddress && <li>{settings.storeAddress}</li>}
            <li>
              <a href={waLink} target="_blank" rel="noreferrer" className="hover:text-[#F7C767]">
                Chat with us on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
