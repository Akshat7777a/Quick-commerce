import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Banknote, MapPin, PackageCheck, RotateCcw } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { ORDER_STATUS, ORDER_STATUS_FLOW, cn, formatDateTime, inr } from "../lib/format";
import { EmptyState, ProductImage, Skeleton, Spinner } from "../components/ui";
import type { Order, Product } from "../lib/types";

function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="mt-4 rounded-xl bg-clay/[0.07] px-3.5 py-2.5 text-[11.5px] text-clay">
        This order was cancelled. No cash was collected.
      </p>
    );
  }
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);

  return (
    <div className="mt-5 flex items-center gap-1.5">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <div key={step} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1 rounded-full transition-colors",
                done ? "bg-forest" : "bg-cream-2",
              )}
            />
            <span
              className={cn(
                "text-[9.5px] uppercase tracking-[0.08em]",
                done ? "text-forest" : "text-ink-soft/70",
              )}
            >
              {ORDER_STATUS[step]?.label ?? step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Orders() {
  const { user, loading: authLoading } = useAuth();
  const { add, openCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    api
      .listOrders(user.id)
      .then((rows) => {
        if (alive) setOrders(rows);
      })
      .catch(() => {
        if (alive) setOrders([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="container-page flex justify-center py-24">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?next=/orders" replace />;

  const reorder = (order: Order) => {
    const lines = order.order_items ?? [];
    if (lines.length === 0) {
      toast("This order has no items to repeat.", "error");
      return;
    }
    lines.forEach((item) => {
      if (!item.product_id) return;
      const product: Product = {
        id: item.product_id,
        name: item.name,
        slug: item.product_id,
        description: null,
        price: item.price,
        mrp: null,
        unit: item.unit ?? "1 pc",
        image_url: item.image_url,
        stock: 50,
        is_active: true,
        is_featured: false,
        category_id: null,
      };
      add(product, item.quantity);
    });
    toast("Your usual is back in the basket");
    navigate("/checkout");
  };

  return (
    <div className="container-page pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your history</p>
          <h1 className="mt-2 text-4xl leading-tight text-ink sm:text-5xl">Order history</h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
            Every basket you&apos;ve placed with L MART, and a one-tap way to order it again.
          </p>
        </div>
        {orders.length > 0 && (
          <button type="button" onClick={openCart} className="btn btn-secondary btn-sm lg:hidden">
            Open basket
          </button>
        )}
      </div>

      <div className="mt-8 pb-6">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-56 w-full rounded-[1.35rem]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<PackageCheck className="size-5" />}
            title="No orders yet"
            description="Your first basket is waiting to be filled. Once you order, everything shows up here."
            action={
              <Link to="/shop" className="btn btn-primary">
                Start shopping
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const meta = ORDER_STATUS[order.status] ?? ORDER_STATUS.placed;
              return (
                <article key={order.id} className="card overflow-hidden">
                  <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-[13px] font-semibold tracking-wide text-ink">
                          {order.order_number}
                        </p>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                            meta.tone,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-ink-soft">
                        Placed {formatDateTime(order.created_at)} · {order.order_items?.length ?? 0} item
                        {(order.order_items?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="price text-base font-semibold text-ink">{inr(order.total)}</p>
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px] text-ink-soft">
                        <Banknote className="size-3" /> Cash on delivery
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap gap-2">
                      {(order.order_items ?? []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-full border border-line bg-cream/50 py-1 pl-1 pr-3"
                        >
                          <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-cream-2">
                            <ProductImage
                              src={item.image_url}
                              alt={item.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <span className="max-w-[9rem] truncate text-[11px] text-ink">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-ink-soft">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <StatusTimeline status={order.status} />

                    <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
                      <p className="flex max-w-md items-start gap-1.5 text-[11px] leading-relaxed text-ink-soft">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-forest" />
                        {order.address}
                      </p>
                      <button
                        type="button"
                        onClick={() => reorder(order)}
                        className="btn btn-secondary btn-sm"
                      >
                        <RotateCcw className="size-3.5" />
                        Order again
                      </button>
                    </div>

                    {(order.discount > 0 || order.delivery_fee > 0) && (
                      <p className="mt-3 text-[10.5px] text-ink-soft">
                        Subtotal {inr(order.subtotal)}
                        {order.discount > 0 && ` · coupon −${inr(order.discount)}`}
                        {order.delivery_fee > 0 ? ` · delivery ${inr(order.delivery_fee)}` : " · free delivery"}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
