"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ListTree, ShoppingCart, Users, Star, Settings, LogOut, Store, ExternalLink,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: ListTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children, userName, userRole,
}: { children: React.ReactNode; userName: string; userRole: string }) {
  const pathname = usePathname();
  const currentSection = navItems.find((item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))?.label ?? "Admin";

  return (
    <div className="admin-shell flex min-h-screen bg-cream/40 text-charcoal">
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-ivory/10 bg-charcoal px-5 py-7 text-ivory lg:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold text-sm text-gold">P</span>
          <div>
            <span className="block font-display text-xl tracking-tight">Zenvy Admin</span>
            <span className="text-[9px] uppercase tracking-widest text-ivory/40">Store operations</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active ? "bg-gold text-charcoal shadow-lg shadow-gold/10" : "text-ivory/65 hover:bg-ivory/10 hover:text-ivory"
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-ivory/10 pt-4">
          <p className="px-2 text-xs text-ivory/60">{userName}</p>
          <p className="px-2 text-xs uppercase tracking-widest text-gold/70">{userRole}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ivory/55 transition hover:bg-burgundy/20 hover:text-ivory"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-charcoal/10 bg-ivory/80 px-5 py-4 backdrop-blur-xl lg:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">Zenvy / {currentSection}</p>
            <p className="mt-1 text-xs text-charcoal/45">Live store workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 text-xs text-charcoal/55 transition hover:text-gold sm:flex">
              View storefront <ExternalLink size={13} />
            </Link>
            <span className="flex items-center gap-1.5 rounded-full border border-forest/20 bg-forest/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-forest">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" /> Online
            </span>
            <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="text-xs font-medium text-burgundy transition hover:text-burgundy-soft">
              Sign Out
            </button>
          </div>
        </header>
        <main className="admin-main p-5 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
