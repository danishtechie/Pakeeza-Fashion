import bcrypt from "bcryptjs";
import { db } from "../src/db/client";
import {
  settings,
  adminUsers,
  categories,
  products,
  productImages,
  productVariants,
  reviews,
} from "../src/db/schema";
import { rupeesToPaise } from "../src/lib/money";
import { saveSeedImage } from "./placeholder-image";

async function main() {
  console.log("Seeding Zenvy...");

  // ---- Settings (singleton) ----
  await db
    .insert(settings)
    .values({
      id: "singleton",
      storeName: "Zenvy",
      tagline: "Where Heritage Meets Modern Elegance",
      whatsappNumber: process.env.WHATSAPP_DEFAULT_NUMBER || "919999999999",
      storePhone: process.env.WHATSAPP_DEFAULT_NUMBER || "919999999999",
      storeEmail: "hello@zenvy.com",
      storeAddress: "Srinagar, Jammu & Kashmir, India",
      deliveryFee: rupeesToPaise(99),
      freeDeliveryAbove: rupeesToPaise(2999),
      codEnabled: true,
      codAdvancePercent: 50,
      currency: "INR",
      instagramUrl: "https://instagram.com/zenvy",
    })
    .onConflictDoUpdate({
      target: settings.id,
      set: {
        storeName: "Zenvy",
        storeEmail: "hello@zenvy.com",
        instagramUrl: "https://instagram.com/zenvy",
      },
    });

  // ---- Admin user ----
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@zenvy.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeThisPassword123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db
    .insert(adminUsers)
    .values({
      name: "Store Owner",
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    })
    .onConflictDoNothing();

  // ---- Categories ----
  // Images are generated locally (see scripts/placeholder-image.ts) rather
  // than hotlinked from an external CDN — the earlier version referenced
  // specific Unsplash photo IDs that were never actually verified as live
  // (this build sandbox can't reach images.unsplash.com to check), and one
  // of them turned out to be dead, breaking the homepage hero and the
  // Women's Collection card. These placeholders always render, on any
  // network, and are trivially replaced with real photos via the admin
  // panel's image upload.
  const categoryDefs: { name: string; slug: string; sortOrder: number; palette: "ivory" | "charcoal" | "forest" | "burgundy" }[] = [
    { name: "Women's Collection", slug: "womens-collection", sortOrder: 1, palette: "burgundy" },
    { name: "Men's Collection", slug: "mens-collection", sortOrder: 2, palette: "charcoal" },
    { name: "Pakistani Dresses", slug: "pakistani-dresses", sortOrder: 3, palette: "burgundy" },
    { name: "Kashmiri Collection", slug: "kashmiri-collection", sortOrder: 4, palette: "forest" },
    { name: "Shawls & Dupattas", slug: "shawls-dupattas", sortOrder: 5, palette: "ivory" },
    { name: "New Arrivals", slug: "new-arrivals", sortOrder: 6, palette: "forest" },
  ];
  const categoryIds: Record<string, string> = {};
  for (const c of categoryDefs) {
    const imageUrl = await saveSeedImage(`category-${c.slug}`, {
      title: c.name,
      subtitle: "Zenvy",
      palette: c.palette,
      width: 600,
      height: 800,
    });
    const [row] = await db
      .insert(categories)
      .values({ name: c.name, slug: c.slug, sortOrder: c.sortOrder, isEnabled: true, imageUrl })
      .onConflictDoNothing()
      .returning();
    if (row) categoryIds[c.slug] = row.id;
  }
  // re-fetch in case of conflict-skip so ids are always populated
  const allCats = await db.select().from(categories);
  for (const c of allCats) categoryIds[c.slug] = c.id;

  type Demo = {
    name: string;
    slug: string;
    sku: string;
    category: string;
    gender: "WOMEN" | "MEN" | "UNISEX";
    collection: string;
    price: number;
    salePrice?: number;
    fabric: string;
    description: string;
    short: string;
    imageCount: number;
    palette: "ivory" | "charcoal" | "forest" | "burgundy";
    sizes: string[];
    colors: string[];
    stock: number;
    flags: Partial<{
      isFeatured: boolean;
      isTrending: boolean;
      isBestseller: boolean;
      isNewArrival: boolean;
    }>;
  };

  const demoProducts: Demo[] = [
    {
      name: "Kashmiri Embroidered Kurta",
      slug: "kashmiri-embroidered-kurta",
      sku: "PF-KEK-001",
      category: "kashmiri-collection",
      gender: "WOMEN",
      collection: "Kashmiri",
      palette: "forest",
      price: rupeesToPaise(3499),
      salePrice: rupeesToPaise(2799),
      fabric: "Pure Cotton with Tilla embroidery",
      description:
        "A hand-embroidered Kashmiri kurta featuring traditional Tilla work along the neckline and sleeves. Crafted from breathable cotton, tailored for an elegant, relaxed silhouette that carries centuries of Kashmiri craft into modern everyday wear.",
      short: "Hand-embroidered Tilla work kurta in breathable cotton.",
      imageCount: 2,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Maroon", "Emerald"],
      stock: 12,
      flags: { isFeatured: true, isBestseller: true },
    },
    {
      name: "Kashmiri Pheran",
      slug: "kashmiri-pheran",
      sku: "PF-KPH-002",
      category: "kashmiri-collection",
      gender: "WOMEN",
      collection: "Kashmiri",
      palette: "forest",
      price: rupeesToPaise(4999),
      fabric: "Wool blend with hand embroidery",
      description:
        "A contemporary take on the traditional Kashmiri Pheran, cut for modern layering while preserving the flowing silhouette and intricate hand embroidery Kashmir is known for. Perfect for the winter season.",
      short: "Traditional Pheran silhouette with hand embroidery, modern cut.",
      imageCount: 1,
      sizes: ["M", "L", "XL"],
      colors: ["Charcoal", "Wine"],
      stock: 8,
      flags: { isTrending: true, isNewArrival: true },
    },
    {
      name: "Kashmiri Pashmina Shawl",
      slug: "kashmiri-pashmina-shawl",
      sku: "PF-KPS-003",
      category: "shawls-dupattas",
      gender: "UNISEX",
      collection: "Kashmiri",
      palette: "forest",
      price: rupeesToPaise(6999),
      fabric: "100% Pashmina wool",
      description:
        "An heirloom-quality Pashmina shawl, hand-woven in Kashmir with fine Sozni embroidery along the borders. Lightweight, warm, and softer with every wear — a piece meant to last generations.",
      short: "Hand-woven Pashmina with Sozni embroidered borders.",
      imageCount: 1,
      sizes: ["Free Size"],
      colors: ["Ivory", "Deep Blue"],
      stock: 15,
      flags: { isFeatured: true, isBestseller: true },
    },
    {
      name: "Pakistani Lawn Suit",
      slug: "pakistani-lawn-suit",
      sku: "PF-PLS-004",
      category: "pakistani-dresses",
      gender: "WOMEN",
      collection: "Pakistani",
      palette: "burgundy",
      price: rupeesToPaise(2999),
      salePrice: rupeesToPaise(2399),
      fabric: "Premium Lawn cotton, 3-piece",
      description:
        "A three-piece Pakistani lawn suit with digital floral print, matching dupatta and trouser. Designed for effortless summer elegance with breathable, lightweight fabric throughout.",
      short: "3-piece digital print lawn suit with matching dupatta.",
      imageCount: 1,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Peach", "Sky Blue", "Lilac"],
      stock: 20,
      flags: { isTrending: true, isNewArrival: true },
    },
    {
      name: "Pakistani Embroidered Suit",
      slug: "pakistani-embroidered-suit",
      sku: "PF-PES-005",
      category: "pakistani-dresses",
      gender: "WOMEN",
      collection: "Pakistani",
      palette: "burgundy",
      price: rupeesToPaise(5499),
      fabric: "Chiffon with thread & sequin embroidery",
      description:
        "A statement Pakistani embroidered suit in fine chiffon, finished with dense thread and sequin embroidery on the bodice. Ideal for festive occasions and evening gatherings.",
      short: "Festive chiffon suit with sequin & thread embroidery.",
      imageCount: 1,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "Burgundy"],
      stock: 6,
      flags: { isFeatured: true },
    },
    {
      name: "Men's Pakistani Kurta",
      slug: "mens-pakistani-kurta",
      sku: "PF-MPK-006",
      category: "mens-collection",
      gender: "MEN",
      collection: "Pakistani",
      palette: "burgundy",
      price: rupeesToPaise(2199),
      fabric: "Cotton Blend",
      description:
        "A tailored men's Pakistani kurta in soft cotton blend, featuring a classic mandarin collar and subtle side slits. Pairs effortlessly with churidar or straight trousers for both daily wear and festive occasions.",
      short: "Tailored mandarin-collar kurta in cotton blend.",
      imageCount: 1,
      sizes: ["M", "L", "XL", "XXL"],
      colors: ["White", "Beige", "Navy"],
      stock: 25,
      flags: { isBestseller: true },
    },
    {
      name: "Men's Kashmiri Waistcoat",
      slug: "mens-kashmiri-waistcoat",
      sku: "PF-MKW-007",
      category: "mens-collection",
      gender: "MEN",
      collection: "Kashmiri",
      palette: "forest",
      price: rupeesToPaise(2799),
      fabric: "Wool blend with hand embroidery",
      description:
        "A refined Kashmiri waistcoat with hand-embroidered detailing on the front panels, designed to layer over kurtas for weddings and festive events with an unmistakably Kashmiri identity.",
      short: "Hand-embroidered Kashmiri waistcoat for festive layering.",
      imageCount: 1,
      sizes: ["M", "L", "XL"],
      colors: ["Black", "Maroon"],
      stock: 10,
      flags: { isNewArrival: true },
    },
    {
      name: "Embroidered Dupatta",
      slug: "embroidered-dupatta",
      sku: "PF-EMD-008",
      category: "shawls-dupattas",
      gender: "WOMEN",
      collection: "Kashmiri",
      palette: "forest",
      price: rupeesToPaise(1499),
      fabric: "Chiffon with Aari embroidery",
      description:
        "A lightweight chiffon dupatta finished with delicate Aari embroidery along the edges — the perfect finishing layer for both Kashmiri and Pakistani suits alike.",
      short: "Aari-embroidered chiffon dupatta, edge-to-edge detailing.",
      imageCount: 1,
      sizes: ["Free Size"],
      colors: ["Rose", "Mint", "Gold"],
      stock: 30,
      flags: {},
    },
    {
      name: "Premium Women's Suit",
      slug: "premium-womens-suit",
      sku: "PF-PWS-009",
      category: "womens-collection",
      gender: "WOMEN",
      collection: "Pakistani",
      palette: "burgundy",
      price: rupeesToPaise(7499),
      salePrice: rupeesToPaise(6299),
      fabric: "Raw silk, 3-piece with dupatta",
      description:
        "An occasion-ready three-piece suit in raw silk, with heavy zari border work and a matching embroidered dupatta. Designed for weddings, receptions, and milestone celebrations.",
      short: "Occasion-wear raw silk suit with zari border work.",
      imageCount: 1,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Gold", "Deep Green"],
      stock: 5,
      flags: { isFeatured: true, isTrending: true },
    },
  ];

  for (const p of demoProducts) {
    const catId = categoryIds[p.category];
    if (!catId) continue;

    const productRowResult = await db
      .insert(products)
      .values({
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.short,
        sku: p.sku,
        gender: p.gender,
        collection: p.collection,
        fabric: p.fabric,
        careInstructions: "Dry clean recommended. Store folded in a cool, dry place.",
        price: p.price,
        salePrice: p.salePrice ?? null,
        categoryId: catId,
        tags: [p.collection, p.gender, ...p.colors].join(",").toLowerCase(),
        seoTitle: `${p.name} | Pakeeza Fashion`,
        seoDesc: p.short,
        isFeatured: p.flags.isFeatured ?? false,
        isTrending: p.flags.isTrending ?? false,
        isBestseller: p.flags.isBestseller ?? false,
        isNewArrival: p.flags.isNewArrival ?? false,
        isPublished: true,
      })
      .onConflictDoNothing()
      .returning();
    const productRow = productRowResult[0];

    if (!productRow) continue;

    for (let idx = 0; idx < p.imageCount; idx++) {
      const url = await saveSeedImage(`product-${p.slug}-${idx + 1}`, {
        title: p.name,
        subtitle: idx === 0 ? p.collection : `${p.collection} — Detail`,
        palette: p.palette,
      });
      await db.insert(productImages).values({
        productId: productRow.id,
        url,
        altText: p.name,
        sortOrder: idx,
        isThumbnail: idx === 0,
      });
    }

    let variantIdx = 0;
    for (const size of p.sizes) {
      for (const color of p.colors) {
        variantIdx += 1;
        await db.insert(productVariants)
          .values({
            productId: productRow.id,
            size,
            color,
            sku: `${p.sku}-${variantIdx}`,
            stock: p.stock,
            lowStockThreshold: 5,
          })
          .onConflictDoNothing();
      }
    }

    // one seeded review per product for a realistic homepage
    await db.insert(reviews)
      .values({
        productId: productRow.id,
        customerName: "Verified Customer",
        rating: 5,
        title: "Beautiful quality",
        body: `The ${p.name} exceeded expectations — fabric and stitching feel genuinely premium.`,
        isVerifiedPurchase: true,
        isApproved: true,
        isFeatured: p.flags.isFeatured ?? false,
      });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / (password from SEED_ADMIN_PASSWORD)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
