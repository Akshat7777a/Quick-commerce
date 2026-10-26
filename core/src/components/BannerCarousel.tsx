import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "../lib/format";
import type { Banner } from "../lib/types";

const tones = {
  forest: {
    wrapper: "bg-forest text-cream",
    overlay: "bg-gradient-to-r from-[#0b241b] via-[#0b241b]/85 to-[#0b241b]/15 sm:to-[#0b241b]/5",
    eyebrow: "text-gold",
    subtitle: "text-cream/70",
    button: "bg-cream text-forest hover:bg-gold hover:text-[#2a1f08]",
    control: "border-cream/25 text-cream hover:bg-cream/10",
    dot: "bg-cream/30",
    dotActive: "bg-gold",
  },
  ink: {
    wrapper: "bg-ink text-cream",
    overlay: "bg-gradient-to-r from-ink via-ink/85 to-ink/20",
    eyebrow: "text-gold",
    subtitle: "text-cream/70",
    button: "bg-cream text-ink hover:bg-gold hover:text-[#2a1f08]",
    control: "border-cream/25 text-cream hover:bg-cream/10",
    dot: "bg-cream/30",
    dotActive: "bg-gold",
  },
  cream: {
    wrapper: "bg-cream-2 text-ink",
    overlay: "bg-gradient-to-r from-[#efeade] via-[#efeade]/90 to-[#efeade]/20 sm:to-transparent",
    eyebrow: "text-clay",
    subtitle: "text-ink-soft",
    button: "bg-forest text-cream hover:bg-forest-2",
    control: "border-ink/20 text-ink hover:bg-ink/5",
    dot: "bg-ink/20",
    dotActive: "bg-forest",
  },
  gold: {
    wrapper: "bg-gold-soft text-ink",
    overlay: "bg-gradient-to-r from-[#f2e6cb] via-[#f2e6cb]/90 to-[#f2e6cb]/20 sm:to-transparent",
    eyebrow: "text-[#8a6415]",
    subtitle: "text-[#5f5335]",
    button: "bg-forest text-cream hover:bg-forest-2",
    control: "border-ink/20 text-ink hover:bg-ink/5",
    dot: "bg-ink/20",
    dotActive: "bg-forest",
  },
} as const;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;

  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [total, paused]);

  useEffect(() => {
    if (index > total - 1) setIndex(0);
  }, [index, total]);

  if (total === 0) return null;

  const go = (direction: number) => setIndex((current) => (current + direction + total) % total);

  return (
    <section className="container-page pt-5 sm:pt-8" aria-roledescription="carousel" aria-label="Featured offers">
      <div
        className="relative overflow-hidden rounded-[1.5rem] shadow-soft sm:rounded-[2rem]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {banners.map((banner, slide) => {
          const tone = tones[banner.tone] ?? tones.forest;
          const active = slide === index;
          return (
            <div
              key={banner.id}
              aria-hidden={!active}
              className={cn(
                "transition-opacity duration-700",
                active ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
                tone.wrapper,
              )}
            >
              {banner.image_url && (
                <img
                  src={banner.image_url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  loading={slide === 0 ? "eager" : "lazy"}
                />
              )}
              <div className={cn("absolute inset-0", tone.overlay)} />
              <div className="relative flex min-h-[26rem] flex-col justify-end p-6 sm:min-h-[30rem] sm:p-12 lg:min-h-[32rem]">
                <div className="max-w-xl">
                  {banner.eyebrow && (
                    <p className={cn("text-[10px] font-medium uppercase tracking-[0.28em]", tone.eyebrow)}>
                      {banner.eyebrow}
                    </p>
                  )}
                  <h2 className="mt-3 text-balance text-[2.5rem] leading-[0.95] sm:text-6xl lg:text-[4.25rem]">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className={cn("mt-4 max-w-md text-[13.5px] leading-relaxed sm:text-sm", tone.subtitle)}>
                      {banner.subtitle}
                    </p>
                  )}
                  <Link
                    to={banner.cta_link ?? "/shop"}
                    className={cn(
                      "btn mt-7 h-11 gap-2 px-5 text-[13px] transition",
                      tone.button,
                    )}
                  >
                    {banner.cta_label ?? "Shop now"}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {total > 1 && (
          <div className="absolute right-4 top-4 flex items-center gap-2 sm:bottom-8 sm:right-8 sm:top-auto">
            <div className="mr-2 hidden items-center gap-1.5 sm:flex">
              {banners.map((banner, dot) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Show banner ${dot + 1}`}
                  aria-current={dot === index}
                  onClick={() => setIndex(dot)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    dot === index
                      ? cn("w-6", tones[banner.tone]?.dotActive ?? "bg-gold")
                      : cn("w-1.5", tones[banner.tone]?.dot ?? "bg-cream/30"),
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous banner"
              className="grid size-9 place-items-center rounded-full border border-cream/20 bg-ink/55 text-cream backdrop-blur transition hover:bg-ink/75"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next banner"
              className="grid size-9 place-items-center rounded-full border border-cream/20 bg-ink/55 text-cream backdrop-blur transition hover:bg-ink/75"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
