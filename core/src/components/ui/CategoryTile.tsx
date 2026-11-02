import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import { cn } from "../../lib/format";
import type { Category } from "../../lib/types";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-[var(--lm-radius-card)] border border-line bg-primary-tint">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <ShoppingBasket className="size-6 text-primary" strokeWidth={1.5} />
        )}
      </span>
      <span className="line-clamp-2 text-[12px] font-medium leading-4 text-ink">{category.name}</span>
    </Link>
  );
}

export function CategoryChip({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("chip", active && "chip-active")}
    >
      {label}
    </button>
  );
}

/** Horizontal category rail with a trailing "See all" tile. */
export function CategoryRail({ categories }: { categories: Category[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
      {categories.slice(0, 10).map((category) => (
        <div key={category.id} className="w-20 shrink-0">
          <CategoryTile category={category} />
        </div>
      ))}
      <Link
        to="/categories"
        className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
      >
        <span className="grid aspect-square w-full place-items-center rounded-[var(--lm-radius-card)] border border-dashed border-line bg-white text-primary">
          <ArrowRight className="size-5" strokeWidth={1.5} />
        </span>
        <span className="text-[12px] font-medium leading-4 text-ink">See all</span>
      </Link>
    </div>
  );
}
