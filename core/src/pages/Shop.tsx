import { useEffect, useMemo, useState } from "react";
import { useNavigationType, useSearchParams } from "react-router-dom";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/format";
import { ProductTile, ProductTileSkeleton } from "../components/ui/ProductTile";
import { Sheet } from "../components/ui/Sheet";
import { Button } from "../components/ui/Button";
import { StateBlock } from "../components/ui/Primitives";
import type { Category, Product } from "../lib/types";

type Sort = "featured" | "price-asc" | "price-desc" | "name";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

const SCROLL_KEY = "lmart.scroll.shop.v1";
const PAGE_SIZE = 24;

export function Shop() {
  const [params, setParams] = useSearchParams();
  const categorySlug = params.get("category") ?? "";
  const sortParam = params.get("sort");
  const sort: Sort = SORTS.some((option) => option.value === sortParam)
    ? (sortParam as Sort)
    : "featured";
  const navigationType = useNavigationType();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ offers: false, inStock: false });
  const [draft, setDraft] = useState(filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const activeCategory = categories.find((category) => category.slug === categorySlug);

  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (categorySlug && categories.length === 0) return;
    let alive = true;
    setLoading(true);
    setVisible(PAGE_SIZE);

    if (categorySlug && !activeCategory) {
      setProducts([]);
      setLoading(false);
      return;
    }

    api
      .listProducts({ categoryId: activeCategory?.id ?? null, sort })
      .then((rows) => {
        if (alive) setProducts(rows);
      })
      .catch(() => {
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [categorySlug, categories, activeCategory, sort]);

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        if (filters.offers && !(product.mrp != null && product.mrp > product.price)) return false;
        if (filters.inStock && product.stock <= 0) return false;
        return true;
      }),
    [products, filters],
  );

  const shown = filtered.slice(0, visible);
  const activeFilterCount = Number(filters.offers) + Number(filters.inStock);

  // Returning from a product puts the reader back where they were.
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      } catch {
        /* storage blocked */
      }
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  useEffect(() => {
    if (loading || navigationType !== "POP") return;
    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem(SCROLL_KEY) ?? 0);
    } catch {
      saved = 0;
    }
    if (saved <= 0) return;
    const timer = window.setTimeout(() => window.scrollTo({ top: saved }), 40);
    return () => window.clearTimeout(timer);
  }, [loading, navigationType]);

  const update = (patch: Record<string, string | null>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(patch).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-20 border-b border-line bg-cream">
        <div className="container-page flex items-center gap-2 py-2">
          <h1 className="min-w-0 flex-1 truncate text-[20px] font-semibold leading-7 text-ink">
            {activeCategory ? activeCategory.name : "All products"}
          </h1>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(event) => update({ sort: event.target.value })}
            className="input h-10 w-auto max-w-[9.5rem] text-[12px]"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Filters"
            onClick={() => {
              setDraft(filters);
              setFilterOpen(true);
            }}
            iconLeft={<SlidersHorizontal className="size-4" />}
          >
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </div>
      </div>

      <div className="container-page mt-3 flex gap-3">
        <aside className="w-[88px] shrink-0 sm:w-[180px]">
          <nav
            aria-label="Categories"
            className="no-scrollbar max-h-[calc(100vh-140px)] overflow-y-auto sm:sticky sm:top-16"
          >
            <button
              type="button"
              onClick={() => update({ category: null })}
              aria-current={!categorySlug ? "page" : undefined}
              className={cn(
                "relative flex w-full items-center rounded-[var(--lm-radius-control)] px-2 py-2 text-left text-[12px] leading-4",
                !categorySlug ? "bg-primary-tint font-medium text-forest" : "text-ink-soft hover:text-ink",
              )}
            >
              {!categorySlug && <span className="absolute inset-y-1 left-0 w-[3px] rounded bg-forest" />}
              All
            </button>
            {categories.map((category) => {
              const active = categorySlug === category.slug;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => update({ category: category.slug })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex w-full items-center rounded-[var(--lm-radius-control)] px-2 py-2 text-left text-[12px] leading-4",
                    active ? "bg-primary-tint font-medium text-forest" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {active && <span className="absolute inset-y-1 left-0 w-[3px] rounded bg-forest" />}
                  <span className="line-clamp-2">{category.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <h2 className="sr-only">Products</h2>
          <p className="text-[12px] leading-4 text-ink-soft">
            {loading
              ? "Loading products"
              : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
          </p>

          <div className="mt-2">
            {loading ? (
              <div className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 sm:gap-x-3 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductTileSkeleton key={index} />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <StateBlock
                icon={<SearchX className="size-5" />}
                title="Nothing on this shelf"
                description={
                  activeFilterCount > 0
                    ? "No products match these filters. Clear them to see the whole aisle."
                    : "This aisle is empty for now. Try another category."
                }
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFilters({ offers: false, inStock: false });
                      if (categorySlug) update({ category: null });
                    }}
                  >
                    Reset
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 sm:gap-x-3 xl:grid-cols-4">
                {shown.map((product, index) => (
                  <ProductTile key={product.id} product={product} priority={index < 4} />
                ))}
              </div>
            )}
          </div>

          {!loading && filtered.length > visible && (
            <Button
              variant="secondary"
              block
              className="mt-6"
              onClick={() => setVisible((current) => current + PAGE_SIZE)}
            >
              Load more
            </Button>
          )}
        </div>
      </div>

      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDraft({ offers: false, inStock: false })}
            >
              Clear
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setFilters(draft);
                setVisible(PAGE_SIZE);
                setFilterOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4 rounded-[var(--lm-radius-control)] border border-line px-3 py-3">
            <span className="text-[14px] leading-5 text-ink">Offers only</span>
            <input
              type="checkbox"
              checked={draft.offers}
              onChange={(event) => setDraft({ ...draft, offers: event.target.checked })}
              className="size-5 accent-[var(--lm-primary)]"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-[var(--lm-radius-control)] border border-line px-3 py-3">
            <span className="text-[14px] leading-5 text-ink">In stock only</span>
            <input
              type="checkbox"
              checked={draft.inStock}
              onChange={(event) => setDraft({ ...draft, inStock: event.target.checked })}
              className="size-5 accent-[var(--lm-primary)]"
            />
          </label>
        </div>
      </Sheet>
    </div>
  );
}
