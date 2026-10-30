import { useEffect, useMemo, useState } from "react";
import { IndianRupee, Mail, Phone, ReceiptText, Search, Users } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { ORDER_STATUS, cn, formatDate, formatDateTime, inr } from "../../lib/format";
import { AdminPageHeader } from "./AdminLayout";
import { Modal, Spinner } from "../../components/ui";
import type { Customer, Order } from "../../lib/types";

function initials(name: string | null, email: string | null): string {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function AdminCustomers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Order[] | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .adminListCustomers()
      .then((rows) => {
        if (mounted) setCustomers(rows);
      })
      .catch((caught) => {
        toast(errorMessage(caught, "Couldn't load customers"), "error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      [customer.full_name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [customers, search]);

  const totals = useMemo(
    () => ({
      people: customers.length,
      revenue: customers.reduce((sum, customer) => sum + Number(customer.total_spent), 0),
      orders: customers.reduce((sum, customer) => sum + Number(customer.total_orders), 0),
    }),
    [customers],
  );

  const openCustomer = async (customer: Customer) => {
    setSelected(customer);
    setHistory(null);
    try {
      const orders = await api.listOrders(customer.id);
      setHistory(orders);
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't load this customer's orders"), "error");
      setHistory([]);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="People"
        title="Customers"
        description="Your customer database: contact details, order history and lifetime value, all in one place."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Customers", value: String(totals.people), icon: Users },
          { label: "Lifetime revenue", value: inr(totals.revenue), icon: IndianRupee },
          { label: "Orders placed", value: String(totals.orders), icon: ReceiptText },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[1.1rem] border border-line bg-card px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.14em] text-ink-soft">
              <stat.icon className="size-3" /> {stat.label}
            </p>
            <p className="mt-1.5 text-[1.35rem] font-semibold leading-none text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone or email…"
          className="input h-11 pl-10"
          aria-label="Search customers"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-forest" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-line bg-card/60 px-6 py-16 text-center">
          <Users className="mx-auto size-6 text-ink-soft" strokeWidth={1.5} />
          <h2 className="mt-3 text-2xl text-ink">No customers found</h2>
          <p className="mt-1.5 text-[12px] text-ink-soft">
            {customers.length === 0
              ? "People appear here as soon as they create an account."
              : "Try a different name, phone number or email."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => void openCustomer(customer)}
              className="flex w-full flex-wrap items-center gap-3 rounded-[1.1rem] border border-line bg-card px-4 py-3.5 text-left transition hover:border-forest/25 sm:px-5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream-2 text-[11px] font-semibold tracking-wide text-forest">
                {initials(customer.full_name, customer.email)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold tracking-wide text-ink">
                  {customer.full_name ?? "Customer"}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-ink-soft">
                  {customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1 hover:text-forest"
                    >
                      <Phone className="size-3" /> {customer.phone}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 opacity-60">
                      <Phone className="size-3" /> No phone
                    </span>
                  )}
                  {customer.email && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <Mail className="size-3" /> {customer.email}
                    </span>
                  )}
                  <span>Joined {formatDate(customer.joined_at)}</span>
                </p>
              </div>

              <div className="text-right">
                <p className="price text-[13px] font-semibold text-ink">{inr(Number(customer.total_spent))}</p>
                <p className="text-[10px] text-ink-soft">
                  {Number(customer.total_orders)} order{Number(customer.total_orders) === 1 ? "" : "s"}
                  {customer.last_order_number ? ` · last ${customer.last_order_number}` : " · none yet"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null);
          setHistory(null);
        }}
        title={selected?.full_name ?? "Customer"}
        description={
          selected
            ? [selected.email, selected.phone, `Joined ${formatDate(selected.joined_at)}`]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        wide
        footer={
          selected ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-soft">
              <span>
                <span className="font-semibold text-ink">{inr(Number(selected.total_spent))}</span> lifetime
                spend across {Number(selected.total_orders)} order
                {Number(selected.total_orders) === 1 ? "" : "s"}
                {Number(selected.delivered_orders) > 0
                  ? ` · ${Number(selected.delivered_orders)} delivered`
                  : ""}
              </span>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="btn btn-secondary btn-sm">
                  <Phone className="size-3.5" /> Call customer
                </a>
              )}
            </div>
          ) : null
        }
      >
        {selected && (
          <div>
            {history === null ? (
              <div className="flex justify-center py-10">
                <Spinner className="text-forest" />
              </div>
            ) : history.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12px] text-ink-soft">
                No orders yet. This account hasn't checked out.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((order) => {
                  const meta = ORDER_STATUS[order.status] ?? ORDER_STATUS.placed;
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-line bg-cream/40 px-3.5 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-semibold tracking-wide text-ink">
                            {order.order_number}
                          </span>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[9.5px]", meta.tone)}>
                            {meta.label}
                          </span>
                        </div>
                        <span className="price text-[12px] font-semibold text-ink">{inr(order.total)}</span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-ink-soft">
                        {formatDateTime(order.created_at)} ·{" "}
                        {(order.order_items?.length ?? 0)} item
                        {(order.order_items?.length ?? 0) === 1 ? "" : "s"} ·{" "}
                        {order.address}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
