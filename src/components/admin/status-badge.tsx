const colorMap: Record<string, string> = {
  PENDING: "bg-charcoal/10 text-charcoal",
  WHATSAPP_CONTACTED: "bg-blue-100 text-blue-800",
  AWAITING_ADVANCE: "bg-amber-100 text-amber-800",
  ADVANCE_RECEIVED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-forest/10 text-forest",
  PROCESSING: "bg-forest/10 text-forest",
  SHIPPED: "bg-forest/10 text-forest",
  OUT_FOR_DELIVERY: "bg-forest/10 text-forest",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-burgundy/10 text-burgundy",
  RETURNED: "bg-burgundy/10 text-burgundy",
  UNPAID: "bg-charcoal/10 text-charcoal",
  ADVANCE_PENDING: "bg-amber-100 text-amber-800",
  FULLY_PAID: "bg-green-100 text-green-800",
  REFUNDED: "bg-burgundy/10 text-burgundy",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${colorMap[value] ?? "bg-charcoal/10 text-charcoal"}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
