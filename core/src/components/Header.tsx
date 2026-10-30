import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  Tag,
  User,
  UserRound,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useStoreSettings } from "../lib/store";
import { cn } from "../lib/format";
import type { Category } from "../lib/types";
import { InstallButton } from "./InstallButton";

export function Header() {
  const { settings, mode, toggleMode } = useStoreSettings();
  const { count, openCart } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [term, setTerm] = useState("");

  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (location.pathname === "/shop") setTerm(params.get("q") ?? "");
    else setTerm("");
  }, [location.pathname, params]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  };

  const activeCategory = params.get("category");
  const onShopPage = location.pathname === "/shop";

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-forest text-cream">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11px] tracking-wide">
          <p className="truncate text-cream/85">{settings.announcement ?? "Cash on delivery available"}</p>
          <div className="flex shrink-0 items-center gap-3 text-cream/70 sm:gap-5">
            <InstallButton />
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  settings.is_open ? "bg-[#a4d8b4]" : "bg-clay",
                )}
              />
              {settings.is_open ? "Open now" : "Closed"}
            </span>
            <span className="hidden lg:inline">Cash on delivery</span>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-cream">
        <div className="container-page flex h-16 items-center gap-3 sm:h-[4.75rem] sm:gap-6">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="L MART ONLINE home">
            <span className="grid size-9 place-items-center rounded-xl bg-forest text-cream font-display text-xl leading-none transition group-hover:bg-forest-2">
              L
            </span>
            <span className="leading-none">
              <span className="block font-display text-[22px] leading-none tracking-tight text-ink sm:text-[25px]">
                L MART<span className="text-gold">.</span>
              </span>
              <span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.34em] text-ink-soft">
                Online
              </span>
            </span>
          </Link>

          {!onShopPage && (
          <form onSubmit={submitSearch} role="search" className="relative hidden flex-1 md:block md:max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search the shelves: milk, bread, coffee…"
              aria-label="Search products"
              className="input h-11 pl-11 pr-10"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-soft transition hover:bg-cream-2 hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/offers"
              className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-[13px] text-ink-soft transition hover:bg-cream-2 hover:text-ink sm:inline-flex"
            >
              <Tag className="size-4" />
              Offers
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[12px] text-ink-soft transition hover:border-ink hover:text-ink lg:inline-flex"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={toggleMode}
              className="grid size-11 place-items-center rounded-md text-ink-soft transition hover:bg-cream-2 hover:text-ink"
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mode === "dark" ? "Light mode" : "Dark mode"}
            >
              {mode === "dark" ? (
                <Sun className="size-[17px]" />
              ) : (
                <Moon className="size-[17px]" />
              )}
            </button>
            <Link
              to={user ? "/account" : "/login"}
              className="grid size-11 place-items-center rounded-md text-ink-soft transition hover:bg-cream-2 hover:text-ink"
              aria-label={user ? "Your account" : "Sign in"}
            >
              {user ? (
                <span className="grid size-8 place-items-center rounded-full bg-forest/10 text-[11px] font-semibold uppercase text-forest">
                  {(user.email ?? "L").slice(0, 1)}
                </span>
              ) : (
                <UserRound className="size-[18px]" />
              )}
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative inline-flex min-h-11 items-center gap-2 rounded-md bg-forest pl-4 pr-1.5 text-cream text-base transition hover:bg-forest-2"
              aria-label={`Open basket, ${count} item${count === 1 ? "" : "s"}`}
            >
              <span className="hidden text-[13px] font-medium sm:inline">Basket</span>
              <ShoppingBag className="size-4 sm:hidden" />
              <span className="grid size-7 place-items-center rounded-full bg-gold text-[11px] font-semibold text-[#2a1f08] tabular-nums">
                {count}
              </span>
            </button>
          </div>
        </div>

        {!onShopPage && (
        <div className="container-page pb-3 md:hidden">
          <form onSubmit={submitSearch} role="search" className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search the shelves…"
              aria-label="Search products"
              className="input h-11 pl-11 pr-10"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-soft"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>
        </div>
        )}

        <div className={cn("hidden border-t border-line/80 md:block", onShopPage && "md:border-t-0")}>
          <div className="container-page flex h-11 items-center gap-6 overflow-x-auto no-scrollbar">
            <Link
              to="/shop"
              className={cn(
                "shrink-0 py-2 text-base transition hover:text-ink",
                location.pathname === "/shop" && !activeCategory
                  ? "font-medium text-ink"
                  : "text-ink-soft",
              )}
            >
              All products
            </Link>
            {categories.slice(0, 7).map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className={cn(
                  "shrink-0 py-2 text-base transition hover:text-ink",
                  activeCategory === category.slug ? "font-medium text-ink" : "text-ink-soft",
                )}
              >
                {category.name}
              </Link>
            ))}
            <Link
              to="/offers"
              className="ml-auto hidden min-h-11 shrink-0 items-center gap-1.5 text-base text-clay transition hover:text-ink lg:inline-flex"
            >
              <Tag className="size-3.5" />
              Today&apos;s offers
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

const mobileTabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/shop", label: "Shop", icon: LayoutGrid, end: false },
  { to: "/offers", label: "Offers", icon: Tag, end: false },
  { to: "/orders", label: "Orders", icon: ShoppingBag, end: false },
  { to: "/account", label: "Account", icon: User, end: false },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream safe-bottom md:hidden"
    >
      <div className="grid grid-cols-5">
        {mobileTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 py-1 text-[11px] tracking-wide transition",
                isActive ? "text-forest" : "text-ink-soft",
              )
            }
          >
            <tab.icon className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
