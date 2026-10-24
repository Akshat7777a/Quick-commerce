import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/format";
import { EmptyState, ProductGridSkeleton } from "../components/ui";
import { ProductCard } from "../components/ProductCard";
import type { Category, Product } from "../lib/types";

type Sort = "featured" | "price-asc" | "price-desc" | "name";

const sortLabels: Record<Sort, string> = {
  featured: "Recommended",
  "price-asc": "Price · low to high",
  "price-desc": "Price · high to low",
  name: "Name · A to Z",
};

export function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const categorySlug = params.get("category") ?? "";
  const sort = (params.get("sort") as Sort) || "featured";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  const setParamsSafe = useCallback(
    (patch: Record<string, string | null>) => {
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
    },
    [setParams],
  );

  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Debounced live search.
  useEffect(() => {
    if (searchInput.trim() === q) return;
    const timer = window.setTimeout(() => {
      setParamsSafe({ q: searchInput.trim() || null });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, q, setParamsSafe]);

  useEffect(() => {
    if (categorySlug && categories.length === 0) return;
    const category = categories.find((item) => item.slug === categorySlug);
    if (categorySlug && !category) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    api
      .listProducts({
        search: q,
        categoryId: category?.id ?? null,
        sort: sort in sortLabels ? sort : "featured",
      })
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
  }, [q, categorySlug, sort, categories]);

  const activeCategory = categories.find((item) => item.slug === categorySlug);
  const hasFilters = Boolean(q || categorySlug || sort !== "featured");

  return (
    <div className="container-page pt-8 sm:pt-12">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">The shop</p>
        <h1 className="text-balance text-4xl leading-[1.02] text-ink sm:text-5xl">
          {activeCategory ? activeCategory.name : "Everything you need, nothing you don't."}
        </h1>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-soft">
          {activeCategory?.description ??
            "Fresh produce, pantry staples and everyday rituals — stocked daily at your local L MART."}
        </p>
      </div>

      <div className="-mx-5 mt-7 border-y border-line bg-cream/95 px-5 py-3 sm:mx-0 sm:rounded-2xl sm:border sm:px-4 md:sticky md:top-[9.75rem] md:z-20 md:backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setParamsSafe({ q: searchInput.trim() || null });
            }}
            className="relative flex-1"
            role="search"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="input h-10 border-transparent bg-cream-2/70 pl-10 pr-9 focus:border-forest/40 focus:bg-card"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-soft transition hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          <div className="relative shrink-0">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
            <select
              value={sort in sortLabels ? sort : "featured"}
              onChange={(event) => setParamsSafe({ sort: event.target.value })}
              aria-label="Sort products"
              className="input h-10 w-[9.5rem] appearance-none border-transparent bg-cream-2/70 pl-8 pr-3 text-[11.5px] focus:bg-card sm:w-auto sm:pr-6"
            >
              {(Object.keys(sortLabels) as Sort[]).map((key) => (
                <option key={key} value={key}>
                  {sortLabels[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setParamsSafe({ category: null })}
            className={cn("chip h-8 px-3 text-[11.5px]", !categorySlug && "chip-active")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setParamsSafe({ category: category.slug })}
              className={cn(
                "chip h-8 px-3 text-[11.5px]",
                categorySlug === category.slug && "chip-active",
              )}
            >
              <span aria-hidden="true">{category.emoji}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-[11.5px] text-ink-soft">
          {loading ? "Loading the shelves…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
          {q && <span className="text-ink"> for “{q}”</span>}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className="text-[11.5px] text-ink-soft underline underline-offset-2 transition hover:text-clay"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4 pb-6">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title="Nothing on this shelf"
            description={
              q
                ? `We couldn't find anything for “${q}”. Try a shorter word or browse another aisle.`
                : "This aisle is empty for now. Try another category — new stock lands every morning."
            }
            action={
              <button
                type="button"
                onClick={() => setParams({}, { replace: true })}
                className="btn btn-primary"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
