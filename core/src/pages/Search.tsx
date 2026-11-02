import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Search as SearchIcon, X } from "lucide-react";
import { api } from "../lib/api";
import { useStoreSettings } from "../lib/store";
import { SearchBar } from "../components/ui/SearchBar";
import { ProductTile, ProductTileSkeleton } from "../components/ui/ProductTile";
import { StateBlock } from "../components/ui/Primitives";
import type { Category, Product } from "../lib/types";

const RECENT_KEY = "lmart.search.recent.v1";

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string").slice(0, 6);
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage blocked */
  }
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const { settings } = useStoreSettings();

  const [term, setTerm] = useState(q);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const remember = (value: string) => {
    const clean = value.trim();
    if (clean.length < 2) return;
    setRecent((current) => {
      const next = [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      writeRecent(next);
      return next;
    });
  };

  // Typing is debounced; the URL stays shareable.
  useEffect(() => {
    const trimmed = term.trim();
    const timer = window.setTimeout(() => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (trimmed) next.set("q", trimmed);
          else next.delete("q");
          return next;
        },
        { replace: true },
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [term, setParams]);

  useEffect(() => {
    let alive = true;
    api
      .listCategories()
      .then((rows) => {
        if (alive) setCategories(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!q) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .listProducts({ search: q })
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
  }, [q]);

  const matchedCategories = useMemo(
    () => (q ? categories.filter((category) => category.name.toLowerCase().includes(q.toLowerCase())) : []),
    [categories, q],
  );

  const whatsapp = settings.phone
    ? `https://wa.me/${settings.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hello L MART, I am looking for: ${q || "a product"}`,
      )}`
    : null;

  return (
    <div className="min-h-screen bg-cream pb-24">
      <h1 className="sr-only">Search products</h1>
      <div className="sticky top-0 z-20 border-b border-line bg-cream">
        <div className="container-page flex items-center gap-2 py-2">
          <Link
            to="/"
            aria-label="Close search"
            className="grid size-11 shrink-0 place-items-center rounded-[var(--lm-radius-control)] text-ink transition hover:bg-cream-2"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <SearchBar
              value={term}
              onChange={setTerm}
              onSubmit={remember}
              autoFocus
              label="Search products"
            />
          </div>
        </div>
      </div>

      <div className="container-page py-4">
        {!q && (
          <>
            {recent.length > 0 ? (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-medium leading-5 text-ink">Recent searches</h2>
                  <button
                    type="button"
                    onClick={() => {
                      writeRecent([]);
                      setRecent([]);
                    }}
                    className="text-[12px] leading-4 text-ink-soft underline underline-offset-2"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recent.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTerm(item)}
                      className="chip"
                    >
                      {item}
                      <X className="size-3.5 text-ink-soft" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <p className="text-[14px] leading-5 text-ink-soft">
                Type a product name to see what is on the shelves today.
              </p>
            )}
          </>
        )}

        {q && loading && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductTileSkeleton key={index} />
            ))}
          </div>
        )}

        {q && !loading && (
          <>
            {matchedCategories.length > 0 && (
              <section className="mb-4">
                <h2 className="text-[12px] font-medium leading-4 text-ink-soft">Categories</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {matchedCategories.map((category) => (
                    <Link key={category.id} to={`/shop?category=${category.slug}`} className="chip">
                      {category.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {products.length > 0 ? (
              <section>
                <h2 className="text-[12px] font-medium leading-4 text-ink-soft">
                  Products ({products.length})
                </h2>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((product, index) => (
                    <ProductTile key={product.id} product={product} priority={index < 4} />
                  ))}
                </div>
              </section>
            ) : (
              <StateBlock
                icon={<SearchIcon className="size-5" />}
                title={`No results for "${q}"`}
                description="Check the spelling, try a shorter word, or ask us to stock it."
                action={
                  whatsapp ? (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      <MessageCircle className="size-4" />
                      Request this product
                    </a>
                  ) : (
                    <Link to="/categories" className="btn btn-secondary">
                      Browse categories
                    </Link>
                  )
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
