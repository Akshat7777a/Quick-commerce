import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ShoppingBasket, Tag, Trash2, Truck, X } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { inr } from "../lib/format";
import { ProductImage, Spinner } from "./ui";
import { ProgressBar } from "./ui/Primitives";
import { Button } from "./ui/Button";
import { AddControl } from "./ui/AddControl";

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
    remove,
    applyCoupon,
    removeCoupon,
    add,
  } = useCart();
  const { settings } = useStoreSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [couponsExist, setCouponsExist] = useState(false);

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

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    api
      .listCoupons()
      .then((rows) => {
        if (alive) setCouponsExist(rows.length > 0);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isOpen]);

  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      const result = await applyCoupon(trimmed);
      toast(result.message, result.valid ? "success" : "error");
      if (result.valid) setCode("");
    } catch {
      toast("We couldn't check that coupon. Please try again.", "error");
    }
  };

  const threshold = settings.free_delivery_above;
  const remaining = Math.max(threshold - subtotal, 0);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={closeCart} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream animate-slide-in"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[18px] font-semibold leading-6 text-ink">
            Your cart <span className="font-normal text-ink-soft">({count})</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="grid size-9 place-items-center rounded-[var(--lm-radius-control)] text-ink-soft transition hover:bg-cream-2 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-cream-2 text-forest">
              <ShoppingBasket className="size-6" strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 text-[18px] font-semibold leading-6 text-ink">Your cart is empty</h3>
            <p className="mt-1 max-w-xs text-[14px] leading-5 text-ink-soft">
              Start with something fresh. The shelves are stocked for today.
            </p>
            <Button className="mt-5" onClick={closeCart}>
              Browse the shop
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {threshold > 0 && (
                <div className="border-b border-line bg-white px-4 py-3">
                  <p className="flex items-center gap-2 text-[12px] leading-4 text-ink-soft">
                    <Truck className="size-4 text-forest" aria-hidden="true" />
                    {remaining > 0 ? (
                      <span>
                        Add <span className="font-semibold text-ink">{inr(remaining)}</span> more for free
                        delivery
                      </span>
                    ) : (
                      <span className="font-medium text-forest">Free delivery unlocked</span>
                    )}
                  </p>
                  <div className="mt-2">
                    <ProgressBar value={subtotal} max={threshold} label="Progress to free delivery" />
                  </div>
                </div>
              )}

              <ul className="divide-y divide-line px-4">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex gap-3 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--lm-radius-control)] border border-line bg-white">
                      <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="size-full object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium leading-5 text-ink">{product.name}</p>
                          <p className="text-[12px] leading-4 text-ink-soft">{product.unit}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const removed = { product, quantity };
                            remove(product.id);
                            toast("Removed from cart", "info", {
                              label: "Undo",
                              onClick: () => add(removed.product, removed.quantity),
                            });
                          }}
                          aria-label={`Remove ${product.name}`}
                          className="grid size-8 place-items-center rounded-[var(--lm-radius-control)] text-ink-soft transition hover:bg-clay/5 hover:text-clay"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <AddControl product={product} />
                        <span className="price text-[14px] font-semibold leading-5 text-ink">
                          {inr(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {(couponsExist || coupon) && (
                <div className="border-t border-line px-4 py-3">
                  {coupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-[var(--lm-radius-control)] border border-forest/20 bg-forest/5 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="size-4 text-forest" aria-hidden="true" />
                        <div>
                          <p className="text-[12px] font-semibold leading-4 text-forest">{coupon.code}</p>
                          <p className="text-[12px] leading-4 text-ink-soft">{coupon.message}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[12px] leading-4 text-ink-soft underline underline-offset-2 hover:text-clay"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={apply} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                        <input
                          value={code}
                          onChange={(event) => setCode(event.target.value.toUpperCase())}
                          placeholder="Coupon code"
                          aria-label="Coupon code"
                          className="input h-11 pl-9 text-[14px] uppercase"
                        />
                      </div>
                      <Button type="submit" variant="secondary" disabled={couponBusy || !code.trim()}>
                        {couponBusy ? <Spinner /> : "Apply"}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-line bg-white px-4 py-3">
              <dl className="space-y-1.5 text-[14px] leading-5">
                <div className="flex justify-between text-ink-soft">
                  <dt>Item total</dt>
                  <dd className="price text-ink">{inr(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-forest">
                    <dt>Coupon discount</dt>
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
                  <dt>Total</dt>
                  <dd className="price">{inr(total)}</dd>
                </div>
              </dl>

              {!settings.is_open && (
                <p className="mt-2 rounded-[var(--lm-radius-control)] bg-clay/5 px-3 py-2 text-[12px] leading-4 text-clay">
                  The store is closed right now. Checkout reopens with the shop.
                </p>
              )}

              <Button
                block
                className="mt-3"
                disabled={!settings.is_open}
                onClick={() => {
                  closeCart();
                  navigate("/checkout");
                }}
                iconRight={<span aria-hidden="true">→</span>}
              >
                Proceed to checkout · {inr(total)}
              </Button>
              <p className="mt-2 text-center text-[12px] leading-4 text-ink-soft">
                Pay cash when your order arrives
              </p>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}
