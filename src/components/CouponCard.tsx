import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { inr } from "../lib/format";
import { useToast } from "../lib/toast";
import type { Coupon } from "../lib/types";

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const headline =
    coupon.discount_type === "percent"
      ? `${coupon.discount_value}% off`
      : `${inr(coupon.discount_value)} off`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast(`Code ${coupon.code} copied`);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast(`Use code ${coupon.code} at checkout`, "info");
    }
  };

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.2rem] border border-dashed border-ink/15 bg-card p-5">
      <div className="absolute -left-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-cream" />
      <div className="absolute -right-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-cream" />
      <div>
        <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-clay">Offer</p>
        <p className="mt-2 font-display text-[2rem] leading-none text-ink">{headline}</p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
          {coupon.description ?? "A little something off your basket."}
        </p>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="text-[10.5px] text-ink-soft">
          Min. order {inr(coupon.min_order)}
          {coupon.max_discount ? ` · up to ${inr(coupon.max_discount)}` : ""}
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-forest/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-forest transition hover:bg-forest hover:text-cream"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {coupon.code}
        </button>
      </div>
    </div>
  );
}
