import { z } from "zod";

export const variantInputSchema = z.object({
  id: z.string().optional(), // present when editing an existing variant
  size: z.string().trim().max(30).optional().or(z.literal("")),
  color: z.string().trim().max(30).optional().or(z.literal("")),
  sku: z.string().trim().min(1).max(60),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000).default(5),
});

export const imageInputSchema = z.object({
  url: z.string().min(1),
  altText: z.string().max(200).optional().or(z.literal("")),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens only"),
  description: z.string().trim().min(10).max(5000),
  shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
  sku: z.string().trim().min(1).max(60),
  gender: z.enum(["WOMEN", "MEN", "UNISEX"]),
  collection: z.string().trim().max(60).optional().or(z.literal("")),
  fabric: z.string().trim().max(200).optional().or(z.literal("")),
  careInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
  price: z.coerce.number().int().min(1, "Price must be at least ₹0.01 (1 paise)").max(100_000_000),
  salePrice: z.coerce.number().int().min(0).max(100_000_000).optional(),
  categoryId: z.string().min(1, "Select a category"),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDesc: z.string().trim().max(300).optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  images: z.array(imageInputSchema).max(12).default([]),
  variants: z.array(variantInputSchema).min(1, "Add at least one size/color variant"),
}).superRefine((data, ctx) => {
  if (data.salePrice != null && data.salePrice > 0 && data.salePrice >= data.price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["salePrice"], message: "Sale price must be lower than the regular price" });
  }
});

export type ProductInput = z.infer<typeof productInputSchema>;
