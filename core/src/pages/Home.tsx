import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { BannerCarousel } from "../components/BannerCarousel";
import { CouponCard } from "../components/CouponCard";
import { ProductCard } from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ui";
import { PatchSlot } from "../lib/patch-loader";
import type { Banner, Coupon, Product } from "../lib/types";

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

export function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [shelf, setShelf] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Each section renders as soon as its own request lands. Gating the banner
    // on the slowest of five requests delayed the LCP image by ~2s+ on Slow 4G.
    const jobs: Promise<unknown>[] = [];
    const run = (p: Promise<unknown>, set: (value: unknown) => void) =>
      jobs.push(p.then((value) => { if (alive) set(value); }).catch(() => undefined));
    run(api.listBanners(), setBanners as (value: unknown) => void);
    run(api.listProducts({ featured: true, limit: 8 }), setFeatured as (value: unknown) => void);
    run(api.listProducts({ limit: 8, sort: "featured" }), setShelf as (value: unknown) => void);
    run(api.listCoupons(), (value) => { if (alive) setCoupons((value as Coupon[]).slice(0, 3)); });
    Promise.all(jobs).finally(() => {
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
      <BannerCarousel banners={banners} loading={loading} />

      {/* Featured */}
      {(loading || featured.length > 0) && (
        <section className="container-page mt-14 sm:mt-20">
          <SectionHead
            eyebrow="Featured products"
            title="Featured in the shop"
            action="/shop?sort=featured"
            actionLabel="See all featured products"
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
      )}

      {/* Offers */}
      {coupons.length > 0 && (
        <section className="mt-16 sm:mt-24">
          <div className="container-page">
            <div className="rounded-[1.5rem] bg-cream-2/70 px-5 py-10 sm:rounded-[2rem] sm:px-10 sm:py-12">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Store offers</p>
                  <h2 className="mt-2 text-3xl leading-tight text-ink sm:text-[2.5rem]">
                    A little less on the bill
                  </h2>
                  <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
                    Enter a coupon at checkout when your order meets its terms.
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
