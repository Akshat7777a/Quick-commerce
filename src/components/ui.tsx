import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "../lib/format";

/* ------------------------------------------------------------------ Modal --- */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-card shadow-lift animate-scale-in sm:rounded-[1.75rem]",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl text-ink sm:text-2xl">{title}</h2>
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full border border-line p-2 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>
        {footer && (
          <div className="border-t border-line bg-cream/60 px-5 py-4 sm:px-7">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ----------------------------------------------------------------- Toggle --- */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{description}</span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-forest" : "bg-ink/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all duration-200",
            checked ? "left-[1.4rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------ QtyStepper --- */
export function QtyStepper({
  value,
  onChange,
  max = 50,
  tone = "light",
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  tone?: "light" | "forest";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        tone === "forest"
          ? "border-cream/25 bg-cream/10 text-cream"
          : "border-line bg-card text-ink",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
        className={cn(
          "grid size-8 place-items-center rounded-full transition",
          tone === "forest" ? "hover:bg-cream/15" : "hover:bg-cream-2",
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-[13px] font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          "grid size-8 place-items-center rounded-full transition disabled:opacity-40",
          tone === "forest" ? "hover:bg-cream/15" : "hover:bg-cream-2",
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- EmptyState --- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-line bg-card/60 px-6 py-16 text-center">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-cream-2 text-ink-soft">
        {icon}
      </div>
      <h3 className="text-2xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- Spinner --- */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-hidden="true"
    />
  );
}

/* --------------------------------------------------------------- Skeleton --- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-cream-2", className)} />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-[1.25rem]" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- ProductImage --- */
export function ProductImage({
  src,
  alt,
  className,
  emoji = "🛍️",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  emoji?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#fffdf8,#efeade)]",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <span className="text-4xl opacity-80">{emoji}</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={cn("absolute inset-0 animate-pulse bg-cream-2", className)} aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(className, !loaded && "opacity-0")}
      />
    </>
  );
}
