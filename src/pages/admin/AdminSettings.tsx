import { useEffect, useState } from "react";
import { RotateCcw, Store } from "lucide-react";
import { useStoreSettings } from "../../lib/store";
import { useDemoMode } from "../../lib/demo-mode";
import { useToast } from "../../lib/toast";
import { resetDemoData } from "../../lib/demo";
import { AdminPageHeader } from "./AdminLayout";
import { Spinner, Toggle } from "../../components/ui";

type FormState = {
  store_name: string;
  tagline: string;
  announcement: string;
  phone: string;
  address: string;
  delivery_fee: string;
  free_delivery_above: string;
  min_order: string;
  delivery_estimate: string;
};

export function AdminSettings() {
  const { settings, save } = useStoreSettings();
  const { toast } = useToast();
  const isDemo = useDemoMode();
  const [form, setForm] = useState<FormState>({
    store_name: settings.store_name,
    tagline: settings.tagline ?? "",
    announcement: settings.announcement ?? "",
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    delivery_fee: String(settings.delivery_fee),
    free_delivery_above: String(settings.free_delivery_above),
    min_order: String(settings.min_order),
    delivery_estimate: settings.delivery_estimate ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);

  useEffect(() => {
    setForm({
      store_name: settings.store_name,
      tagline: settings.tagline ?? "",
      announcement: settings.announcement ?? "",
      phone: settings.phone ?? "",
      address: settings.address ?? "",
      delivery_fee: String(settings.delivery_fee),
      free_delivery_above: String(settings.free_delivery_above),
      min_order: String(settings.min_order),
      delivery_estimate: settings.delivery_estimate ?? "",
    });
  }, [settings]);

  const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await save({
        store_name: form.store_name.trim() || "L MART ONLINE",
        tagline: form.tagline.trim() || null,
        announcement: form.announcement.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        delivery_fee: Number(form.delivery_fee) || 0,
        free_delivery_above: Number(form.free_delivery_above) || 0,
        min_order: Number(form.min_order) || 0,
        delivery_estimate: form.delivery_estimate.trim() || null,
      });
      toast("Store settings saved");
    } catch {
      toast("Couldn't save the settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStore = async (next: boolean) => {
    setTogglingStore(true);
    try {
      await save({ is_open: next });
      toast(next ? "Store is open for orders" : "Store closed — checkout paused");
    } catch {
      toast("Couldn't update the store status", "error");
    } finally {
      setTogglingStore(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Store settings"
        description="Opening hours, delivery charges and the details that appear across the storefront."
      />

      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-forest/[0.07] text-forest">
              <Store className="size-4" />
            </span>
            <div>
              <h2 className="text-xl text-ink">Taking orders</h2>
              <p className="text-[11px] text-ink-soft">
                Closing the store hides checkout but keeps browsing available.
              </p>
            </div>
            {togglingStore && <Spinner className="ml-auto text-forest" />}
          </div>
          <div className="mt-4 rounded-xl border border-line bg-cream/50 px-4 py-4">
            <Toggle
              checked={settings.is_open}
              onChange={toggleStore}
              disabled={togglingStore}
              label={settings.is_open ? "Store is open" : "Store is closed"}
              description={
                settings.is_open
                  ? "Customers can place cash-on-delivery orders right now."
                  : "Checkout is paused until you reopen."
              }
            />
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <h2 className="text-xl text-ink">Storefront copy</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Store name</span>
              <input
                value={form.store_name}
                onChange={(event) => patch({ store_name: event.target.value })}
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => patch({ phone: event.target.value })}
                placeholder="+91 98765 43210"
                className="input"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Tagline</span>
              <input
                value={form.tagline}
                onChange={(event) => patch({ tagline: event.target.value })}
                placeholder="Everyday essentials from your neighbourhood store."
                className="input"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Announcement bar</span>
              <input
                value={form.announcement}
                onChange={(event) => patch({ announcement: event.target.value })}
                placeholder="Free delivery on orders above ₹499 · Cash on delivery"
                className="input"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Store address</span>
              <textarea
                rows={2}
                value={form.address}
                onChange={(event) => patch({ address: event.target.value })}
                placeholder="L MART, 12 Market Road, Bengaluru 560001"
                className="input resize-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <h2 className="text-xl text-ink">Delivery &amp; pricing</h2>
          <p className="mt-1 text-[11px] text-ink-soft">
            The delivery fee is waived automatically above the free-delivery threshold.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="label">Delivery fee (₹)</span>
              <input
                type="number"
                min="0"
                value={form.delivery_fee}
                onChange={(event) => patch({ delivery_fee: event.target.value })}
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">Free delivery above (₹)</span>
              <input
                type="number"
                min="0"
                value={form.free_delivery_above}
                onChange={(event) => patch({ free_delivery_above: event.target.value })}
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
            <label className="block sm:col-span-3">
              <span className="label">Delivery estimate</span>
              <input
                value={form.delivery_estimate}
                onChange={(event) => patch({ delivery_estimate: event.target.value })}
                placeholder="Same-day delivery, 9 AM – 9 PM"
                className="input"
              />
            </label>
          </div>
        </section>

        <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-line bg-card px-5 py-4">
          <p className="text-[11px] text-ink-soft">
            Settings are saved to Supabase and applied across the storefront instantly.
          </p>
          <button type="submit" disabled={saving} className="btn btn-primary shrink-0">
            {saving ? <Spinner /> : "Save settings"}
          </button>
        </div>
      </form>

      {isDemo && (
        <section className="mt-5 rounded-[1.35rem] border border-dashed border-clay/30 bg-clay/[0.04] p-5">
          <h2 className="text-xl text-ink">Preview data</h2>
          <p className="mt-1 max-w-lg text-[11.5px] leading-relaxed text-ink-soft">
            Store edits, products and orders are stored in this browser while the Supabase schema is
            missing. Reset to return to the original sample catalogue.
          </p>
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              window.location.reload();
            }}
            className="btn btn-secondary btn-sm mt-3"
          >
            <RotateCcw className="size-3.5" /> Reset preview data
          </button>
        </section>
      )}
    </div>
  );
}
