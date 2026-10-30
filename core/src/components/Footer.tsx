import { Link } from "react-router-dom";
import { Banknote, Clock3, MapPin, Phone } from "lucide-react";
import { useStoreSettings } from "../lib/store";
import { PatchSlot } from "../lib/patch-loader";

export function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="mt-20 bg-forest text-cream">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
          <div>
            <Link to="/" className="inline-flex items-baseline gap-2">
              <span className="font-display text-3xl leading-none">
                L MART<span className="text-gold">.</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-cream/50">Online</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/65">
              {settings.tagline ??
                "Everyday essentials from your neighbourhood store, ordered online, paid in cash at your door."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-cream/70">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/15 px-3 py-1.5">
                <Banknote className="size-3.5" /> Cash on delivery
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/15 px-3 py-1.5">
                <Clock3 className="size-3.5" /> {settings.delivery_estimate ?? "Same-day delivery"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.24em] text-cream/45">Browse</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
              <li><Link className="transition hover:text-gold" to="/shop">All products</Link></li>
              <li><Link className="transition hover:text-gold" to="/offers">Offers &amp; coupons</Link></li>
              <li><Link className="transition hover:text-gold" to="/orders">Your orders</Link></li>
              <li><Link className="transition hover:text-gold" to="/account">Your account</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.24em] text-cream/45">The store</h3>
            <ul className="mt-4 space-y-3 text-sm text-cream/75">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-cream/40" />
                <span>{settings.address ?? "Add the store address in admin"}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-cream/40" />
                <a href={`tel:${settings.phone ?? ""}`} className="transition hover:text-gold">
                  {settings.phone ?? "Add a phone number in admin"}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-cream/40" />
                <span>
                  {settings.is_open ? "Open now" : "Currently closed"} · {settings.delivery_estimate}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Optional patch line: store notice, festival greeting, etc. */}
        <PatchSlot name="footer-note" />

        <div className="mt-12 flex flex-col gap-3 border-t border-cream/10 pt-6 text-[11px] text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} L MART ONLINE. Made for the neighbourhood.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy" className="transition hover:text-cream/80">Privacy Policy</Link>
            <Link to="/terms" className="transition hover:text-cream/80">Terms and Conditions</Link>
            <Link to="/admin" className="transition hover:text-cream/80">Admin panel</Link>
            <span>Secure checkout · Pay at your door</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
