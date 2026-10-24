import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { discountPercent, inr } from "../lib/format";
import { ProductImage, QtyStepper } from "./ui";
import type { Product } from "../lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  "fruits-vegetables": "🥬",
  "dairy-eggs": "🥛",
  bakery: "🥖",
  staples: "🌾",
  snacks: "🍪",
  beverages: "☕",
  "home-care": "🧼",
  "personal-care": "🧴",
};

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { add, quantityOf, setQuantity } = useCart();
  const { toast } = useToast();
  const quantity = quantityOf(product.id);
  const off = discountPercent(product.price, product.mrp);
  const soldOut = product.stock <= 0;
  const emoji = CATEGORY_EMOJI[product.category?.slug ?? ""] ?? "🛒";

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[1.2rem] bg-cream-2">
        <Link to={`/product/${product.slug}`} aria-label={product.name} className="block size-full">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            emoji={emoji}
            className={`size-full object-cover transition duration-700 ${
              priority ? "" : "group-hover:scale-[1.04]"
            }`}
          />
        </Link>

        {off > 0 && !soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-cream/95 px-2 py-1 text-[10px] font-semibold tracking-wide text-clay shadow-sm">
            {off}% off
          </span>
        )}
        {product.is_featured && !soldOut && off === 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-cream/95 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-forest shadow-sm">
            Pick of the week
          </span>
        )}

        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-cream/65 backdrop-blur-[1px]">
            <span className="rounded-full bg-ink px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-cream">
              Sold out
            </span>
          </div>
        )}

        {!soldOut && (
          <div className="absolute bottom-2.5 right-2.5">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => {
                  add(product, 1);
                  toast(`${product.name} added to your basket`);
                }}
                aria-label={`Add ${product.name} to basket`}
                className="grid size-10 place-items-center rounded-full bg-forest text-cream shadow-soft transition hover:bg-forest-2 active:scale-95"
              >
                <Plus className="size-4" />
              </button>
            ) : (
              <div className="rounded-full bg-card/95 p-0.5 shadow-soft backdrop-blur">
                <QtyStepper
                  value={quantity}
                  onChange={(next) => setQuantity(product.id, next)}
                  max={product.stock}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          {product.category?.name ?? "Essentials"}
        </p>
        <Link
          to={`/product/${product.slug}`}
          className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug text-ink decoration-ink/30 underline-offset-2 hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-0.5 text-[11px] text-ink-soft">{product.unit}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="price text-[14.5px] font-semibold text-ink">{inr(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="price text-[11px] text-ink-soft line-through">{inr(product.mrp)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
