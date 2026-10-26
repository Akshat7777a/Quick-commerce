import { useEffect, useState, type FormEvent } from "react";
import { readJSON, removeKey, writeJSON } from "../lib/storage";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
} from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import {
  STORE_CITY_LABEL,
  deliveryOptions,
  extractPincode,
  serviceablePincodes,
} from "../lib/delivery";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { inr } from "../lib/format";
import { EmptyState, ProductImage, Spinner } from "../components/ui";
import { PatchSlot, runPatchHooks } from "../lib/patch-loader";
import type { PlaceOrderResult } from "../lib/types";

/** Half-filled delivery details survive a reload or a discarded background tab. */
const DRAFT_KEY = "lmart.checkout.draft.v1";
type Draft = { name?: string; phone?: string; address?: string; notes?: string; slot?: string };

export function Checkout() {
  const { user, profile, loading: authLoading } = useAuth();
  const {
    items,
    subtotal,
    discount,
    deliveryFee,
    total,
    coupon,
    couponBusy,
    applyCoupon,
    removeCoupon,
    clear,
  } = useCart();
  const { settings } = useStoreSettings();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(() => readJSON<Draft>(DRAFT_KEY)?.name ?? "");
  const [phone, setPhone] = useState(() => readJSON<Draft>(DRAFT_KEY)?.phone ?? "");
  const [address, setAddress] = useState(() => readJSON<Draft>(DRAFT_KEY)?.address ?? "");
  const [notes, setNotes] = useState(() => readJSON<Draft>(DRAFT_KEY)?.notes ?? "");
  const [code, setCode] = useState("");
  const [slot, setSlot] = useState(() => readJSON<Draft>(DRAFT_KEY)?.slot ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlaceOrderResult | null>(null);

  // The draft is saved as the customer types, so a reload, a switch to another
  // tab, or a browser-discarded background tab comes back exactly as left.
  useEffect(() => {
    writeJSON(DRAFT_KEY, { name, phone, address, notes, slot } satisfies Draft);
  }, [name, phone, address, notes, slot]);
  const pinList = serviceablePincodes(settings);
  const slotOptions = deliveryOptions(settings);
  const chosenSlot = slot || slotOptions[0] || "";

  useEffect(() => {
    if (profile) {
      setName((current) => current || profile.full_name || "");
      setPhone((current) => current || profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    api
      .listOrders(user.id)
      .then((rows) => {
        const last = rows[0];
        if (last?.address) setAddress((current) => current || last.address);
      })
      .catch(() => undefined);
  }, [user]);

  if (authLoading) {
    return (
      <div className="container-page flex justify-center py-24">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?next=/checkout" replace />;

  if (result) {
    return (
      <div className="container-page py-12 sm:py-20">
        <div className="mx-auto max-w-xl overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-soft">
          <div className="bg-forest px-7 py-9 text-cream sm:px-9">
            <CheckCircle2 className="size-8 text-gold" strokeWidth={1.5} />
            <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-cream/60">Order confirmed</p>
            <h1 className="mt-2 text-4xl leading-none">Thank you, {name.split(" ")[0] || "friend"}.</h1>
            <p className="mt-3 text-[12.5px] leading-relaxed text-cream/70">
              We&apos;re packing your basket now. Keep {inr(result.total)} ready in cash for delivery.
            </p>
          </div>
          <div className="px-7 py-6 sm:px-9">
            <dl className="space-y-3 text-[12.5px]">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Order number</dt>
                <dd className="font-semibold tracking-wide text-ink">{result.order_number}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Payment</dt>
                <dd className="flex items-center gap-1.5 text-ink">
                  <Banknote className="size-3.5 text-forest" /> Cash on delivery
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Amount due</dt>
                <dd className="price text-base font-semibold text-ink">{inr(result.total)}</dd>
              </div>
              <div className="flex items-start justify-between gap-6">
                <dt className="shrink-0 text-ink-soft">Delivering to</dt>
                <dd className="text-right leading-relaxed text-ink">{address}</dd>
              </div>
              <div className="flex items-start justify-between gap-6">
                <dt className="shrink-0 text-ink-soft">Delivery time</dt>
                <dd className="text-right leading-relaxed text-ink">{chosenSlot}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="btn btn-primary flex-1"
              >
                View your orders
              </button>
              <button
                type="button"
                onClick={() => navigate("/shop")}
                className="btn btn-secondary flex-1"
              >
                Keep shopping
              </button>
            </div>
            <p className="mt-4 text-center text-[10.5px] leading-relaxed text-ink-soft">
              {settings.delivery_estimate} · We&apos;ll call {phone} if we need to check anything.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-14">
        <EmptyState
          icon={<ShoppingBag className="size-5" />}
          title="Your basket is empty"
          description="Add a few essentials before checking out — we'll keep them here for you."
          action={
            <Link to="/shop" className="btn btn-primary">
              Browse the shelves
            </Link>
          }
        />
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 2) return setError("Please add the name for this delivery.");
    if (digits.length < 10) return setError("Please enter a valid phone number.");
    if (address.trim().length < 10) return setError("Please add a complete delivery address.");
    const pin = extractPincode(address);
    if (!pin) return setError("Please add a 6-digit PIN code to your delivery address.");
    if (!pinList.includes(pin)) {
      return setError(
        `We currently deliver only to PIN ${pinList.join(", ")} — our store is in ${STORE_CITY_LABEL}. Please update the address.`,
      );
    }
    if (!chosenSlot) return setError("Please choose a delivery time.");

    setBusy(true);
    try {
      // Patches get a veto before the order is created (blocking: a throw
      // aborts the submit; the message lands in the normal error box).
      try {
        await runPatchHooks("before-checkout", {
          items,
          total,
          phone: phone.trim(),
          address: address.trim(),
          slot: chosenSlot,
        }, { blocking: true });
      } catch (hookError) {
        const message = hookError instanceof Error ? hookError.message : "We couldn't check that order.";
        return setError(message);
      }
      const placed = await api.placeOrder(
        {
          items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
          customerName: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim() || undefined,
          coupon: coupon?.code ?? null,
          deliverySlot: chosenSlot,
        },
        user.id,
      );
      setResult(placed);
      clear();
      removeKey(DRAFT_KEY); // placed: the half-filled form no longer applies
      toast("Order placed — cash on delivery");
      window.scrollTo({ top: 0, behavior: "smooth" });
      await runPatchHooks("after-checkout", { order: placed });
    } catch (caught) {
      setError(errorMessage(caught, "We couldn't place your order. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const apply = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    try {
      const check = await applyCoupon(code.trim());
      toast(check.message, check.valid ? "success" : "error");
      if (check.valid) setCode("");
    } catch {
      toast("We couldn't check that coupon. Please try again.", "error");
    }
  };

  return (
    <div className="container-page pt-8 sm:pt-12">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">Checkout</p>
        <h1 className="text-4xl leading-tight text-ink sm:text-5xl">Almost at your door.</h1>
        <p className="max-w-lg text-[13px] leading-relaxed text-ink-soft">
          Tell us where to bring the basket. You pay in cash when it arrives — no card details needed.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 grid gap-8 pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <MapPin className="size-4 text-forest" />
              <h2 className="text-xl text-ink">Delivery details</h2>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-clay/20 bg-clay/[0.06] px-3.5 py-2.5 text-[12px] leading-relaxed text-clay"
              >
                {error}
              </p>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Full name</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Ananya Rao"
                  className="input"
                />
              </label>
              <label className="block">
                <span className="label">Phone number</span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className="input"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Delivery address</span>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  autoComplete="street-address"
                  placeholder="Flat, building, street, landmark, city, pincode"
                  className="input resize-none leading-relaxed"
                />
                {(() => {
                  const pin = extractPincode(address);
                  const outside = pin !== null && !pinList.includes(pin);
                  if (outside) {
                    return (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-clay">
                        We don't deliver to PIN {pin} yet. We currently serve PIN{" "}
                        {pinList.join(", ")} ({STORE_CITY_LABEL}).
                      </p>
                    );
                  }
                  return (
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-soft">
                      {pin ? `PIN ${pin} — ` : ""}We deliver to PIN {pinList.join(", ")} · {STORE_CITY_LABEL}.
                    </p>
                  );
                })()}
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Notes for the shop (optional)</span>
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ring the bell twice, leave at the gate…"
                  className="input"
                />
              </label>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <Clock3 className="size-4 text-forest" />
              <h2 className="text-xl text-ink">Delivery time</h2>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
              Choose when the basket should arrive — we'll work to that slot.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {slotOptions.map((option) => {
                const active = chosenSlot === option;
                return (
                  <label
                    key={option}
                    className={
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition " +
                      (active
                        ? "border-forest bg-forest/[0.05]"
                        : "border-line hover:border-ink/30")
                    }
                  >
                    <input
                      type="radio"
                      name="delivery-slot"
                      className="sr-only"
                      checked={active}
                      onChange={() => setSlot(option)}
                    />
                    <span
                      className={
                        "grid size-4 shrink-0 place-items-center rounded-full border-2 " +
                        (active ? "border-forest" : "border-ink-soft/50")
                      }
                    >
                      {active && <span className="size-2 rounded-full bg-forest" />}
                    </span>
                    <span className="text-[12.5px] leading-snug text-ink">{option}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <Banknote className="size-4 text-forest" />
              <h2 className="text-xl text-ink">Payment</h2>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-forest/20 bg-forest/[0.04] px-4 py-3.5">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 border-forest">
                <span className="size-2 rounded-full bg-forest" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">Cash on delivery</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-soft">
                  Keep {inr(total)} ready. Our delivery partner collects the exact amount at your door.
                </p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-ink-soft">
              <ShieldCheck className="size-3.5 text-forest" />
              No online payment is taken at any point.
            </p>
          </section>

          <div className="flex items-center gap-2 text-[11px] text-ink-soft">
            <Truck className="size-3.5 text-forest" />
            {settings.delivery_estimate ?? "Same-day delivery"} · Free over {inr(settings.free_delivery_above)}
          </div>
        </div>

        {/* Optional patch content ahead of the order summary. */}
        <PatchSlot name="checkout-before-summary" />

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-xl text-ink">
                <PackageCheck className="size-4 text-forest" />
                Your basket
                <span className="text-ink-soft">({items.length})</span>
              </h2>
            </div>

            <ul className="max-h-[19rem] divide-y divide-line/70 overflow-y-auto px-5">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center gap-3 py-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream-2">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-forest text-[9px] font-semibold text-cream">
                      {quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink">{product.name}</p>
                    <p className="text-[10.5px] text-ink-soft">{product.unit}</p>
                  </div>
                  <span className="price text-[12.5px] font-medium">{inr(product.price * quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 py-4">
              {coupon ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-forest/20 bg-forest/[0.04] px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Tag className="size-3.5 text-forest" />
                    <span className="text-[11.5px] font-semibold tracking-wide text-forest">
                      {coupon.code}
                    </span>
                    <span className="text-[11px] text-ink-soft">−{inr(coupon.discount)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[10.5px] text-ink-soft underline underline-offset-2 hover:text-clay"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={apply} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      aria-label="Coupon code"
                      className="input h-9 pl-8 text-[11.5px] uppercase tracking-wide"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponBusy || !code.trim()}
                    className="btn btn-secondary btn-sm h-9 px-3.5"
                  >
                    {couponBusy ? <Spinner /> : "Apply"}
                  </button>
                </form>
              )}

              <dl className="mt-4 space-y-2 text-[12.5px]">
                <div className="flex justify-between text-ink-soft">
                  <dt>Subtotal</dt>
                  <dd className="price text-ink">{inr(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#1c6b3f]">
                    <dt>Discount</dt>
                    <dd className="price">−{inr(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ink-soft">
                  <dt>Delivery</dt>
                  <dd className={deliveryFee === 0 ? "text-[#1c6b3f]" : "text-ink"}>
                    {deliveryFee === 0 ? "Free" : inr(deliveryFee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2.5">
                  <dt className="text-sm font-medium">To pay in cash</dt>
                  <dd className="price text-base font-semibold">{inr(total)}</dd>
                </div>
              </dl>

              {!settings.is_open && (
                <p className="mt-3 rounded-lg bg-clay/10 px-3 py-2 text-[11px] leading-relaxed text-clay">
                  The store is currently closed. Checkout reopens when the shop does.
                </p>
              )}

              <button
                type="submit"
                disabled={busy || !settings.is_open}
                className="btn btn-primary mt-4 h-12 w-full justify-between px-5"
              >
                <span>{busy ? "Placing your order…" : `Place order · ${inr(total)}`}</span>
                {busy ? <Spinner /> : <ArrowRight className="size-4" />}
              </button>
              <p className="mt-2.5 text-center text-[10px] leading-relaxed text-ink-soft">
                By placing this order you agree to pay {inr(total)} on delivery.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
