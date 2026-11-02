import { cn } from "../../lib/format";

const STEPS = [
  { key: "placed", label: "Placed" },
  { key: "packed", label: "Confirmed" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

/**
 * Order progress. Only real timestamps are shown: the order row stores when it
 * was placed and when it last changed, so intermediate steps never invent a
 * time they do not have.
 */
export function StatusTimeline({
  status,
  placedAt,
  updatedAt,
}: {
  status: string;
  placedAt?: string | null;
  updatedAt?: string | null;
}) {
  if (status === "cancelled") {
    return (
      <p className="rounded-[var(--lm-radius-control)] bg-clay/5 px-3 py-2 text-[12px] leading-4 text-clay">
        This order was cancelled. No cash was collected.
      </p>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.key === status);
  const timeFor = (key: string) => {
    if (key === "placed" && placedAt) return formatTime(placedAt);
    if (key === "delivered" && updatedAt && status === "delivered") return formatTime(updatedAt);
    return null;
  };

  return (
    <ol className="flex items-start gap-1">
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const time = done ? timeFor(step.key) : null;
        return (
          <li key={step.key} className="flex flex-1 flex-col gap-1">
            <span className={cn("h-1 rounded-full", done ? "bg-forest" : "bg-cream-2")} />
            <span
              className={cn(
                "text-[12px] leading-4",
                done ? "font-medium text-ink" : "text-ink-soft",
              )}
            >
              {step.label}
            </span>
            {time && <span className="text-[12px] leading-4 text-ink-soft">{time}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
