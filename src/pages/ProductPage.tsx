import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  ChevronRight,
  Clock3,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { discountPercent, inr } from "../lib/format";
import { EmptyState, ProductImage, QtyStepper, Skeleton } from "../components/ui";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../lib/types";

export function ProductPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { settings } = useStoreSettings();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setQuantity(1);

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
      document.title = "L MART ONLINE — Everyday essentials, delivered";
    };
  }, [product]);

  if (loading) {
    return (
      <div className="container-page grid gap-10 pt-10 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-[1.75rem]" />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page pt-16">
        <EmptyState
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

  const addToCart = (openDrawer = false) => {
    add(product, quantity);
    toast(`${quantity} × ${product.name} added to your basket`);
    if (openDrawer) {
      navigate("/checkout");
    }
  };

  return (
    <div className="container-page pt-6 sm:pt-9">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-ink-soft no-scrollbar">
        <Link to="/" className="transition hover:text-ink">Home</Link>
        <ChevronRight className="size-3 shrink-0 opacity-50" />
        <Link to="/shop" className="transition hover:text-ink">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="size-3 shrink-0 opacity-50" />
            <Link to={`/shop?category=${product.category.slug}`} className="whitespace-nowrap transition hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3 shrink-0 opacity-50" />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-cream-2 sm:rounded-[1.75rem]">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="size-full object-cover"
            emoji="🛒"
          />
          {off > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1.5 text-[11px] font-semibold text-clay shadow-sm">
              {off}% off
            </span>
          )}
          {soldOut && (
            <span className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-cream">
              Sold out
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <p className="eyebrow">{product.category?.name ?? "Essentials"}</p>
          <h1 className="mt-2 text-balance text-4xl leading-[1.05] text-ink sm:text-[3.25rem]">
            {product.name}
          </h1>
          <p className="mt-2 text-[12px] text-ink-soft">{product.unit}</p>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="price text-3xl font-semibold text-ink">{inr(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="price text-base text-ink-soft line-through">{inr(product.mrp)}</span>
                <span className="rounded-full bg-forest/[0.07] px-2.5 py-1 text-[11px] font-medium text-forest">
                  Save {inr(product.mrp - product.price)}
                </span>
              </>
            )}
          </div>

          <p className="mt-5 max-w-lg text-[13.5px] leading-relaxed text-ink-soft">
            {product.description ??
              "A dependable everyday essential, hand-picked for the L MART shelf."}
          </p>

          <div className="mt-5 flex items-center gap-2 text-[11.5px]">
            <span
              className={`size-1.5 rounded-full ${soldOut ? "bg-clay" : lowStock ? "bg-gold" : "bg-[#2f8a58]"}`}
            />
            {soldOut ? (
              <span className="text-clay">Out of stock</span>
            ) : lowStock ? (
              <span className="text-[#8a6415]">Only {product.stock} left today</span>
            ) : (
              <span className="text-[#1c6b3f]">In stock · packed fresh</span>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {!soldOut && (
              <>
                <QtyStepper value={quantity} onChange={setQuantity} max={product.stock} />
                <button
                  type="button"
                  onClick={() => addToCart()}
                  className="btn btn-primary h-12 flex-1"
                >
                  <ShoppingBag className="size-4" />
                  Add to basket
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(true)}
                  className="btn btn-secondary h-12"
                >
                  Buy now
                  <ArrowRight className="size-4" />
                </button>
              </>
            )}
            {soldOut && (
              <button type="button" disabled className="btn btn-primary h-12 w-full sm:w-auto sm:px-8">
                Sold out
              </button>
            )}
          </div>

          {!settings.is_open && (
            <p className="mt-3 rounded-xl bg-clay/10 px-4 py-2.5 text-[11.5px] leading-relaxed text-clay">
              The store is closed right now. You can add items, but checkout reopens with the store.
            </p>
          )}

          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {[
              { icon: Banknote, title: "Cash on delivery", copy: "Pay at your door" },
              { icon: Truck, title: settings.delivery_estimate ?? "Same-day", copy: "Local delivery" },
              { icon: ShieldCheck, title: "Freshness promise", copy: "Checked before packing" },
            ].map((item) => (
              <div key={item.title} className="bg-card px-4 py-3.5">
                <item.icon className="size-4 text-forest" strokeWidth={1.6} />
                <p className="mt-2 text-[11.5px] font-medium text-ink">{item.title}</p>
                <p className="text-[10.5px] text-ink-soft">{item.copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 text-[11px] text-ink-soft">
            <Clock3 className="size-3.5 text-forest" />
            Free delivery on baskets above {inr(settings.free_delivery_above)}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10 sm:mt-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">From the same aisle</p>
              <h2 className="mt-2 text-3xl text-ink sm:text-4xl">You may also like</h2>
            </div>
            {product.category && (
              <Link
                to={`/shop?category=${product.category.slug}`}
                className="hidden items-center gap-1.5 text-[12px] text-ink-soft transition hover:text-ink sm:inline-flex"
              >
                More in {product.category.name}
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
