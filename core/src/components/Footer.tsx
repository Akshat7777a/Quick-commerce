import { Link } from "react-router-dom";
import { Clock3, MapPin, Phone } from "lucide-react";
import { useStoreSettings } from "../lib/store";
import { PatchSlot } from "../lib/patch-loader";
import { InstallButton } from "./InstallButton";

export function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="border-t border-line bg-white">
      <div className="container-page py-8">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-baseline gap-0.5" aria-label="L MART home">
              <span className="text-[18px] font-semibold leading-6 text-ink">L MART</span>
              <span className="text-[18px] font-semibold leading-6 text-gold">.</span>
            </Link>
            <p className="mt-2 max-w-sm text-[14px] leading-5 text-ink-soft">
              {settings.tagline ??
                "Everyday essentials from your neighbourhood store, delivered in Nimbahera."}
            </p>
            <InstallButton className="mt-4" />
          </div>

          <div>
            <h2 className="text-[12px] font-medium leading-4 text-ink">Browse</h2>
            <ul className="mt-2 space-y-1 text-[14px] leading-5 text-ink-soft">
              <li><Link className="transition hover:text-ink" to="/shop">All products</Link></li>
              <li><Link className="transition hover:text-ink" to="/categories">Categories</Link></li>
              <li><Link className="transition hover:text-ink" to="/offers">Offers</Link></li>
              <li><Link className="transition hover:text-ink" to="/orders">Your orders</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-[12px] font-medium leading-4 text-ink">The store</h2>
            <ul className="mt-2 space-y-2 text-[14px] leading-5 text-ink-soft">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden="true" />
                <span>{settings.address ?? "Shop address to be added"}</span>
              </li>
              {settings.phone ? (
                <li className="flex gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden="true" />
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="transition hover:text-ink">
                    {settings.phone}
                  </a>
                </li>
              ) : (
                <li>Phone number to be added</li>
              )}
              <li className="flex gap-2">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden="true" />
                <span>
                  {settings.is_open ? "Open now" : "Closed right now"}
                  {settings.delivery_estimate ? ` · ${settings.delivery_estimate}` : ""}
                </span>
              </li>
              <li>FSSAI licence: [Owner to add]</li>
            </ul>
          </div>
        </div>

        <PatchSlot name="footer-note" />

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-4 text-[12px] leading-4 text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} L MART ONLINE</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="transition hover:text-ink">Privacy Policy</Link>
            <Link to="/terms" className="transition hover:text-ink">Terms and Conditions</Link>
            <Link to="/refunds" className="transition hover:text-ink">Refund and Cancellation</Link>
            <Link to="/account" className="transition hover:text-ink">Contact the store</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
