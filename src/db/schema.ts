/**
 * Zenvy — database schema (Drizzle ORM, SQLite dialect).
 *
 * This runs on SQLite for the local/demo build so the whole app works with
 * zero external services. It is deliberately written to be Postgres-portable:
 *   - all ids are text (cuid-style), not sqlite autoincrement rowids
 *   - money is stored as an integer number of paise (never float)
 *   - "enums" are plain text columns constrained by Zod at the app layer,
 *     which maps directly onto a Postgres `pgEnum` later
 *   - timestamps are stored as integers (unix ms) via `{ mode: "timestamp" }`
 *
 * See README "Deploying to Postgres" for the swap: replace the
 * `drizzle-orm/better-sqlite3` import + column helpers with
 * `drizzle-orm/node-postgres` + `pgTable`, keep every column name and shape
 * identical, and point DATABASE_URL at Postgres.
 */
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@/lib/id";

const id = () => text("id").primaryKey().$defaultFn(createId);
const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

// ---------- Admin / Auth ----------

export const adminUsers = sqliteTable("admin_users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["SUPER_ADMIN", "MANAGER"] }).notNull().default("MANAGER"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  ...timestamps,
}, (t) => ({
  emailIdx: uniqueIndex("admin_users_email_idx").on(t.email),
}));

export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  actorId: text("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  entityIdx: index("audit_logs_entity_idx").on(t.entity, t.entityId),
  createdIdx: index("audit_logs_created_idx").on(t.createdAt),
}));

// ---------- Catalog ----------

export const categories = sqliteTable("categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
}, (t) => ({
  slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
  parentIdx: index("categories_parent_idx").on(t.parentId),
}));

export const products = sqliteTable("products", {
  id: id(),
  name: text("name").notNull(),
  brand: text("brand"),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  sku: text("sku").notNull(),
  gender: text("gender", { enum: ["WOMEN", "MEN", "UNISEX"] }).notNull().default("UNISEX"),
  collection: text("collection"),
  fabric: text("fabric"),
  careInstructions: text("care_instructions"),

  price: integer("price").notNull(), // paise
  salePrice: integer("sale_price"), // paise

  categoryId: text("category_id").notNull().references(() => categories.id),

  tags: text("tags"),
  seoTitle: text("seo_title"),
  seoDesc: text("seo_desc"),

  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  isTrending: integer("is_trending", { mode: "boolean" }).notNull().default(false),
  isBestseller: integer("is_bestseller", { mode: "boolean" }).notNull().default(false),
  isNewArrival: integer("is_new_arrival", { mode: "boolean" }).notNull().default(false),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),

  ...timestamps,
}, (t) => ({
  slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
  skuIdx: uniqueIndex("products_sku_idx").on(t.sku),
  categoryIdx: index("products_category_idx").on(t.categoryId),
  publishedIdx: index("products_published_idx").on(t.isPublished),
  collectionIdx: index("products_collection_idx").on(t.collection),
}));

export const productImages = sqliteTable("product_images", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isThumbnail: integer("is_thumbnail", { mode: "boolean" }).notNull().default(false),
}, (t) => ({
  productIdx: index("product_images_product_idx").on(t.productId),
}));

export const productVariants = sqliteTable("product_variants", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  size: text("size"),
  color: text("color"),
  sku: text("sku").notNull(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
}, (t) => ({
  skuIdx: uniqueIndex("product_variants_sku_idx").on(t.sku),
  productIdx: index("product_variants_product_idx").on(t.productId),
  comboIdx: uniqueIndex("product_variants_combo_idx").on(t.productId, t.size, t.color),
}));

// ---------- Customers & Orders ----------

export const customers = sqliteTable("customers", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email"),
  addressLine: text("address_line").notNull(),
  area: text("area"),
  city: text("city").notNull(),
  district: text("district"),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  notes: text("notes"),
  ...timestamps,
}, (t) => ({
  phoneIdx: index("customers_phone_idx").on(t.phone),
}));

