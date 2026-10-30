import { type ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  ArrowUpRight,
  FileSpreadsheet,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useDemoMode } from "../../lib/demo-mode";
import { useStoreSettings } from "../../lib/store";
import { cn } from "../../lib/format";
import { Spinner } from "../../components/ui";
import { ErrorBoundary } from "../../components/ErrorBoundary";

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package, end: false },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText, end: false },
  { to: "/admin/customers", label: "Customers", icon: Users, end: false },
  { to: "/admin/categories", label: "Categories", icon: LayoutGrid, end: false },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon, end: false },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, end: false },
  { to: "/admin/data", label: "Import & export", icon: FileSpreadsheet, end: false },
  { to: "/admin/settings", label: "Store settings", icon: Settings, end: false },
];

export function AdminLayout() {
  const { user, isAdmin, loading, profile } = useAuth();
  const { settings } = useStoreSettings();
  const isDemo = useDemoMode();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-5">
        <div className="w-full max-w-lg rounded-[1.5rem] border border-line bg-card p-8 text-center shadow-soft">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-cream-2 text-forest">
            <Lock className="size-5" />
          </div>
          <h1 className="mt-5 text-3xl text-ink">
            {user ? "Admin access needed" : "Sign in to the studio"}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            {user
              ? "Your account is signed in, but it isn't marked as an admin yet. Promote it once from the Supabase SQL editor."
              : "The admin studio manages products, orders and store settings. Sign in with an admin account to continue."}
          </p>

          {user ? (
            <pre className="mt-5 overflow-x-auto rounded-xl bg-forest px-4 py-3 text-left text-[11px] leading-relaxed text-cream/90">
              {`update public.profiles\nset role = 'admin'\nwhere email = '${profile?.email ?? "you@example.com"}';`}
            </pre>
          ) : (
            <Link to="/login?next=/admin" className="btn btn-primary mt-6">
              Sign in
            </Link>
          )}

          <div className="mt-6 border-t border-line pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft transition hover:text-ink"
            >
              Back to the store <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-cream">
        <div className="container-page flex h-16 items-center gap-3">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-forest font-display text-lg text-cream">
              L
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg leading-none text-ink">L MART Studio</span>
              <span className="mt-0.5 block text-[8px] uppercase tracking-[0.28em] text-ink-soft">
                Admin panel
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:inline-flex",
                settings.is_open
                  ? "border-[#1c6b3f]/20 bg-[#e8f4ec] text-[#1c6b3f]"
                  : "border-clay/20 bg-clay/[0.07] text-clay",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  settings.is_open ? "bg-[#2f8a58]" : "bg-clay",
                )}
              />
              {settings.is_open ? "Store open" : "Store closed"}
            </span>
            <Link
              to="/admin/settings"
              className="hidden items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[11px] text-ink-soft transition hover:border-ink hover:text-ink sm:inline-flex"
            >
              <ShieldCheck className="size-3.5" /> Control
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md bg-forest px-3.5 py-2 text-[11px] text-cream transition hover:bg-forest-2"
            >
              View store <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="container-page pb-3 lg:hidden">
          <nav className="flex flex-wrap gap-1.5" aria-label="Admin sections">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10.5px] transition sm:px-3 sm:text-[11px]",
                    isActive
                      ? "bg-forest text-cream"
                      : "border border-line text-ink-soft hover:text-ink",
                  )
                }
              >
                <item.icon className="size-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <div className="container-page grid gap-8 py-6 lg:grid-cols-[13rem_1fr] lg:py-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-0.5" aria-label="Admin sections">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] transition",
                    isActive
                      ? "bg-forest text-cream"
                      : "text-ink-soft hover:bg-cream-2 hover:text-ink",
                  )
                }
              >
                <item.icon className="size-4" strokeWidth={1.7} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-line bg-card p-3.5 text-[10.5px] leading-relaxed text-ink-soft">
            Signed in as
            <span className="mt-0.5 block truncate font-medium text-ink">
              {profile?.email ?? profile?.full_name}
            </span>
          </div>
        </aside>

        <main className="min-w-0">
          {isDemo && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-dashed border-gold/50 bg-gold-soft/50 px-4 py-3 text-[11.5px] leading-relaxed text-[#6b5320]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>
                <strong className="font-semibold">Preview data.</strong> The Supabase migration
                hasn&apos;t been applied yet, so edits live in this browser only. Run
                <code className="mx-1 rounded bg-white/60 px-1 py-0.5 text-[10.5px]">
                  supabase/migrations/20261024120000_init.sql
                </code>
                and the seed file to go live.
              </p>
            </div>
          )}
          <ErrorBoundary variant="section" name="admin-section">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1.5 text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
