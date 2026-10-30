import { useEffect, useState } from "react";
import { Clock3, MapPin, Palette, RotateCcw, Store } from "lucide-react";
import { useStoreSettings } from "../../lib/store";
import { useDemoMode } from "../../lib/demo-mode";
import { useToast } from "../../lib/toast";
import { resetDemoData } from "../../lib/demo";
import { STORE_AREA_LABEL, parsePincodes } from "../../lib/delivery";
import { THEME_PRESETS, type ThemeMode } from "../../lib/theme";
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
  theme_mode: ThemeMode;
  theme_preset: string;
  serviceable_pincodes: string;
  delivery_options_text: string;
};

const modeOptions: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function settingsToForm(settings: ReturnType<typeof useStoreSettings>["settings"]): FormState {
  return {
    store_name: settings.store_name,
    tagline: settings.tagline ?? "",
    announcement: settings.announcement ?? "",
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    delivery_fee: String(settings.delivery_fee),
    free_delivery_above: String(settings.free_delivery_above),
    min_order: String(settings.min_order),
    delivery_estimate: settings.delivery_estimate ?? "",
    theme_mode: settings.theme_mode ?? "light",
    theme_preset: settings.theme_preset ?? "default",
    serviceable_pincodes: parsePincodes(settings.serviceable_pincodes).join(", "),
    delivery_options_text: (settings.delivery_options ?? []).join("\n"),
  };
}

export function AdminSettings() {
  const { settings, save } = useStoreSettings();
  const { toast } = useToast();
  const isDemo = useDemoMode();
  const [form, setForm] = useState<FormState>(() => settingsToForm(settings));
  const [saving, setSaving] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);

  useEffect(() => {
    setForm(settingsToForm(settings));
  }, [settings]);

  const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const pincodes = parsePincodes(form.serviceable_pincodes);
    if (pincodes.length === 0) {
      toast("Add at least one PIN code for the delivery area", "error");
      return;
    }
    const invalidPin = pincodes.find((code) => !/^\d{6}$/.test(code));
    if (invalidPin) {
      toast(`"${invalidPin}" is not a valid 6-digit PIN code`, "error");
      return;
    }
    const deliveryOptions = form.delivery_options_text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (deliveryOptions.length === 0) {
      toast("Keep at least one delivery time option", "error");
      return;
    }

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
        theme_mode: form.theme_mode,
        theme_preset: form.theme_preset,
        serviceable_pincodes: pincodes.join(", "),
        delivery_options: deliveryOptions,
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
      toast(next ? "Store is open for orders" : "Store closed: checkout paused");
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
        description="Opening hours, theme, delivery area and the details that appear across the storefront."
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
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-forest/[0.07] text-forest">
              <Palette className="size-4" />
            </span>
            <div>
              <h2 className="text-xl text-ink">Theme & appearance</h2>
              <p className="text-[11px] text-ink-soft">
                Switch the store's look for a festival or season. Changes apply instantly for
                everyone. Customers can still toggle light/dark themselves in the header.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">Default mode</span>
              <div className="flex gap-1.5">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patch({ theme_mode: option.value })}
                    className={
                      "chip flex-1 justify-center px-4 text-base " +
                      (form.theme_mode === option.value ? "chip-active" : "")
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-soft">
                "System" follows each visitor's device setting.
              </p>
            </div>

            <div>
              <span className="label">Colour preset</span>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {THEME_PRESETS.map((preset) => {
                  const active = form.theme_preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => patch({ theme_preset: preset.id })}
                      className={
                        "flex min-h-11 items-center gap-2 rounded-md border px-2.5 py-2 text-left transition " +
                        (active
                          ? "border-forest bg-forest/[0.06]"
                          : "border-line hover:border-ink/30")
                      }
                    >
                      <span className="flex shrink-0 -space-x-1">
                        {preset.swatch.map((color) => (
                          <span
                            key={color}
                            className="size-3.5 rounded-full border border-card"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="truncate text-[11px] text-ink">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
                placeholder="Enter the shop's address and PIN code"
                className="input resize-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-forest/[0.07] text-forest">
              <MapPin className="size-4" />
            </span>
            <div>
              <h2 className="text-xl text-ink">Delivery area (PIN codes)</h2>
              <p className="text-[11px] text-ink-soft">
                Only these PIN codes can place an order. Everything else is rejected at checkout
                and on the server. Store location: {STORE_AREA_LABEL}.
              </p>
            </div>
          </div>
          <label className="mt-4 block">
            <span className="label">Serviceable PIN codes (comma separated)</span>
            <input
              value={form.serviceable_pincodes}
              onChange={(event) => patch({ serviceable_pincodes: event.target.value })}
              placeholder="312601, 312001, 313001"
              inputMode="numeric"
              className="input"
            />
          </label>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-soft">
            Currently serving {parsePincodes(form.serviceable_pincodes).length} PIN code
            {parsePincodes(form.serviceable_pincodes).length === 1 ? "" : "s"}. Add more codes
            here whenever you expand delivery.
          </p>
        </section>

        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-forest/[0.07] text-forest">
              <Clock3 className="size-4" />
            </span>
            <div>
              <h2 className="text-xl text-ink">Delivery time options</h2>
              <p className="text-[11px] text-ink-soft">
                One option per line: customers pick one at checkout (instant, 1–2 hours, or fixed
                slots like 10:00 AM – 12:00 PM).
              </p>
            </div>
          </div>
          <label className="mt-4 block">
            <span className="label">Options (one per line)</span>
            <textarea
              rows={7}
              value={form.delivery_options_text}
              onChange={(event) => patch({ delivery_options_text: event.target.value })}
              placeholder={"Instant · within 30 minutes\nWithin 1–2 hours\n10:00 AM – 12:00 PM"}
              className="input resize-none leading-relaxed"
            />
          </label>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-soft">
            {form.delivery_options_text
              .split("\n")
              .filter((line) => line.trim()).length}{" "}
            option
            {form.delivery_options_text.split("\n").filter((line) => line.trim()).length === 1
              ? ""
              : "s"}{" "}
            will be offered.
          </p>
        </section>

        <section className="rounded-[1.35rem] border border-line bg-card p-5">
          <h2 className="text-xl text-ink">Delivery & pricing</h2>
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
