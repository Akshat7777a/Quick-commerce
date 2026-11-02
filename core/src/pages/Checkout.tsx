import { useEffect, useState, type FormEvent } from "react";
import { readJSON, removeKey, writeJSON } from "../lib/storage";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Banknote, CheckCircle2, Clock3, MessageCircle, ShieldCheck, ShoppingBag } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { STORE_CITY_LABEL, deliveryOptions, extractPincode, serviceablePincodes } from "../lib/delivery";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { inr } from "../lib/format";
import { ProductImage } from "../components/ui";
import { Field, TextAreaField } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Spinner, StateBlock } from "../components/ui/Primitives";
import { PatchSlot, runPatchHooks } from "../lib/patch-loader";
import type { PlaceOrderResult } from "../lib/types";

const DRAFT_KEY = "lmart.checkout.draft.v1";
type Draft = { name?: string; phone?: string; address?: string; notes?: string; slot?: string };

const ORDER_GATE_KEY = "lmart.order.gate.v1";
const ORDER_GATE_MS = 45_000;

type OrderedItem = { id: string; name: string; unit: string; price: number; quantity: number };

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
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([]);
  const [couponsExist, setCouponsExist] = useState(false);

  useEffect(() => {
    writeJSON(DRAFT_KEY, { name, phone, address, notes, slot } satisfies Draft);
  }, [name, phone, address, notes, slot]);

  useEffect(() => {
    api
      .listCoupons()
      .then((rows) => setCouponsExist(rows.length > 0))
      .catch(() => undefined);
  }, []);

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
      <div className="container-page py-6">
        <div className="mx-auto max-w-xl rounded-[var(--lm-radius-card)] border border-line bg-white">
          <div className="border-b border-line px-5 py-6">
            <CheckCircle2 className="size-8 text-forest" strokeWidth={1.5} />
            <h1 className="mt-3 text-[20px] font-semibold leading-7 text-ink">Order placed</h1>
            <p className="mt-1 text-[14px] leading-5 text-ink-soft">
              Thank you, {name.split(" ")[0] || "friend"}. Keep {inr(result.total)} ready in cash.
            </p>
          </div>
          <div className="px-5 py-4">
            <dl className="space-y-2 text-[14px] leading-5">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Order number</dt>
                <dd className="font-semibold text-ink">{result.order_number}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Payment</dt>
                <dd className="flex items-center gap-1.5 text-ink">
                  <Banknote className="size-4 text-forest" aria-hidden="true" /> Cash on delivery
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Amount due</dt>
                <dd className="price text-[16px] font-semibold text-ink">{inr(result.total)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-ink-soft">Delivering to</dt>
                <dd className="text-right leading-5 text-ink">{address}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-ink-soft">Delivery time</dt>
                <dd className="text-right leading-5 text-ink">{chosenSlot}</dd>
              </div>
            </dl>

            {orderedItems.length > 0 && (
              <ul className="mt-4 divide-y divide-line">
                {orderedItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-[14px] leading-5">
                    <span className="min-w-0 leading-5 text-ink">
                      {item.quantity} x {item.name}
                    </span>
                    <span className="price shrink-0 font-medium">{inr(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => navigate("/orders")}>
                Track order
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => navigate("/shop")}>
                Continue shopping
              </Button>
            </div>

            {result.waUrl && (
              <a
                href={result.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 text-[12px] leading-4 text-forest underline underline-offset-2"
              >
                <MessageCircle className="size-4" /> Send order details to the shop on WhatsApp
              </a>
            )}

            {settings.phone && (
              <p className="mt-3 text-center text-[12px] leading-4 text-ink-soft">
                Questions? Call the shop:{" "}
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="text-forest underline underline-offset-2">
                  {settings.phone}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-8">
        <StateBlock
          icon={<ShoppingBag className="size-5" />}
          title="Your cart is empty"
          description="Add a few essentials before checking out. We keep them in your cart."
          action={
            <Link to="/shop" className="btn btn-primary">
              Browse the shop
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
        `We currently deliver only to PIN ${pinList.join(", ")}: our store is in ${STORE_CITY_LABEL}. Please update the address.`,
      );
    }
    if (!chosenSlot) return setError("Please choose a delivery time.");

    const lastOrderAt = readJSON<number>(ORDER_GATE_KEY) ?? 0;
    if (lastOrderAt && Date.now() - lastOrderAt < ORDER_GATE_MS) {
      return setError(
        "An order was placed from this device moments ago. If it did not go through, please wait a few seconds and try again.",
      );
    }

    setBusy(true);
    try {
      try {
        await runPatchHooks(
          "before-checkout",
          { items, total, phone: phone.trim(), address: address.trim(), slot: chosenSlot },
          { blocking: true },
        );
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
      setOrderedItems(
        items.map((line) => ({
          id: line.product.id,
          name: line.product.name,
          unit: line.product.unit,
          price: line.product.price,
          quantity: line.quantity,
        })),
      );
      const storeDigits = (settings.phone ?? "").replace(/\D/g, "");
      const waMessage = [
        `New order ${placed.order_number}`,
        `Customer: ${name} (${phone})`,
        `Address: ${address}`,
        `Delivery slot: ${chosenSlot}`,
        `Total: ${inr(placed.total)} (cash on delivery)`,
      ].join("\n");
      const waUrl = storeDigits
        ? `https://wa.me/${storeDigits}?text=${encodeURIComponent(waMessage)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;
      setResult({ ...placed, waUrl });
      writeJSON(ORDER_GATE_KEY, Date.now());
      clear();
      removeKey(DRAFT_KEY);
      toast("Order placed: cash on delivery");
      window.scrollTo({ top: 0 });
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

  const pin = extractPincode(address);
  const outside = pin !== null && !pinList.includes(pin);

  return (
    <div className="container-page pb-28 pt-4 md:pb-8">
      <h1 className="text-[20px] font-semibold leading-7 text-ink">Checkout</h1>
      <p className="mt-1 max-w-lg text-[14px] leading-5 text-ink-soft">
        Tell us where to deliver. You pay in cash when it arrives.
      </p>

      <form id="checkout-form" onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="space-y-4">
          <section className="rounded-[var(--lm-radius-card)] border border-line bg-white p-4">
            <h2 className="text-[16px] font-semibold leading-5 text-ink">Delivery details</h2>

            {error && (
              <p role="alert" className="mt-3 rounded-[var(--lm-radius-control)] bg-clay/5 px-3 py-2 text-[12px] leading-4 text-clay">
                {error}
              </p>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Ananya Rao"
              />
              <Field
                label="Phone number"
                required
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Delivery address"
                  required
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  autoComplete="street-address"
                  placeholder="Flat, building, street, landmark, city, pincode"
                  error={outside ? `We do not deliver to PIN ${pin} yet.` : undefined}
                  hint={`We deliver to PIN ${pinList.join(", ")} in ${STORE_CITY_LABEL}.`}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Notes for the shop (optional)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ring the bell twice, leave at the gate"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[var(--lm-radius-card)] border border-line bg-white p-4">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold leading-5 text-ink">
              <Clock3 className="size-4 text-forest" aria-hidden="true" /> Delivery time
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {slotOptions.map((option) => {
                const active = chosenSlot === option;
                return (
                  <label
                    key={option}
                    className={
                      "flex cursor-pointer items-center gap-2.5 rounded-[var(--lm-radius-control)] border px-3 py-2.5 transition " +
                      (active ? "border-forest bg-primary-tint" : "border-line hover:border-forest/40")
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
                        (active ? "border-forest" : "border-ink-soft/40")
                      }
                    >
                      {active && <span className="size-2 rounded-full bg-forest" />}
                    </span>
                    <span className="text-[14px] leading-5 text-ink">{option}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-[var(--lm-radius-card)] border border-line bg-white p-4">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold leading-5 text-ink">
              <Banknote className="size-4 text-forest" aria-hidden="true" /> Payment
            </h2>
            <div className="mt-3 flex items-start gap-3 rounded-[var(--lm-radius-control)] border border-forest/20 bg-primary-tint px-3 py-2.5">
              <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border-2 border-forest">
                <span className="size-2 rounded-full bg-forest" />
              </span>
              <div>
                <p className="text-[14px] font-medium leading-5 text-ink">Cash on delivery</p>
                <p className="mt-0.5 text-[12px] leading-4 text-ink-soft">
                  Keep {inr(total)} ready. The delivery person collects it at your door.
                </p>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] leading-4 text-ink-soft">
              <ShieldCheck className="size-4 text-forest" aria-hidden="true" />
              No online payment is taken at any point.
            </p>
          </section>

          <PatchSlot name="checkout-before-summary" />
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-[var(--lm-radius-card)] border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[16px] font-semibold leading-5 text-ink">
                Order summary <span className="font-normal text-ink-soft">({items.length})</span>
              </h2>
            </div>

            <ul className="max-h-64 divide-y divide-line overflow-y-auto px-4">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center gap-3 py-2.5">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded bg-white">
                    <ProductImage src={product.image_url} alt={product.name} className="size-full object-contain" />
                    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-forest text-[10px] font-semibold text-white">
                      {quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium leading-4 text-ink">{product.name}</p>
                    <p className="text-[12px] leading-4 text-ink-soft">{product.unit}</p>
                  </div>
                  <span className="price text-[12px] font-medium">{inr(product.price * quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-4 py-3">
              {(couponsExist || coupon) && (
                <>
                  {coupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-[var(--lm-radius-control)] border border-forest/20 bg-forest/5 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-forest">{coupon.code}</span>
                        <span className="text-[12px] text-ink-soft">-{inr(coupon.discount)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[12px] text-ink-soft underline underline-offset-2 hover:text-clay"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={apply} className="mb-3 flex gap-2">
                      <input
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        aria-label="Coupon code"
                        className="input h-10 flex-1 text-[14px] uppercase"
                      />
                      <Button type="submit" variant="secondary" size="sm" disabled={couponBusy || !code.trim()}>
                        {couponBusy ? <Spinner /> : "Apply"}
                      </Button>
                    </form>
                  )}
                </>
              )}

              <dl className="space-y-1.5 text-[14px] leading-5">
                <div className="flex justify-between text-ink-soft">
                  <dt>Item total</dt>
                  <dd className="price text-ink">{inr(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-forest">
                    <dt>Discount</dt>
                    <dd className="price">-{inr(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ink-soft">
                  <dt>Delivery</dt>
                  <dd className={deliveryFee === 0 ? "text-forest" : "text-ink"}>
                    {deliveryFee === 0 ? "Free" : inr(deliveryFee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-[16px] font-semibold">
                  <dt>To pay in cash</dt>
                  <dd className="price">{inr(total)}</dd>
                </div>
              </dl>

              {!settings.is_open && (
                <p className="mt-2 rounded-[var(--lm-radius-control)] bg-clay/5 px-3 py-2 text-[12px] leading-4 text-clay">
                  The store is closed. Checkout reopens when the shop does.
                </p>
              )}

              <Button
                type="submit"
                block
                className="mt-3 hidden md:flex"
                disabled={busy || !settings.is_open}
              >
                {busy ? "Placing your order" : `Place order · ${inr(total)}`}
              </Button>
              <p className="mt-2 text-center text-[12px] leading-4 text-ink-soft">
                By placing this order you agree to pay {inr(total)} on delivery and to our{" "}
                <Link to="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> and{" "}
                <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </aside>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] md:hidden">
        <Button
          type="submit"
          form="checkout-form"
          block
          disabled={busy || !settings.is_open}
        >
          {busy ? "Placing your order" : `Place order · ${inr(total)}`}
        </Button>
      </div>
    </div>
  );
}
