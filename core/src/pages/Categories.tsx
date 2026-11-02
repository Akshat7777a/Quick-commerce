import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import { api } from "../lib/api";
import type { Category } from "../lib/types";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .listCategories()
      .then((list) => {
        if (alive) setCategories(list);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow">Categories</p>
      <h1 className="mt-2 text-3xl leading-tight text-ink sm:text-4xl">Shop by category</h1>
      <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-ink-soft">
        Every aisle in the store, from daily staples to snacks and household needs.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] animate-pulse rounded-[1.1rem] bg-cream-2" />
            ))
          : categories.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-[1.1rem] bg-cream-2"
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-ink-soft">
                    <ShoppingBasket className="size-6" strokeWidth={1.4} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
                  <p className="text-[14px] font-medium leading-tight text-cream">{category.name}</p>
                  <ArrowRight className="size-3.5 shrink-0 text-cream/70 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
      </div>

      {!loading && categories.length === 0 && (
        <p className="mt-8 text-[13.5px] text-ink-soft">No categories yet. Check back soon.</p>
      )}
    </div>
  );
}
