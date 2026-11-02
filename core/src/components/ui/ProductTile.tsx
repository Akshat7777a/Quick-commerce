import { Link } from "react-router-dom";
import { discountPercent, inr } from "../../lib/format";
import type { Product } from "../../lib/types";
import { AddControl } from "./AddControl";

/**
 * Product card: image on a white tile, real discount tag only when the MRP is
 * higher than the selling price, two-line name, pack size, price and ADD.
 * The image area and name open the product page; ADD stays independent.
 */
export function ProductTile({ product, priority = false }: { product: Product; priority?: boolean }) {
  const off = discountPercent(product.price, product.mrp);
  const soldOut = product.stock <= 0;

  return (
    <article className="flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[var(--lm-radius-card)] border border-line bg-white">
        <Link
          to={`/product/${product.slug}`}
          className="block size-full"
          aria-label={`Open ${product.name}`}
          tabIndex={-1}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="size-full object-contain p-2"
            />
          ) : (
            <span className="grid size-full place-items-center px-3 text-center text-[12px] font-medium leading-4 text-ink-soft">
              {product.name}
            </span>
          )}
        </Link>

        {off > 0 && !soldOut && (
          <span className="ui-tag absolute left-2 top-2">{off}% off</span>
        )}

        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-white/75">
            <span className="ui-tag ui-tag--muted">Out of stock</span>
          </div>
        )}
      </div>

      <Link to={`/product/${product.slug}`} className="mt-2 block">
        <h3 className="line-clamp-2 text-[14px] font-medium leading-5 text-ink">{product.name}</h3>
      </Link>
      <p className="mt-0.5 text-[12px] leading-4 text-ink-soft">{product.unit}</p>

      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-5 text-ink">{inr(product.price)}</p>
          {product.mrp && product.mrp > product.price && (
            <p className="text-[12px] leading-4 text-ink-soft line-through">{inr(product.mrp)}</p>
          )}
        </div>
        <AddControl product={product} />
      </div>
    </article>
  );
}

export function ProductTileSkeleton() {
  return (
    <div>
      <div className="ui-skeleton aspect-square w-full" />
      <div className="ui-skeleton mt-3 h-3 w-4/5" />
      <div className="ui-skeleton mt-2 h-3 w-2/5" />
      <div className="ui-skeleton mt-3 h-5 w-1/3" />
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product, index) => (
        <ProductTile key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}
