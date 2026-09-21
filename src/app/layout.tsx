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
  const storeName = settings?.storeName ?? "Fashion";
  const tagline = settings?.tagline ?? "Premium Fashion & Style for Everyday Confidence";
  return {
    title: { default: `${storeName} — ${tagline}`, template: `%s | ${storeName}` },
    description:
      "Modern fashion essentials, premium styling, and everyday looks with COD available across India.",
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    openGraph: {
      title: `${storeName} — ${tagline}`,
      description: "Premium fashion essentials and elegant everyday looks, delivered across India.",
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
