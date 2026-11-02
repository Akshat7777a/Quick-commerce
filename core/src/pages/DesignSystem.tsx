import { useState } from "react";
import { AlertCircle, Inbox, Minus, Plus, PackageCheck, RotateCcw, ShoppingBasket } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, TextAreaField } from "../components/ui/Field";
import { ProgressBar, Skeleton, StateBlock } from "../components/ui/Primitives";
import { ProductTile, ProductTileSkeleton } from "../components/ui/ProductTile";
import { CategoryChip, CategoryTile } from "../components/ui/CategoryTile";
import { SearchBar } from "../components/ui/SearchBar";
import { Sheet } from "../components/ui/Sheet";
import { StatusTimeline } from "../components/ui/StatusTimeline";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { inr } from "../lib/format";
import type { Category, Product } from "../lib/types";

/**
 * Hidden component gallery (not linked in navigation). Every visual decision
 * should be visible here before it lands on a customer screen.
 */
const sampleProduct: Product = {
  id: "design-system-sample",
  category_id: null,
  name: "Sample product, 500 g",
  slug: "design-system-sample",
  description: null,
  price: 49,
  mrp: 60,
  unit: "500 g",
  image_url: null,
  stock: 0,
  is_active: true,
  is_featured: false,
};

const sampleCategory: Category = {
  id: "design-system-category",
  name: "Sample aisle",
  slug: "sample-aisle",
  description: null,
  emoji: null,
  image_url: null,
  sort_order: 0,
  is_active: true,
};

const swatches = [
  ["Page background", "--lm-bg"],
  ["Card surface", "--lm-surface"],
  ["Primary", "--lm-primary"],
  ["Primary pressed", "--lm-primary-pressed"],
  ["Primary tint", "--lm-primary-tint"],
  ["Accent", "--lm-accent"],
  ["Text", "--lm-text"],
  ["Text muted", "--lm-text-muted"],
  ["Disabled", "--lm-text-disabled"],
  ["Border", "--lm-border"],
  ["Success", "--lm-success"],
  ["Warning", "--lm-warning"],
  ["Error", "--lm-error"],
];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-8 first:border-t-0 first:pt-0">
      <h2 className="text-[18px] font-semibold leading-6 text-ink">{title}</h2>
      {note && <p className="mt-1 text-[12px] leading-4 text-ink-soft">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Local visual preview for the ADD control so the gallery never touches the cart. */
function AddPreview() {
  const [quantity, setQuantity] = useState(1);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="ui-add">ADD</button>
      <div className="ui-step" role="group" aria-label="Sample quantity">
        <button
          type="button"
          aria-label="Decrease sample quantity"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
        >
          <Minus className="size-3.5" />
        </button>
        <span>{quantity}</span>
        <button
          type="button"
          aria-label="Increase sample quantity"
          onClick={() => setQuantity((value) => Math.min(10, value + 1))}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <button type="button" className="ui-add" disabled>Out of stock</button>
    </div>
  );
}

