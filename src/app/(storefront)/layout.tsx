import { getSettings } from "@/lib/settings";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/cart/cart-provider";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings().catch(() => null);
  return (
    <CartProvider>
      <Navbar storeName={settings?.storeName ?? "Zenvy"} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
