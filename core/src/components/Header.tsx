import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, LayoutGrid, MapPin, Shapes, ShoppingBag, User } from "lucide-react";
import { useCart } from "../lib/cart";
import { useStoreSettings } from "../lib/store";
import { useToast } from "../lib/toast";
import { inr } from "../lib/format";
import { serviceablePincodes } from "../lib/delivery";
import { SearchBar } from "./ui/SearchBar";
import { Sheet } from "./ui/Sheet";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { InstallButton } from "./InstallButton";

const PIN_KEY = "lmart.pincode.v1";

function readPin() {
  try {
    return localStorage.getItem(PIN_KEY) ?? "";
  } catch {
    return "";
  }
}

function writePin(pin: string) {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {
    /* storage blocked: the pincode still works for this visit */
  }
}

export function Header() {
  const { settings } = useStoreSettings();
  const { count, openCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [pin, setPin] = useState(readPin);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState(pin);
  const [pinError, setPinError] = useState("");

  const allowed = serviceablePincodes(settings);
  const shownPin = pin || allowed[0] || "";

  const savePin = () => {
    const digits = pinInput.replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) {
      setPinError("Enter the full 6-digit PIN code.");
      return;
    }
    if (!allowed.includes(digits)) {
      setPinError(`We do not deliver to ${digits} yet.`);
      return;
    }
    writePin(digits);
    setPin(digits);
    setPinError("");
    setPinOpen(false);
    toast(`Delivering to ${digits}`);
  };

  const deliveryFacts = [
    settings.is_open ? "Open now" : "Closed right now",
    settings.delivery_estimate,
    "Cash on delivery",
    settings.min_order > 0 ? `Minimum order ${inr(settings.min_order)}` : null,
  ].filter(Boolean) as string[];

  return (
    <header className="border-b border-line bg-cream">
      <div className="container-page flex items-center gap-2 py-2">
        <Link to="/" className="flex shrink-0 items-baseline gap-0.5" aria-label="L MART home">
          <span className="text-[16px] font-semibold leading-6 tracking-tight text-ink">L MART</span>
          <span className="text-[16px] font-semibold leading-6 text-gold">.</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            setPinInput(pin || allowed[0] || "");
            setPinError("");
            setPinOpen(true);
          }}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[var(--lm-radius-control)] px-2 py-1 text-left transition hover:bg-cream-2"
        >
          <MapPin className="size-4 shrink-0 text-forest" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[12px] leading-4 text-ink-soft">Delivering to</span>
            <span className="block truncate text-[14px] font-medium leading-5 text-ink">
              {shownPin ? `PIN ${shownPin}` : "Set your area"}
            </span>
          </span>
          <span className="sr-only">, change PIN code</span>
        </button>

        <InstallButton className="hidden lg:inline-flex" />

        <button
          type="button"
          onClick={openCart}
          aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          className="relative grid size-11 shrink-0 place-items-center rounded-[var(--lm-radius-control)] border border-line bg-white text-ink transition hover:border-forest"
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-forest px-1.5 text-[12px] font-semibold leading-5 text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </div>

      <div className="container-page pb-2">
        <SearchBar
          value={term}
          onChange={setTerm}
          onSubmit={(value) => {
            if (!value) return;
            navigate(`/search?q=${encodeURIComponent(value)}`);
          }}
        />
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1.5 text-[12px] leading-4 text-ink-soft">
          {deliveryFacts.map((fact, index) => (
            <span key={fact} className="flex items-center gap-3">
              {index > 0 && <span aria-hidden="true">·</span>}
              <span className={fact === "Closed right now" ? "text-warning" : undefined}>{fact}</span>
            </span>
          ))}
        </div>
      </div>

      <Sheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Where should we deliver?"
        footer={
          <Button block onClick={savePin}>
            Save pincode
          </Button>
        }
      >
        <Field
          label="PIN code"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="312601"
          value={pinInput}
          onChange={(event) => {
            setPinInput(event.target.value.replace(/\D/g, "").slice(0, 6));
            setPinError("");
          }}
          error={pinError || undefined}
          hint={`We currently deliver to ${allowed.join(", ")}.`}
        />
        <p className="mt-4 text-[12px] leading-4 text-ink-soft">
          This only checks your area. Your delivery address is confirmed again at checkout.
        </p>
      </Sheet>
    </header>
  );
}

const mobileTabs = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/shop", label: "Shop", icon: LayoutGrid, end: false },
  { to: "/categories", label: "Categories", icon: Shapes, end: false },
  { to: "/account", label: "Account", icon: User, end: false },
];

export function MobileNav() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/checkout")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white safe-bottom" aria-label="Primary">
      <div className="grid grid-cols-4">
        {mobileTabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className="ui-navtab">
            <tab.icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
