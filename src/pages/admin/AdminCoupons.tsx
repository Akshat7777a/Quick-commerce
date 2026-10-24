import { useEffect, useState } from "react";
import { Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { cn, formatDate, inr } from "../../lib/format";
import { AdminPageHeader } from "./AdminLayout";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Modal, Spinner, Toggle } from "../../components/ui";
import type { Coupon } from "../../lib/types";

type FormState = {
  id?: string;
  code: string;
  description: string;
  discount_type: "percent" | "flat";
  discount_value: string;
  min_order: string;
  max_discount: string;
  usage_limit: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "10",
  min_order: "0",
  max_discount: "",
  usage_limit: "",
  expires_at: "",
  is_active: true,
};

function toDateInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCoupons(await api.listCoupons(true));
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't load coupons"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

  const openNew = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description ?? "",
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order: String(coupon.min_order),
      max_discount: coupon.max_discount === null ? "" : String(coupon.max_discount),
      usage_limit: coupon.usage_limit === null ? "" : String(coupon.usage_limit),
      expires_at: toDateInput(coupon.expires_at),
      is_active: coupon.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) return toast("Add a coupon code", "error");
    if (!form.discount_value || Number(form.discount_value) <= 0)
      return toast("Add a discount value", "error");

    setSaving(true);
    try {
      await api.saveCoupon({
        id: form.id,
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order: Number(form.min_order) || 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        starts_at: null,
        expires_at: form.expires_at
          ? new Date(`${form.expires_at}T23:59:59`).toISOString()
          : null,
        is_active: form.is_active,
      });
      toast(form.id ? "Coupon updated" : "Coupon created");
      setOpen(false);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't save this coupon"), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await api.deleteCoupon(target.id);
      toast(`${target.code} removed`);
      setTarget(null);
      await load();
    } catch (caught) {
      toast(errorMessage(caught, "Couldn't remove this coupon"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Offers"
        title="Coupons"
        description="Discount codes customers can apply in the basket."
        action={
          <button type="button" onClick={openNew} className="btn btn-primary btn-sm">
            <Plus className="size-3.5" /> New coupon
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-forest" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-line bg-card/60 px-6 py-16 text-center">
          <Ticket className="mx-auto size-6 text-ink-soft" strokeWidth={1.5} />
          <h2 className="mt-3 text-2xl text-ink">No coupons yet</h2>
          <p className="mt-1.5 text-[12px] text-ink-soft">
            A first-order offer is a good place to start.
          </p>
          <button type="button" onClick={openNew} className="btn btn-primary mt-5">
            Create the first coupon
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {coupons.map((coupon) => {
            const value =
              coupon.discount_type === "percent"
                ? `${coupon.discount_value}% off`
                : `${inr(coupon.discount_value)} off`;
            return (
              <div
                key={coupon.id}
                className="flex flex-wrap items-center gap-3 rounded-[1.1rem] border border-line bg-card px-4 py-3.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-forest/[0.06] text-forest">
                    <Ticket className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[12.5px] font-semibold tracking-wide text-ink">
                        {coupon.code}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide",
                          coupon.is_active
                            ? "bg-[#e8f4ec] text-[#1c6b3f]"
                            : "bg-clay/10 text-clay",
                        )}
                      >
                        {coupon.is_active ? "Live" : "Paused"}
                      </span>
                    </div>
                    <p className="truncate text-[10.5px] text-ink-soft">
                      {value} · min {inr(coupon.min_order)}
                      {coupon.max_discount ? ` · cap ${inr(coupon.max_discount)}` : ""} · used{" "}
                      {coupon.used_count}
                      {coupon.usage_limit ? `/${coupon.usage_limit}` : ""}
                      {coupon.expires_at ? ` · till ${formatDate(coupon.expires_at)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(coupon)}
                    aria-label={`Edit ${coupon.code}`}
                    className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-forest/30 hover:text-forest"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget(coupon)}
                    aria-label={`Delete ${coupon.code}`}
                    className="rounded-lg border border-line p-2 text-ink-soft transition hover:border-clay/30 hover:text-clay"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit coupon" : "New coupon"}
        description="Applied automatically to the basket total at checkout."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm px-5">
              {saving ? <Spinner /> : "Save coupon"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Code</span>
            <input
              value={form.code}
              onChange={(event) => patch({ code: event.target.value.toUpperCase() })}
              placeholder="FIRST15"
              className="input font-mono uppercase tracking-wider"
            />
          </label>
          <label className="block">
            <span className="label">Type</span>
            <select
              value={form.discount_type}
              onChange={(event) =>
                patch({ discount_type: event.target.value as FormState["discount_type"] })
              }
              className="input"
            >
              <option value="percent">Percentage</option>
              <option value="flat">Flat amount</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Description</span>
            <input
              value={form.description}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder="15% off your first order"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">
              {form.discount_type === "percent" ? "Discount (%)" : "Discount (₹)"}
            </span>
            <input
              type="number"
              min="1"
              value={form.discount_value}
              onChange={(event) => patch({ discount_value: event.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Minimum order (₹)</span>
            <input
              type="number"
              min="0"
              value={form.min_order}
              onChange={(event) => patch({ min_order: event.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Max discount (₹)</span>
            <input
              type="number"
              min="0"
              value={form.max_discount}
              onChange={(event) => patch({ max_discount: event.target.value })}
              placeholder="No cap"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Usage limit</span>
            <input
              type="number"
              min="0"
              value={form.usage_limit}
              onChange={(event) => patch({ usage_limit: event.target.value })}
              placeholder="Unlimited"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Expires on</span>
            <input
              type="date"
              value={form.expires_at}
              onChange={(event) => patch({ expires_at: event.target.value })}
              className="input"
            />
          </label>
          <div className="rounded-xl border border-line bg-cream/50 px-4 py-3">
            <Toggle
              checked={form.is_active}
              onChange={(value) => patch({ is_active: value })}
              label="Active"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title={`Delete ${target?.code ?? "coupon"}?`}
        description="Customers will no longer be able to use this code."
        busy={deleting}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
