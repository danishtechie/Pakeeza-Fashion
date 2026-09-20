import { z } from "zod";

// Indian mobile numbers: allow optional +91, 10 digits starting 6-9
const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const customerInfoSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  mobile: z.string().trim().regex(phoneRegex, "Enter a valid 10-digit mobile number"),
  whatsapp: z.string().trim().regex(phoneRegex, "Enter a valid WhatsApp number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  addressLine: z.string().trim().min(5, "Enter your full address").max(300),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(pincodeRegex, "Enter a valid 6-digit PIN code"),
  deliveryInstructions: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createOrderSchema = z.object({
  customer: customerInfoSchema,
  items: z.array(cartItemSchema).min(1, "Your bag is empty"),
  orderType: z.enum(["STANDARD", "COD"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CustomerInfoInput = z.infer<typeof customerInfoSchema>;
