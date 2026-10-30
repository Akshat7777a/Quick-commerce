import { useEffect, useMemo, useState } from "react";
import { Banknote, Clock3, Copy, MapPin, MessageCircle, Phone, ReceiptText } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { deliveryHandoffText } from "../../lib/delivery";
import { useToast } from "../../lib/toast";
import { ORDER_STATUS, cn, formatDateTime, inr } from "../../lib/format";
import { AdminPageHeader } from "./AdminLayout";
import { Modal, ProductImage, Spinner } from "../../components/ui";
import type { Order, OrderStatus } from "../../lib/types";

const statuses = ["all", "placed", "packed", "out_for_delivery", "delivered", "cancelled"] as const;
type Filter = (typeof statuses)[number];

export function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>("placed");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await api.adminListOrders());
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't load orders"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    orders.forEach((order) => {
      map[order.status] = (map[order.status] ?? 0) + 1;
    });
    return map;
  }, [orders]);

  const openOrder = (order: Order) => {
    setSelected(order);
    setDraftStatus(order.status);
  };

  const handoffText = useMemo(
    () => (selected ? deliveryHandoffText(selected) : ""),
    [selected],
  );

  const copyHandoff = async () => {
    try {
      await navigator.clipboard.writeText(handoffText);
      setCopied(true);
      toast("Delivery info copied: paste it to your delivery person");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't access the clipboard. Select the text and copy it", "error");
    }
  };

  const updateStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.updateOrderStatus(selected.id, draftStatus);
      setOrders((current) =>
        current.map((order) =>
          order.id === selected.id ? { ...order, status: draftStatus } : order,
        ),
      );
      setSelected({ ...selected, status: draftStatus });
      toast(`${selected.order_number} marked as ${ORDER_STATUS[draftStatus]?.label ?? draftStatus}`);
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't update this order"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Every cash-on-delivery basket, from placed to delivered."
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={cn("chip h-8 px-3 text-[11px] capitalize", filter === status && "chip-active")}
          >
            {status === "all" ? "All" : (ORDER_STATUS[status]?.label ?? status)}
            <span className="ml-1 text-[9.5px] opacity-70">{counts[status] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-forest" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-line bg-card/60 px-6 py-16 text-center">
          <ReceiptText className="mx-auto size-6 text-ink-soft" strokeWidth={1.5} />
          <h2 className="mt-3 text-2xl text-ink">Nothing in this view</h2>
          <p className="mt-1.5 text-[12px] text-ink-soft">
            Orders will show up here the moment a customer checks out.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order) => {
            const meta = ORDER_STATUS[order.status] ?? ORDER_STATUS.placed;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => openOrder(order)}
                className="flex w-full flex-wrap items-center gap-3 rounded-[1.1rem] border border-line bg-card px-4 py-3.5 text-left transition hover:border-forest/25 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-semibold tracking-wide text-ink">
                      {order.order_number}
                    </p>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[9.5px]", meta.tone)}>
                      {meta.label}
                    </span>
                    {order.coupon_code && (
                      <span className="rounded-full bg-cream-2 px-2 py-0.5 text-[9px] uppercase tracking-wide text-ink-soft">
                        {order.coupon_code}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[10.5px] text-ink-soft">
                    {order.customer_name} · {order.phone} · {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="price text-[13px] font-semibold text-ink">{inr(order.total)}</p>
                  <p className="text-[10px] text-ink-soft">
                    {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) === 1 ? "" : "s"} · COD
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.order_number ?? "Order"}
        description={selected ? formatDateTime(selected.created_at) : undefined}
        wide
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink-soft">
              Collect <span className="font-semibold text-ink">{inr(selected?.total ?? 0)}</span> in cash
            </p>
            <div className="flex items-center gap-2">
              <select
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value as OrderStatus)}
                aria-label="Order status"
                className="input h-9 w-40 text-[11.5px]"
              >
                {Object.entries(ORDER_STATUS).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={updateStatus}
                disabled={saving || draftStatus === selected?.status}
                className="btn btn-primary btn-sm"
              >
                {saving ? <Spinner /> : "Update status"}
              </button>
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-cream/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.14em] text-ink-soft">
                  <MapPin className="size-3" /> Deliver to
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-ink">{selected.customer_name}</p>
                <p className="mt-0.5 whitespace-pre-line text-[11.5px] leading-relaxed text-ink-soft">
                  {selected.address}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-cream/40 p-3.5">
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-ink-soft">Contact</p>
                <a
                  href={`tel:${selected.phone}`}
                  className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-ink hover:underline"
                >
                  <Phone className="size-3.5 text-forest" /> {selected.phone}
                </a>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <Banknote className="size-3.5" /> Cash on delivery
                </p>
                {selected.delivery_slot && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
                    <Clock3 className="size-3.5 text-forest" /> Deliver by {selected.delivery_slot}
                  </p>
                )}
                {selected.notes && (
                  <p className="mt-2 rounded-lg bg-gold/10 px-2.5 py-2 text-[10.5px] leading-relaxed text-[#7a5a14]">
                    “{selected.notes}”
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="label">Items</p>
              <ul className="divide-y divide-line/70 rounded-xl border border-line">
                {(selected.order_items ?? []).map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="relative size-9 shrink-0 overflow-hidden rounded bg-cream-2">
                      <ProductImage
                        src={item.image_url}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] text-ink">{item.name}</p>
                      <p className="text-[10px] text-ink-soft">
                        {item.unit} · {inr(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="price text-[11.5px]">{inr(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="space-y-1.5 text-[11.5px]">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd className="price text-ink">{inr(selected.subtotal)}</dd>
              </div>
              {selected.discount > 0 && (
                <div className="flex justify-between text-[#1c6b3f]">
                  <dt>Discount {selected.coupon_code ? `(${selected.coupon_code})` : ""}</dt>
                  <dd className="price">−{inr(selected.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <dt>Delivery</dt>
                <dd className="price">{selected.delivery_fee === 0 ? "Free" : inr(selected.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-[13px]">
                <dt className="font-medium">Total</dt>
                <dd className="price font-semibold">{inr(selected.total)}</dd>
              </div>
            </dl>

            <div>
              <p className="label">Delivery handoff: for your delivery person</p>
              <div className="rounded-xl border border-forest/25 bg-forest/[0.04] p-3.5">
                <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap font-mono text-[10.5px] leading-relaxed text-ink">
                  {handoffText}
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={copyHandoff} className="btn btn-primary btn-sm">
                    <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy delivery info"}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(handoffText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <MessageCircle className="size-3.5" /> Share on WhatsApp
                  </a>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">
                  Everything in one block: who, where, when, what to collect in cash: copy it
                  straight into your delivery person's chat.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
