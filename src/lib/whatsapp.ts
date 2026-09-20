import { formatPaise } from "./money";

export interface WhatsappOrderItem {
  name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unitPrice: number; // paise
  lineTotal: number; // paise
}

export interface WhatsappOrderPayload {
  storeName: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  area?: string | null;
  city: string;
  district?: string | null;
  state: string;
  pincode: string;
  deliveryInstructions?: string | null;
  items: WhatsappOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountTotal: number;
  total: number;
  orderType: "STANDARD" | "COD";
  codAdvancePercent?: number | null;
  advanceAmount?: number | null;
  remainingAmount?: number | null;
  currency: string;
}

/**
 * Builds the human-readable order summary sent to WhatsApp. This text is
 * generated entirely from server-trusted order data (never client input),
 * and is stored on the Order row for audit/reprint.
 */
export function buildWhatsappMessage(p: WhatsappOrderPayload): string {
  const fmt = (paise: number) => formatPaise(paise, p.currency);
  const addressParts = [p.addressLine, p.area, p.city, p.district, p.state, p.pincode]
    .filter(Boolean)
    .join(", ");

  const lines: string[] = [];
  lines.push(`${p.storeName} — New Order`);
  lines.push("");
  lines.push(`Order ID: ${p.orderNumber}`);
  lines.push("");
  lines.push("Customer:");
  lines.push(`Name: ${p.customerName}`);
  lines.push(`Phone: ${p.customerPhone}`);
  lines.push(`Address: ${addressParts}`);
  if (p.deliveryInstructions) lines.push(`Notes: ${p.deliveryInstructions}`);
  lines.push("");
  lines.push("Items:");
  p.items.forEach((item, i) => {
    const variant = [item.size ? `Size: ${item.size}` : null, item.color ? `Color: ${item.color}` : null]
      .filter(Boolean)
      .join(", ");
    lines.push(`${i + 1}. ${item.name}`);
    if (variant) lines.push(`   ${variant}`);
    lines.push(`   Qty: ${item.quantity}`);
    lines.push(`   Price: ${fmt(item.unitPrice)}${item.quantity > 1 ? ` (Line total: ${fmt(item.lineTotal)})` : ""}`);
  });
  lines.push("");
  lines.push(`Subtotal: ${fmt(p.subtotal)}`);
  if (p.discountTotal > 0) lines.push(`Discount: -${fmt(p.discountTotal)}`);
  lines.push(`Delivery: ${p.deliveryFee > 0 ? fmt(p.deliveryFee) : "Free"}`);
  lines.push(`Total: ${fmt(p.total)}`);
  lines.push("");
  lines.push(`Order Type: ${p.orderType === "COD" ? "Cash on Delivery" : "Standard Order"}`);

  if (p.orderType === "COD" && p.advanceAmount != null && p.remainingAmount != null) {
    lines.push("");
    lines.push(`Advance Required (${p.codAdvancePercent}%): ${fmt(p.advanceAmount)}`);
    lines.push(`Remaining COD Amount: ${fmt(p.remainingAmount)}`);
  }

  lines.push("");
  lines.push("Please confirm my order.");
  lines.push("(Payment will be confirmed directly on WhatsApp — nothing has been charged yet.)");

  return lines.join("\n");
}

/** Builds a wa.me click-to-chat URL. `phoneDigits` = country code + number, digits only. */
export function buildWhatsappUrl(phoneDigits: string, message: string): string {
  const cleanPhone = phoneDigits.replace(/[^\d]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
