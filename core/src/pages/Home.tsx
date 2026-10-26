import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { api } from "../lib/api";
import { useStoreSettings } from "../lib/store";
import { inr } from "../lib/format";
import { BannerCarousel } from "../components/BannerCarousel";
import { CouponCard } from "../components/CouponCard";
import { ProductCard } from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ui";
import { PatchSlot } from "../lib/patch-loader";
import type { Banner, Category, Coupon, Product } from "../lib/types";

function SectionHead({
  eyebrow,
  title,
  action,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-3xl leading-tight text-ink sm:text-[2.5rem]">{title}</h2>
      </div>
      {action && (
        <Link
          to={action}
          className="group hidden shrink-0 items-center gap-1.5 text-[12px] text-ink-soft transition hover:text-ink sm:inline-flex"
        >
          {actionLabel ?? "View all"}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Fill your basket",
    copy: "Browse the aisles, check what's fresh today, and add what you need.",
  },
  {
    number: "02",
    title: "Order in a minute",
    copy: "Add your address and confirm. No card, no wallet, no fuss.",
  },
  {
    number: "03",
    title: "Pay at your door",
    copy: "We pack it, deliver it, and you hand over cash on arrival.",
  },
];

export function Home() {
  const { settings } = useStoreSettings();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [shelf, setShelf] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.listBanners(),
      api.listCategories(),
      api.listProducts({ featured: true, limit: 8 }),
      api.listProducts({ limit: 8, sort: "featured" }),
      api.listCoupons(),
    ])
      .then(([bannerRows, categoryRows, featuredRows, shelfRows, couponRows]) => {
        if (!alive) return;
        setBanners(bannerRows);
        setCategories(categoryRows);
        setFeatured(featuredRows);
        setShelf(shelfRows);
        setCoupons(couponRows.slice(0, 3));
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      {/* Optional patch content above everything (campaign ribbon, notice). */}
      <PatchSlot name="home-top" />
      <BannerCarousel banners={banners} />

      {/* Trust strip */}
      <section className="container-page mt-6 sm:mt-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            { icon: Banknote, title: "Cash on delivery", copy: "Pay when it arrives" },
            { icon: Truck, title: `Free over ${inr(settings.free_delivery_above)}`, copy: "On every order" },
            { icon: Clock3, title: "Same-day delivery", copy: settings.delivery_estimate ?? "9 AM – 9 PM" },
            { icon: ShieldCheck, title: "Quality checked", copy: "Freshness guaranteed" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 bg-cream px-4 py-4 sm:px-6">
              <item.icon className="size-4 shrink-0 text-forest" strokeWidth={1.6} />
              <div className="min-w-0">
                <p className="text-[11px] font-medium leading-snug text-ink sm:text-[12px]">
                  {item.title}
                </p>
                <p className="text-[10px] leading-snug text-ink-soft sm:text-[10.5px]">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page mt-14 sm:mt-20">
        <SectionHead
          eyebrow="Shop the aisles"
          title="Everything, well organised"
          action="/shop"
          actionLabel="Browse all"
        />
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] w-28 shrink-0 animate-pulse rounded-[1.1rem] bg-cream-2 sm:w-auto" />
              ))
            : categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop?category=${category.slug}`}
                  className="group relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-[1.1rem] bg-cream-2 sm:w-auto"
                >
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-3xl">
                      {category.emoji ?? "🛍️"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="text-[11px] font-medium leading-tight text-cream">{category.name}</p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page mt-14 sm:mt-20">
        <SectionHead
          eyebrow="Chosen today"
          title="Picks from the shelves"
          action="/shop?sort=featured"
          actionLabel="See all picks"
        />
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Offers */}
      {coupons.length > 0 && (
        <section className="mt-16 sm:mt-24">
          <div className="container-page">
            <div className="rounded-[1.5rem] bg-cream-2/70 px-5 py-10 sm:rounded-[2rem] sm:px-10 sm:py-12">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">The offers counter</p>
                  <h2 className="mt-2 text-3xl leading-tight text-ink sm:text-[2.5rem]">
                    A little less on the bill
                  </h2>
                  <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
                    Apply a code in your basket. One offer per order, no fine print worth reading.
                  </p>
                </div>
                <Link
                  to="/offers"
                  className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft transition hover:text-ink"
                >
                  All offers <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {coupons.map((coupon) => (
                  <CouponCard key={coupon.id} coupon={coupon} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="container-page mt-16 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow">Simple by design</p>
            <h2 className="mt-2 text-balance text-4xl leading-[1.02] text-ink sm:text-5xl">
              Your neighbourhood store, now open on your screen.
            </h2>
            <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-ink-soft">
              No delivery tracking, no dark stores, no twelve-step checkout. Just the shop you already
              trust — with a basket that fills itself and a bill you settle at the door.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11.5px] text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-3.5 text-forest" /> Local & independent
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-3.5 text-gold" /> Stocked daily
              </span>
            </div>
            <Link to="/shop" className="btn btn-secondary mt-8">
              Explore the shop
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ol className="divide-y divide-line border-t border-line">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-5 py-6 sm:gap-8 sm:py-7">
                <span className="font-display text-2xl text-gold sm:text-3xl">{step.number}</span>
                <div>
                  <h3 className="text-xl text-ink sm:text-[1.4rem]">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Full shelf */}
      <section className="container-page mt-16 sm:mt-24">
        <SectionHead
          eyebrow="The full shelf"
          title="Stock up on the everyday"
          action="/shop"
          actionLabel="Shop everything"
        />
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
            {shelf.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div className="mt-10 flex justify-center sm:hidden">
          <Link to="/shop" className="btn btn-secondary w-full">
            Browse all products
          </Link>
        </div>
      </section>
    </div>
  );
}
