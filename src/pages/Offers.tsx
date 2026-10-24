import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, Sparkles, Tag, Truck } from "lucide-react";
import { api } from "../lib/api";
import { useStoreSettings } from "../lib/store";
import { inr } from "../lib/format";
import { CouponCard } from "../components/CouponCard";
import { EmptyState, Skeleton } from "../components/ui";
import type { Coupon } from "../lib/types";

export function Offers() {
  const { settings } = useStoreSettings();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .listCoupons()
      .then((rows) => {
        if (alive) setCoupons(rows);
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
    <div className="container-page pt-8 sm:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">The offers counter</p>
        <h1 className="mt-2 text-balance text-4xl leading-[1.02] text-ink sm:text-5xl">
          Small savings, honestly given.
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
          Copy a code and add it in your basket. One coupon per order — we&apos;ll always apply the
          best one you enter.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Free delivery", copy: `On baskets above ${inr(settings.free_delivery_above)}` },
          { icon: Banknote, title: "Pay at the door", copy: "Cash on every order" },
          { icon: Sparkles, title: "Fresh daily", copy: "Picked the same morning" },
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5">
            <item.icon className="size-4 shrink-0 text-forest" strokeWidth={1.6} />
            <div>
              <p className="text-[12px] font-medium text-ink">{item.title}</p>
              <p className="text-[10.5px] text-ink-soft">{item.copy}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 pb-8 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-full rounded-[1.2rem]" />
            ))
          : coupons.map((coupon) => <CouponCard key={coupon.id} coupon={coupon} />)}
      </div>

      {!loading && coupons.length === 0 && (
        <EmptyState
          icon={<Tag className="size-5" />}
          title="No live offers right now"
          description="New offers land with the morning stock. In the meantime, delivery is always free above the basket threshold."
          action={
            <Link to="/shop" className="btn btn-primary">
              Browse the shop
            </Link>
          }
        />
      )}

      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[1.5rem] bg-cream-2/80 px-6 py-7 sm:flex-row sm:items-center sm:px-8">
        <div>
          <h2 className="text-2xl text-ink">Ready when you are</h2>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            Fill a basket, apply a code, and settle it in cash at your door.
          </p>
        </div>
        <Link to="/shop" className="btn btn-primary shrink-0">
          Start shopping
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
