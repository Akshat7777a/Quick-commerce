import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

export function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center sm:py-28">
      <span className="grid size-12 place-items-center rounded-full bg-cream-2 text-forest">
        <Compass className="size-5" strokeWidth={1.6} />
      </span>
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-2 max-w-lg text-balance text-4xl leading-[1.03] text-ink sm:text-5xl">
        This aisle doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
        The page may have moved, or the link is a little off. The shelves are still where you left
        them.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <Link to="/" className="btn btn-primary">
          <ArrowLeft className="size-4" />
          Back to the store
        </Link>
        <Link to="/shop" className="btn btn-secondary">
          Browse products
        </Link>
      </div>
    </div>
  );
}