export function DesignSystem() {
  const { settings } = useStoreSettings();
  const { toast } = useToast();
  const [term, setTerm] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fieldError, setFieldError] = useState("");

  return (
    <div className="container-page py-8">
      <header className="max-w-2xl">
        <p className="eyebrow">Internal</p>
        <h1 className="mt-2 text-[20px] font-semibold leading-7 text-ink">Design system</h1>
        <p className="mt-2 text-[14px] leading-5 text-ink-soft">
          Every token and component state in one place. This page is not linked from the storefront.
          Sample products are placeholder data and are shown out of stock so the gallery never
          touches a real basket.
        </p>
      </header>

      <div className="mt-8 max-w-4xl">
        <Section title="Colour" note="All values come from core/src/styles/tokens.css.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {swatches.map(([label, token]) => (
              <div key={token} className="rounded-[var(--lm-radius-card)] border border-line bg-card p-2">
                <div
                  className="h-14 rounded-[var(--lm-radius-control)] border border-line"
                  style={{ background: `var(${token})` }}
                />
                <p className="mt-2 text-[12px] font-medium leading-4 text-ink">{label}</p>
                <p className="text-[12px] leading-4 text-ink-soft">{token}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type scale" note="Nothing below 12px. Inter with Noto Sans Devanagari fallback.">
          <div className="space-y-3">
            <p className="text-[20px] font-semibold leading-7 text-ink">Page title, 20/28 semibold</p>
            <p className="text-[18px] font-semibold leading-6 text-ink">Section title, 18/24 semibold</p>
            <p className="text-[16px] font-semibold leading-5 text-ink">Price, 16/20 semibold</p>
            <p className="text-[14px] font-medium leading-5 text-ink">Product name, 14/20 medium</p>
            <p className="text-[14px] leading-5 text-ink">Body copy, 14/20 regular with a Devanagari sample: आटा, चावल, साबुन</p>
            <p className="text-[12px] leading-4 text-ink-soft">Small print, 12/16 muted</p>
            <p className="text-[16px] line-through leading-5 text-ink-soft">{inr(60)} MRP with a real discount</p>
          </div>
        </Section>

        <Section title="Buttons" note="44px default, 36px compact, visible focus ring, loading disables the press.">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="danger">Delete</Button>
            <Button size="sm">Compact</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
            <Button iconLeft={<ShoppingBasket className="size-4" />}>With icon</Button>
          </div>
          <div className="mt-4 max-w-sm">
            <Button block>Full width primary</Button>
          </div>
        </Section>

        <Section title="ADD control" note="Visual preview only. Real use is on product surfaces and reads the live cart.">
          <AddPreview />
        </Section>

        <Section title="Product card" note="Real MRP badge only. Out-of-stock state shown with a safe sample.">
          <div className="grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-3">
            <ProductTile product={sampleProduct} />
            <ProductTileSkeleton />
          </div>
        </Section>

        <Section title="Categories">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-20">
              <CategoryTile category={sampleCategory} />
            </div>
            <div className="w-20">
              <CategoryTile category={{ ...sampleCategory, id: "two", name: "Another aisle" }} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <CategoryChip label="All" active />
            <CategoryChip label="Snacks" />
            <CategoryChip label="Household" />
          </div>
        </Section>

        <Section title="Search">
          <div className="max-w-lg">
            <SearchBar value={term} onChange={setTerm} onSubmit={(value) => toast(`Searching for ${value || "everything"}`)} />
          </div>
        </Section>

        <Section title="Free delivery progress" note={`Current threshold from store settings: ${inr(settings.free_delivery_above)}.`}>
          <div className="max-w-lg space-y-4">
            <div>
              <ProgressBar value={0} max={settings.free_delivery_above} label="Empty basket" />
              <p className="mt-1 text-[12px] leading-4 text-ink-soft">0 of {inr(settings.free_delivery_above)}</p>
            </div>
            <div>
              <ProgressBar value={settings.free_delivery_above / 2} max={settings.free_delivery_above} label="Halfway" />
              <p className="mt-1 text-[12px] leading-4 text-ink-soft">Halfway to free delivery</p>
            </div>
            <div>
              <ProgressBar value={settings.free_delivery_above} max={settings.free_delivery_above} label="Free delivery reached" />
              <p className="mt-1 text-[12px] leading-4 text-ink-soft">Free delivery reached</p>
            </div>
          </div>
        </Section>

        <Section title="Order status timeline" note="Only real timestamps are printed; intermediate steps stay undated.">
          <div className="max-w-lg space-y-6">
            <StatusTimeline status="placed" placedAt="2026-11-02T10:15:00+05:30" />
            <StatusTimeline status="out_for_delivery" placedAt="2026-11-02T10:15:00+05:30" />
            <StatusTimeline status="cancelled" />
          </div>
        </Section>

        <Section title="Sheet and toast">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>Open sheet</Button>
            <Button variant="secondary" onClick={() => toast("Added to cart")}>Success toast</Button>
            <Button variant="secondary" onClick={() => toast("That coupon has expired", "error")}>Error toast</Button>
          </div>
        </Section>

        <Section title="Form fields">
          <div className="grid max-w-lg gap-4">
            <Field label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" hint="We call only about your order." />
            <Field
              label="Pincode"
              inputMode="numeric"
              placeholder="312601"
              value={fieldError ? "11" : undefined}
              onChange={() => setFieldError("11")}
              error={fieldError ? "Enter the full 6-digit PIN code." : undefined}
            />
            <TextAreaField label="Delivery address" rows={3} placeholder="Flat, building, street, landmark" autoComplete="street-address" />
          </div>
        </Section>

        <Section title="States">
          <div className="grid gap-4 lg:grid-cols-2">
            <StateBlock
              icon={<Inbox className="size-5" />}
              title="Nothing here yet"
              description="Once there is something to show, it appears here."
              action={<Button variant="secondary" size="sm">Browse the shop</Button>}
            />
            <StateBlock
              icon={<AlertCircle className="size-5" />}
              title="Could not load this"
              description="The connection dropped. Try again in a moment."
              tone="error"
              action={<Button size="sm" iconLeft={<RotateCcw className="size-3.5" />}>Retry</Button>}
            />
            <StateBlock
              icon={<PackageCheck className="size-5" />}
              title="This item has left the shelf"
              description="It may be sold out or moved. Explore the aisles for something similar."
              action={<Button size="sm">Back to the shop</Button>}
            />
            <div className="space-y-3 rounded-[var(--lm-radius-card)] border border-line bg-card p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </Section>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Sheet example"
        footer={<Button block onClick={() => setSheetOpen(false)}>Done</Button>}
      >
        <p className="text-[14px] leading-5 text-ink-soft">
          Backdrop tap and Escape close this panel. Focus stays inside while it is open and returns
          to the opener afterwards.
        </p>
      </Sheet>
    </div>
  );
}
