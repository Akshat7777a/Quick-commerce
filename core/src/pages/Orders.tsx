import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Banknote, MapPin, PackageCheck, RotateCcw } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { ORDER_STATUS, cn, formatDateTime, inr } from "../lib/format";
import { ProductImage, Spinner } from "../components/ui";
import { StatusTimeline } from "../components/ui/StatusTimeline";
import { Skeleton, StateBlock } from "../components/ui/Primitives";
import { Button } from "../components/ui/Button";
import type { Order, Product } from "../lib/types";

export function Orders() {
  const { user, loading: authLoading } = useAuth();
  const { add, openCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

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
    toast("Your usual is back in the cart");
    navigate("/checkout");
  };

  return (
    <div className="container-page pt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-7 text-ink">Your orders</h1>
          <p className="mt-1 text-[14px] leading-5 text-ink-soft">
            Every basket you have placed, and a one-tap way to order it again.
          </p>
        </div>
        {orders.length > 0 && (
          <Button variant="secondary" size="sm" onClick={openCart} className="lg:hidden">
            Open cart
          </Button>
        )}
      </div>

      <div className="mt-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <StateBlock
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
          <div className="space-y-3">
            {orders.map((order) => {
              const meta = ORDER_STATUS[order.status] ?? ORDER_STATUS.placed;
              const isOpen = expanded === order.id;
              const itemCount = order.order_items?.length ?? 0;
              return (
                <article key={order.id} className="rounded-[var(--lm-radius-card)] border border-line bg-white">
                  <div className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-semibold leading-5 text-ink">{order.order_number}</p>
                        <span className={cn("rounded-[var(--lm-radius-tag)] border px-1.5 py-0.5 text-[12px] leading-4", meta.tone)}>
                          {order.status === "packed" ? "Confirmed" : meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-4 text-ink-soft">
                        {formatDateTime(order.created_at)} · {itemCount} item{itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="price text-[16px] font-semibold leading-5 text-ink">{inr(order.total)}</p>
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-[12px] leading-4 text-ink-soft">
                        <Banknote className="size-3.5" aria-hidden="true" /> Cash on delivery
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-2">
                      {(order.order_items ?? []).slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className="flex items-center gap-1.5 rounded-[var(--lm-radius-control)] border border-line px-1.5 py-1 text-[12px] leading-4 text-ink"
                        >
                          <span className="relative size-6 shrink-0 overflow-hidden rounded bg-white">
                            <ProductImage src={item.image_url} alt={item.name} className="size-full object-contain" />
                          </span>
                          <span className="max-w-[8rem] truncate">{item.name}</span>
                          <span className="text-ink-soft">x{item.quantity}</span>
                        </span>
                      ))}
                      {itemCount > 4 && (
                        <span className="self-center text-[12px] leading-4 text-ink-soft">+{itemCount - 4} more</span>
                      )}
                    </div>

                    <div className="mt-3">
                      <StatusTimeline
                        status={order.status}
                        placedAt={order.created_at}
                        updatedAt={order.updated_at}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <p className="flex max-w-md items-start gap-1.5 text-[12px] leading-4 text-ink-soft">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-forest" aria-hidden="true" />
                        {order.address}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          {isOpen ? "Hide details" : "View details"}
                        </button>
                        <Button size="sm" onClick={() => reorder(order)} iconLeft={<RotateCcw className="size-3.5" />}>
                          Order again
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 rounded-[var(--lm-radius-control)] bg-cream-2/60 px-3 py-2 text-[12px] leading-4 text-ink-soft">
                        <ul className="space-y-1">
                          {(order.order_items ?? []).map((item) => (
                            <li key={item.id} className="flex justify-between gap-3">
                              <span className="truncate">
                                {item.quantity} x {item.name}
                              </span>
                              <span className="price shrink-0 text-ink">{inr(item.price * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 border-t border-line pt-2">
                          <p className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="price">{inr(order.subtotal)}</span>
                          </p>
                          {order.discount > 0 && (
                            <p className="flex justify-between">
                              <span>Coupon {order.coupon_code ?? ""}</span>
                              <span className="price">-{inr(order.discount)}</span>
                            </p>
                          )}
                          <p className="flex justify-between">
                            <span>Delivery</span>
                            <span className="price">
                              {order.delivery_fee === 0 ? "Free" : inr(order.delivery_fee)}
                            </span>
                          </p>
                          <p className="mt-1 flex justify-between text-[14px] font-semibold text-ink">
                            <span>Total</span>
                            <span className="price">{inr(order.total)}</span>
                          </p>
                          {order.delivery_slot && (
                            <p className="mt-1">Delivery slot: {order.delivery_slot}</p>
                          )}
                        </div>
                      </div>
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
