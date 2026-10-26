import { inr } from "./format";
import type { Order, StoreSettings } from "./types";

/** The store's home area — Nimbahera, Rajasthan. */
export const STORE_AREA_LABEL = "312601 · Nimbahera, Rajasthan";
export const STORE_CITY_LABEL = "Nimbahera, Rajasthan";
export const DEFAULT_SERVICEABLE_PINCODES = "312601";

/** Fallback delivery choices when the settings row has none yet. */
export const DEFAULT_DELIVERY_OPTIONS = [
  "Instant · within 30 minutes",
  "Within 1–2 hours",
  "9:00 AM – 11:00 AM",
  "11:00 AM – 1:00 PM",
  "1:00 PM – 3:00 PM",
  "3:00 PM – 5:00 PM",
  "5:00 PM – 7:00 PM",
  "7:00 PM – 9:00 PM",
];

/** First 6-digit PIN code found in an address, if any. */
export function extractPincode(address: string): string | null {
  const match = address.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

/** Split the admin's comma/space/newline separated PIN code string into a clean list. */
export function parsePincodes(value: string | null | undefined): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  );
}

/** PIN codes currently allowed at checkout. */
export function serviceablePincodes(settings: StoreSettings): string[] {
  const list = parsePincodes(settings.serviceable_pincodes).filter((code) => /^\d{6}$/.test(code));
  return list.length > 0 ? list : [DEFAULT_SERVICEABLE_PINCODES];
}

/** Delivery time choices offered at checkout. */
export function deliveryOptions(settings: StoreSettings): string[] {
  const list = (settings.delivery_options ?? [])
    .map((label) => label.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_DELIVERY_OPTIONS;
}

/**
 * Plain-text block the admin copies and hands to the delivery person:
 * who, where, when, what to collect — everything for a COD drop-off.
 */
export function deliveryHandoffText(order: Order): string {
  const lines: string[] = [
    `DELIVERY · ${order.order_number}`,
    `Name: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address.replace(/\s+/g, " ").trim()}`,
  ];
  if (order.delivery_slot) lines.push(`Deliver by: ${order.delivery_slot}`);
  lines.push("", "Items:");
  for (const item of order.order_items ?? []) {
    lines.push(`• ${item.quantity} × ${item.name} (${item.unit}) — ${inr(item.price * item.quantity)}`);
  }
  lines.push("", `Payment: Cash on delivery`);
  lines.push(`Collect ${inr(order.total)} from the customer`);
  if (order.discount > 0) {
    lines.push(
      `(subtotal ${inr(order.subtotal)} − discount ${inr(order.discount)} + delivery ${
        order.delivery_fee === 0 ? "free" : inr(order.delivery_fee)
      })`,
    );
  }
  if (order.notes) lines.push(`Notes: ${order.notes}`);
  return lines.join("\n");
}
