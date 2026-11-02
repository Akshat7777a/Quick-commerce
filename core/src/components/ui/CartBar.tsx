import { ArrowRight, ShoppingBasket } from "lucide-react";
import { useCart } from "../../lib/cart";
import { inr } from "../../lib/format";

/**
 * Sticky cart bar shown above the bottom navigation while the basket has
 * items. Reads the existing cart context, so totals never drift from the
 * cart drawer or checkout.
 */
export function CartBar() {
  const { count, total, openCart } = useCart();
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-40 px-3 pb-2 md:hidden">
      <button
        type="button"
        onClick={openCart}
        className="flex w-full items-center justify-between gap-3 rounded-[var(--lm-radius-control)] bg-forest px-4 py-2.5 text-left text-white shadow-soft"
      >
        <span className="flex items-center gap-2 text-[12px] leading-4">
          <ShoppingBasket className="size-4" aria-hidden="true" />
          <span>
            {count} item{count === 1 ? "" : "s"} · <span className="font-semibold">{inr(total)}</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[14px] font-semibold leading-5">
          View cart
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
