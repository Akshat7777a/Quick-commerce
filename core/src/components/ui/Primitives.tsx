import type { ReactNode } from "react";
import { cn } from "../../lib/format";

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

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("ui-skeleton", className)} aria-hidden="true" />;
}

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 100;
  return (
    <div
      className="ui-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={label}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

export function StateBlock({
  icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--lm-radius-card)] border border-line bg-card px-6 py-12 text-center">
      <span
        className={cn(
          "grid size-11 place-items-center rounded-full",
          tone === "error" ? "bg-clay/10 text-clay" : "bg-cream-2 text-forest",
        )}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-[18px] font-semibold leading-6 text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[14px] leading-5 text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
