import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag, Tag, Trash2, Truck, X } from "lucide-react";
import { useCart } from "../lib/cart";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { cn, inr } from "../lib/format";
import { ProductImage, QtyStepper, Spinner } from "./ui";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    count,
    subtotal,
    discount,
    deliveryFee,
    total,
    coupon,
    couponBusy,
    setQuantity,
    remove,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { settings } = useStoreSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, closeCart]);

  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      const result = await applyCoupon(trimmed);
      if (result.valid) {
        toast(result.message || "Coupon applied");
        setCode("");
      } else {
        toast(result.message, "error");
      }
    } catch {
      toast("We couldn't check that coupon. Please try again.", "error");
    }
  };

  const remaining = Math.max(settings.free_delivery_above - subtotal, 0);
  const progress =
    settings.free_delivery_above > 0
      ? Math.min((subtotal / settings.free_delivery_above) * 100, 100)
      : 100;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your basket"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-lift animate-slide-in"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="size-4 text-forest" />
            <h2 className="text-xl text-ink">
              Your basket <span className="text-ink-soft">({count})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close basket"
            className="rounded-full border border-line p-2 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-cream-2 text-ink-soft">
              <ShoppingBag className="size-6" strokeWidth={1.5} />
            </div>
            <h3 className="mt-5 text-2xl">Your basket is empty</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
              Start with something fresh — the shelves are stocked for today.
            </p>
            <button type="button" onClick={closeCart} className="btn btn-primary mt-6">
              Browse the store
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {subtotal < settings.free_delivery_above && (
                <div className="border-b border-line bg-card/70 px-5 py-3">
                  <p className="flex items-center gap-2 text-[12px] text-ink-soft">
                    <Truck className="size-3.5 text-forest" />
                    Add <span className="font-semibold text-ink">{inr(remaining)}</span> more for free
                    delivery
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream-2">
                    <div
                      className="h-full rounded-full bg-forest transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <ul className="divide-y divide-line/80 px-5">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex gap-3 py-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-2">
                      <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink">{product.name}</p>
                          <p className="mt-0.5 text-[11px] text-ink-soft">{product.unit}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(product.id)}
                          aria-label={`Remove ${product.name}`}
                          className="rounded-full p-1 text-ink-soft transition hover:bg-clay/10 hover:text-clay"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <QtyStepper
                          value={quantity}
                          onChange={(next) => setQuantity(product.id, next)}
                          max={product.stock}
                        />
                        <span className="price text-[13px] font-semibold">
                          {inr(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-line px-5 py-4">
                {coupon ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-forest/20 bg-forest/[0.04] px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Tag className="size-4 text-forest" />
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-forest">{coupon.code}</p>
                        <p className="text-[11px] text-ink-soft">{coupon.message}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[11px] text-ink-soft underline underline-offset-2 transition hover:text-clay"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={apply} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
                      <input
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        aria-label="Coupon code"
                        className="input h-10 pl-9 text-[12px] uppercase tracking-wide"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponBusy || !code.trim()}
                      className="btn btn-secondary btn-sm h-10 px-4"
                    >
                      {couponBusy ? <Spinner /> : "Apply"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="border-t border-line bg-card px-5 py-4">
              <dl className="space-y-2 text-[12.5px]">
                <div className="flex justify-between text-ink-soft">
                  <dt>Subtotal</dt>
                  <dd className="price text-ink">{inr(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#1c6b3f]">
                    <dt>Coupon discount</dt>
                    <dd className="price">−{inr(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ink-soft">
                  <dt>Delivery</dt>
                  <dd className={cn("price", deliveryFee === 0 ? "text-[#1c6b3f]" : "text-ink")}>
                    {deliveryFee === 0 ? "Free" : inr(deliveryFee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-sm">
                  <dt className="font-medium">Total</dt>
                  <dd className="price font-semibold">{inr(total)}</dd>
                </div>
              </dl>

              {!settings.is_open && (
                <p className="mt-3 rounded-lg bg-clay/10 px-3 py-2 text-[11px] leading-relaxed text-clay">
                  The store is closed right now. You can keep browsing — checkout reopens with the store.
                </p>
              )}

              <button
                type="button"
                disabled={!settings.is_open}
                onClick={() => {
                  closeCart();
                  navigate("/checkout");
                }}
                className="btn btn-primary mt-4 h-12 w-full justify-between px-5"
              >
                <span>Checkout · Cash on delivery</span>
                <ArrowRight className="size-4" />
              </button>
              <p className="mt-2.5 text-center text-[10.5px] tracking-wide text-ink-soft">
                Pay in cash when your order arrives at your door
              </p>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}