export const orders = sqliteTable("orders", {
  id: id(),
  orderNumber: text("order_number").notNull(),
  customerId: text("customer_id").notNull().references(() => customers.id),

  deliveryInstructions: text("delivery_instructions"),

  orderType: text("order_type", { enum: ["STANDARD", "COD"] }).notNull(),
  status: text("status", {
    enum: [
      "PENDING", "WHATSAPP_CONTACTED", "AWAITING_ADVANCE", "ADVANCE_RECEIVED",
      "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
      "CANCELLED", "RETURNED",
    ],
  }).notNull().default("PENDING"),
  paymentStatus: text("payment_status", {
    enum: ["UNPAID", "ADVANCE_PENDING", "ADVANCE_RECEIVED", "FULLY_PAID", "REFUNDED"],
  }).notNull().default("UNPAID"),

  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  discountTotal: integer("discount_total").notNull().default(0),
  total: integer("total").notNull(),

  codAdvancePercent: integer("cod_advance_percent"),
  advanceAmount: integer("advance_amount"),
  remainingAmount: integer("remaining_amount"),

  whatsappMessage: text("whatsapp_message").notNull(),
  adminNotes: text("admin_notes"),

  ...timestamps,
}, (t) => ({
  orderNumberIdx: uniqueIndex("orders_order_number_idx").on(t.orderNumber),
  statusIdx: index("orders_status_idx").on(t.status),
  paymentStatusIdx: index("orders_payment_status_idx").on(t.paymentStatus),
  createdIdx: index("orders_created_idx").on(t.createdAt),
}));

export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  variantId: text("variant_id").notNull().references(() => productVariants.id),

  nameSnapshot: text("name_snapshot").notNull(),
  sizeSnapshot: text("size_snapshot"),
  colorSnapshot: text("color_snapshot"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
}, (t) => ({
  orderIdx: index("order_items_order_idx").on(t.orderId),
  productIdx: index("order_items_product_idx").on(t.productId),
}));

// ---------- Reviews ----------

export const reviews = sqliteTable("reviews", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  isVerifiedPurchase: integer("is_verified_purchase", { mode: "boolean" }).notNull().default(false),
  isApproved: integer("is_approved", { mode: "boolean" }).notNull().default(false),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  productIdx: index("reviews_product_idx").on(t.productId),
  approvedIdx: index("reviews_approved_idx").on(t.isApproved),
}));

// Atomic per-year counter backing order numbers (PF-2026-000123). Incrementing
// this inside the same transaction as order creation keeps numbers gap-free
// and safe under concurrent writes.
export const orderCounters = sqliteTable("order_counters", {
  year: integer("year").primaryKey(),
  sequence: integer("sequence").notNull().default(0),
});

// Newsletter subscribers — minimal, no third-party ESP wired up yet (see
// README). Kept schema-shaped so a real provider (Mailchimp/Resend/etc) can
// sync from this table later without a data-model change.
export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: id(),
  email: text("email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  emailIdx: uniqueIndex("newsletter_subscribers_email_idx").on(t.email),
}));

// ---------- Settings (singleton row, id = "singleton") ----------

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default("singleton"),
  storeName: text("store_name").notNull().default("Zenvy"),
  tagline: text("tagline").notNull().default("Where Heritage Meets Modern Elegance"),
  whatsappNumber: text("whatsapp_number").notNull(),
  storePhone: text("store_phone"),
  storeEmail: text("store_email"),
  storeAddress: text("store_address"),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  freeDeliveryAbove: integer("free_delivery_above"),
  codEnabled: integer("cod_enabled", { mode: "boolean" }).notNull().default(true),
  codAdvancePercent: integer("cod_advance_percent").notNull().default(50),
  currency: text("currency").notNull().default("INR"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Relations (for Drizzle relational query API) ----------

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
  reviews: many(reviews),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(adminUsers, { fields: [auditLogs.actorId], references: [adminUsers.id] }),
}));
