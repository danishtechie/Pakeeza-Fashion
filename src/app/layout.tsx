import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { Toaster } from "@/components/ui/toaster";

// NOTE: Using elegant system/CSS font fallbacks instead of next/font/google
// because this build sandbox cannot reach Google's font CDN. Fonts are wired
// through --font-display / --font-body in globals.css — swapping in
// next/font/google or self-hosted files later is an isolated change.

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => null);
  const storeName = settings?.storeName ?? "Pakeeza Fashion";
  const tagline = settings?.tagline ?? "Where Heritage Meets Modern Elegance";
  return {
    title: { default: `${storeName} — ${tagline}`, template: `%s | ${storeName}` },
    description:
      "Premium Pakistani and Kashmiri fashion — ladies' and gents' ethnic wear, Kashmiri shawls, salwar suits, kurtas and dupattas. Order on WhatsApp with COD available across India.",
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    openGraph: {
      title: `${storeName} — ${tagline}`,
      description: "Premium Pakistani and Kashmiri fashion, delivered across India.",
      siteName: storeName,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
