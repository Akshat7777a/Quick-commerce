import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Banknote, ChevronRight, Clock3, PackageCheck, Truck } from "lucide-react";
import { api } from "../lib/api";
import { useStoreSettings } from "../lib/store";
import { discountPercent, inr } from "../lib/format";
import { Skeleton, StateBlock } from "../components/ui/Primitives";
import { ProductImage } from "../components/ui";
import { AddControl } from "../components/ui/AddControl";
import { ProductTile } from "../components/ui/ProductTile";
import type { Product } from "../lib/types";

export function ProductPage() {
  const { slug = "" } = useParams();
  const { settings } = useStoreSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getProductBySlug(slug)
      .then(async (found) => {
        if (!alive) return;
        setProduct(found);
        if (found?.category_id) {
          const rows = await api.listProducts({ categoryId: found.category_id, limit: 5 });
          if (alive) setRelated(rows.filter((row) => row.id !== found.id).slice(0, 4));
        }
      })
      .catch(() => {
        if (alive) setProduct(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (product) document.title = `${product.name} · L MART ONLINE`;
    return () => {
      document.title = "L MART ONLINE: Everyday essentials, delivered";
    };
  }, [product]);

  if (loading) {
    return (
      <div className="container-page pt-4">
        <div className="mt-2 grid gap-6 lg:grid-cols-2 lg:gap-10">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page pt-8">
        <StateBlock
          icon={<PackageCheck className="size-5" />}
          title="This item has left the shelf"
          description="It may be sold out or moved. Explore the aisles for something similar."
          action={
            <Link to="/shop" className="btn btn-primary">
              Back to the shop
            </Link>
          }
        />
      </div>
    );
  }

  const off = discountPercent(product.price, product.mrp);
  const soldOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 8;

  return (
    <div className="container-page pb-28 pt-3 md:pb-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto text-[12px] leading-4 text-ink-soft no-scrollbar">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden="true" />
        <Link to="/shop" className="hover:text-ink">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden="true" />
            <Link to={`/shop?category=${product.category.slug}`} className="whitespace-nowrap hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-3 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="relative aspect-square overflow-hidden rounded-[var(--lm-radius-card)] border border-line bg-white">
          <ProductImage src={product.image_url} alt={product.name} className="size-full object-contain p-4" />
          {off > 0 && <span className="ui-tag absolute left-3 top-3">{off}% off</span>}
          {soldOut && (
            <span className="ui-tag ui-tag--muted absolute bottom-3 left-3">Out of stock</span>
          )}
        </div>

        <div>
          <p className="text-[12px] leading-4 text-ink-soft">{product.category?.name ?? "Everyday essentials"}</p>
          <h1 className="mt-1 text-[20px] font-semibold leading-7 text-ink sm:text-[28px] sm:leading-9">
            {product.name}
          </h1>
          <p className="mt-1 text-[14px] leading-5 text-ink-soft">{product.unit}</p>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="price text-[24px] font-semibold leading-7 text-ink">{inr(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="price text-[12px] leading-4 text-ink-soft line-through">{inr(product.mrp)}</span>
                <span className="text-[12px] font-medium leading-4 text-forest">
                  Save {inr(product.mrp - product.price)}
                </span>
              </>
            )}
          </div>

          <p className="mt-2 text-[12px] leading-4">
            {soldOut ? (
              <span className="text-clay">Out of stock</span>
            ) : lowStock ? (
              <span className="text-warning">Only {product.stock} left today</span>
            ) : (
              <span className="text-forest">In stock</span>
            )}
          </p>

          {product.description?.trim() && (
            <section className="mt-4">
              <h2 className="text-[14px] font-medium leading-5 text-ink">Product details</h2>
              <p className="mt-1 text-[14px] leading-5 text-ink-soft">{product.description.trim()}</p>
            </section>
          )}

          <ul className="mt-4 space-y-1.5 text-[12px] leading-4 text-ink-soft">
            <li className="flex items-center gap-2">
              <Banknote className="size-4 shrink-0 text-forest" aria-hidden="true" />
              Cash on delivery
            </li>
            {settings.delivery_estimate && (
              <li className="flex items-center gap-2">
                <Clock3 className="size-4 shrink-0 text-forest" aria-hidden="true" />
                {settings.delivery_estimate}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-forest" aria-hidden="true" />
              {settings.free_delivery_above > 0
                ? `Free delivery above ${inr(settings.free_delivery_above)}`
                : "Delivery fee shown in the cart"}
            </li>
          </ul>

          <div className="mt-5 hidden items-center gap-3 md:flex">
            <AddControl product={product} />
            {!soldOut && <span className="text-[12px] leading-4 text-ink-soft">Add to cart</span>}
          </div>

          {!settings.is_open && (
            <p className="mt-4 rounded-[var(--lm-radius-control)] bg-clay/5 px-3 py-2 text-[12px] leading-4 text-clay">
              The store is closed right now. You can add items, checkout reopens with the shop.
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-semibold leading-6 text-ink">
              More from {product.category?.name ?? "this aisle"}
            </h2>
            {product.category && (
              <Link
                to={`/shop?category=${product.category.slug}`}
                className="text-[12px] font-medium leading-4 text-forest hover:underline"
              >
                See all
              </Link>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductTile key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {!soldOut && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 border-t border-line bg-white px-4 py-2 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-semibold leading-5 text-ink">{inr(product.price)}</p>
              <p className="truncate text-[12px] leading-4 text-ink-soft">{product.unit}</p>
            </div>
            <AddControl product={product} />
          </div>
        </div>
      )}
    </div>
  );
}
