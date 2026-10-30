import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  Package,
  ReceiptText,
  Ticket,
  TriangleAlert,
} from "lucide-react";
import { api } from "../../lib/api";
import { useStoreSettings } from "../../lib/store";
import { useToast } from "../../lib/toast";
import { ORDER_STATUS, cn, formatDateTime, inr } from "../../lib/format";
import { AdminPageHeader } from "./AdminLayout";
import { Spinner, Toggle } from "../../components/ui";
import type { Order, Product } from "../../lib/types";

const openStatuses = ["placed", "packed", "out_for_delivery"];

export function AdminDashboard() {
  const { settings, save } = useStoreSettings();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([api.adminListOrders(), api.listProducts({ includeInactive: true })])
      .then(([orderRows, productRows]) => {
        if (!alive) return;
        setOrders(orderRows);
        setProducts(productRows);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const today = new Date().toDateString();
  const todaysOrders = orders.filter(
    (order) => new Date(order.created_at).toDateString() === today && order.status !== "cancelled",
  );
  const revenueToday = todaysOrders.reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => openStatuses.includes(order.status));
  const lowStock = products.filter((product) => product.is_active && product.stock <= 8);

  const toggleStore = async (next: boolean) => {
    setSavingStore(true);
    try {
      await save({ is_open: next });
      toast(next ? "Store is now open for orders" : "Store closed: checkout is paused");
    } catch {
      toast("Couldn't update the store status", "error");
    } finally {
      setSavingStore(false);
    }
  };

  const stats = [
    {
      label: "Revenue today",
      value: inr(revenueToday),
      hint: `${todaysOrders.length} order${todaysOrders.length === 1 ? "" : "s"} paid in cash`,
      icon: Banknote,
    },
    {
      label: "Open orders",
      value: String(pending.length),
      hint: "Waiting to be packed or delivered",
      icon: ReceiptText,
    },
    {
      label: "Live products",
      value: String(products.filter((product) => product.is_active).length),
      hint: `${products.length} in the catalogue`,
      icon: Boxes,
    },
    {
      label: "Low stock",
      value: String(lowStock.length),
      hint: "8 units or fewer",
      icon: TriangleAlert,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="The shop at a glance"
        description="Today's takings, open orders and the shelves that need a refill."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.2rem] border border-line bg-card p-4">
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                {stat.label}
              </p>
              <stat.icon className="size-4 text-forest/60" strokeWidth={1.6} />
            </div>
            <p className="price mt-3 font-display text-[2rem] leading-none text-ink">
              {loading ? "…" : stat.value}
            </p>
            <p className="mt-2 text-[10.5px] leading-relaxed text-ink-soft">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-forest/[0.07] text-forest">
                <Package className="size-4" />
              </span>
              <div>
                <h2 className="text-xl text-ink">Store control</h2>
                <p className="text-[11px] text-ink-soft">Open or close online ordering instantly.</p>
              </div>
            </div>
            {savingStore && <Spinner className="text-forest" />}
          </div>

          <div className="mt-5 rounded-xl border border-line bg-cream/50 px-4 py-4">
            <Toggle
              checked={settings.is_open}
              onChange={toggleStore}
              disabled={savingStore}
              label={settings.is_open ? "Store is open" : "Store is closed"}
              description={
                settings.is_open
                  ? "Customers can place cash-on-delivery orders right now."
                  : "Browsing works, but checkout is disabled until you reopen."
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-xl bg-cream/70 px-3.5 py-3">
              <p className="text-ink-soft">Announcement</p>
              <p className="mt-1 line-clamp-2 text-ink">{settings.announcement ?? "Not set"}</p>
            </div>
            <div className="rounded-xl bg-cream/70 px-3.5 py-3">
              <p className="text-ink-soft">Free delivery above</p>
              <p className="price mt-1 text-ink">{inr(settings.free_delivery_above)}</p>
            </div>
          </div>

          <Link
            to="/admin/settings"
            className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-forest transition hover:underline"
          >
            Edit store settings <ArrowRight className="size-3.5" />
          </Link>
        </section>

        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl text-ink">Quick actions</h2>
            <Ticket className="size-4 text-ink-soft" />
          </div>
          <div className="mt-4 space-y-2">
            {[
              { to: "/admin/products", label: "Add or edit a product", copy: "Catalogue and stock" },
              { to: "/admin/orders", label: "Manage open orders", copy: `${pending.length} waiting` },
              { to: "/admin/coupons", label: "Create a coupon", copy: "Offers and discounts" },
              { to: "/admin/banners", label: "Update the homepage banner", copy: "Hero and campaigns" },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3 transition hover:border-forest/25 hover:bg-forest/[0.02]"
              >
                <div>
                  <p className="text-[12px] font-medium text-ink">{action.label}</p>
                  <p className="text-[10.5px] text-ink-soft">{action.copy}</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-ink-soft transition group-hover:text-forest" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="overflow-hidden rounded-[1.35rem] border border-line bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-xl text-ink">Recent orders</h2>
            <Link to="/admin/orders" className="text-[11px] text-forest hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="text-forest" />
            </div>
          ) : orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12px] text-ink-soft">
              No orders yet. Share the store link and the first one will land here.
            </p>
          ) : (
            <ul className="divide-y divide-line/80">
              {orders.slice(0, 5).map((order) => {
                const meta = ORDER_STATUS[order.status] ?? ORDER_STATUS.placed;
                return (
                  <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-ink">
                        {order.order_number}
                      </p>
                      <p className="truncate text-[10.5px] text-ink-soft">
                        {order.customer_name} · {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[9.5px]", meta.tone)}>
                        {meta.label}
                      </span>
                      <span className="price text-[12px] font-medium">{inr(order.total)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl text-ink">Running low</h2>
            <Link to="/admin/products" className="text-[11px] text-forest hover:underline">
              Restock
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-forest" />
            </div>
          ) : lowStock.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-ink-soft">
              Every shelf is comfortably stocked.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {lowStock.slice(0, 5).map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[11.5px] text-ink">{product.name}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9.5px]",
                      product.stock === 0
                        ? "bg-clay/10 text-clay"
                        : "bg-gold/15 text-[#8a6415]",
                    )}
                  >
                    {product.stock === 0 ? "Out" : `${product.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
