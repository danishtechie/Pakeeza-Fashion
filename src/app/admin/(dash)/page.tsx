import { getDashboardStats } from "@/server/admin-stats";
import { db } from "@/db/client";
import { formatPaise } from "@/lib/money";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ImagePlus, PackagePlus, Search } from "lucide-react";

export default async function AdminDashboardPage() {
  const [stats, recentProducts] = await Promise.all([
    getDashboardStats(),
    db.query.products.findMany({
      orderBy: (p, { desc }) => [desc(p.updatedAt)],
      limit: 6,
      with: { images: true, variants: true },
    }),
  ]);

  const cards = [
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Pending Orders", value: stats.pending },
    { label: "Confirmed Orders", value: stats.confirmed },
    { label: "Delivered Orders", value: stats.delivered },
    { label: "Cancelled Orders", value: stats.cancelled },
    { label: "Revenue (confirmed+)", value: formatPaise(stats.revenue) },
    { label: "Pending Advances", value: formatPaise(stats.pendingAdvance) },
    { label: "Products", value: stats.totalProducts },
    { label: "Low Stock Items", value: stats.lowStock },
    { label: "Pending Reviews", value: stats.pendingReviews },
    { label: "Customers", value: stats.totalCustomers },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Store control room</p>
          <h1 className="mt-1 font-display text-4xl">Good to see you.</h1>
          <p className="mt-2 text-sm text-charcoal/55">Manage your catalog, stock, and orders from one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-sm text-ivory transition hover:bg-forest">
            <PackagePlus size={16} /> Add product
          </Link>
          <Link href="/admin/products" className="flex items-center gap-2 rounded-full border border-charcoal/15 bg-ivory px-4 py-2.5 text-sm transition hover:border-gold hover:text-gold">
            <Search size={16} /> Manage catalog
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="group relative overflow-hidden rounded-xl border border-charcoal/10 bg-ivory p-5">
            <div className="absolute right-0 top-0 h-16 w-16 translate-x-6 -translate-y-6 rounded-full bg-gold/10 transition-transform duration-500 group-hover:translate-x-3 group-hover:-translate-y-3" />
            <p className="relative text-[10px] font-semibold uppercase tracking-widest text-charcoal/45">{c.label}</p>
            <p className="relative mt-2 font-display text-3xl text-charcoal">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-charcoal/10 bg-ivory p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">Activity</p>
            <h2 className="mt-1 font-display text-2xl">Recent Orders</h2>
          </div>
          <Link href="/admin/orders" className="text-sm text-gold hover:underline">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-left text-charcoal/50">
                <th className="py-2 pr-4 font-normal">Order ID</th>
                <th className="py-2 pr-4 font-normal">Customer</th>
                <th className="py-2 pr-4 font-normal">Total</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 font-normal">Payment</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-charcoal/5">
                  <td className="py-2.5 pr-4">
                    <Link href={`/admin/orders/${o.id}`} className="text-gold hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="py-2.5 pr-4">{o.customer.name}</td>
                  <td className="py-2.5 pr-4">{formatPaise(o.total)}</td>
                  <td className="py-2.5 pr-4">{o.status}</td>
                  <td className="py-2.5 pr-4">{o.paymentStatus}</td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-charcoal/40">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-charcoal/10 bg-ivory p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2 className="mt-1 font-display text-2xl">Recently updated products</h2>
          </div>
          <Link href="/admin/products" className="flex items-center gap-1 text-sm text-gold hover:underline">View all <ArrowUpRight size={14} /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentProducts.map((product) => {
            const stock = product.variants.reduce((total, variant) => total + variant.stock, 0);
            const image = product.images.sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;
            return (
              <Link key={product.id} href={`/admin/products/${product.id}`} className="group flex items-center gap-3 rounded-lg border border-charcoal/10 p-3 transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden bg-cream">
                  {image ? <Image src={image} alt={product.name} fill sizes="56px" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-charcoal/30"><ImagePlus size={18} /></div>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="truncate text-xs text-charcoal/50">{product.brand || "No brand"}</p>
                  <p className={`mt-1 text-xs ${stock === 0 ? "text-burgundy" : "text-charcoal/50"}`}>{stock} in stock · {product.isPublished ? "Published" : "Draft"}</p>
                </div>
              </Link>
            );
          })}
          {recentProducts.length === 0 && <p className="text-sm text-charcoal/45">No products yet. Add your first product to start building the catalog.</p>}
        </div>
      </section>
    </div>
  );
}
