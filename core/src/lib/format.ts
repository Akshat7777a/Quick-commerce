export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function inr(value: number | null | undefined) {
  const amount = Number(value ?? 0);
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(Number.isFinite(amount) ? amount : 0),
  )}`;
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const ORDER_STATUS: Record<
  string,
  { label: string; description: string; tone: string }
> = {
  placed: {
    label: "Placed",
    description: "We received your order",
    tone: "bg-gold/15 text-[#8a6415] border-gold/30",
  },
  packed: {
    label: "Packed",
    description: "Your basket is packed",
    tone: "bg-forest/10 text-forest border-forest/20",
  },
  out_for_delivery: {
    label: "On the way",
    description: "Out for delivery",
    tone: "bg-[#e8f0ec] text-forest border-forest/20",
  },
  delivered: {
    label: "Delivered",
    description: "Handed over at your door",
    tone: "bg-[#e6f2e9] text-[#1c6b3f] border-[#1c6b3f]/20",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order was cancelled",
    tone: "bg-[#f6e7e2] text-clay border-clay/20",
  },
};

export const ORDER_STATUS_FLOW = ["placed", "packed", "out_for_delivery", "delivered"] as const;

export function discountPercent(price: number, mrp: number | null | undefined) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
