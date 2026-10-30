# L MART ONLINE

A quiet neighbourhood grocery and everyday-essentials store that takes orders online and delivers them the same day, paying cash at the door. Built so the owner — or anyone they tap as admin — can run the whole shop: products, categories, banners, coupons, orders, customers, and what customers see.

No rider tracking, no dark-store logistics, no payment gateway. Just clear online ordering for one area.

## What it is

An online window for the L MART grocery shop in Nimbahera, Rajasthan (PIN 312601). Real customers use it, so it is stable, small, and works on a phone first. The store is the business model: one admin owns it, updates the catalogue, and sees every order.

## What it does

- Browse by category or search, see prices with the rupee symbol, and save items to a basket
- Apply coupon codes with live feedback before checkout
- Checkout with name, phone, delivery address, a chosen delivery time, and a note
- Cash on delivery only; the order confirmation and the admin handoff carry everything the delivery person needs
- Home-screen install via PWA (desktop, Android, and iPhone Safari)
- Admin: dashboard, products, categories, orders with a status pipeline, customers, banners, coupons, CSV import/export, store settings, and theme

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** with a small design-token layer in `core/src/index.css`
- **React Router** for storefront and `/admin` routes
- **Supabase**: auth, Postgres, storage, row-level security, SQL migrations

## Running it

```bash
npm install
cp .env.example .env    # then fill in your Supabase values
npm run dev             # http://localhost:5173
```

`.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Other scripts: `npm run build` (typecheck + production bundle), `npm run typecheck`, `npm run preview`.

## Repository layout

```
core/          the app: source, index.html, public assets, and every source file
patches/       numbered, self-contained updates, each with its own manifest
supabase/      SQL migrations
dist/          production bundle (built by "npm run build")
```

### Why the app now lives in `core/`

This project was refactored on this turn so future work lands as numbered, reversible patches instead of edits to the frozen core. The production build still produces `dist/` at the repository root, and the Worker hosts that static bundle. Everything that used to be in `src/` now lives in `core/src/`.

## Patches

Patches live in `patches/` and are discovered and loaded by the core at build time. Each patch has:

- `manifest.json`: id, title, date, version, description, depends_on, enabled, requires_db_migration
- its own code, styles, and assets
- `README.md`: what changed, how to test, how to remove it

The core exposes a small, documented set of extension points: register a route, register a UI slot, register before/after-checkout hooks, and register theme-token overrides. A patch may only use those. If a patch fails to load or throws at runtime, the loader logs it, skips it, and the app keeps working.

To switch a patch off without deleting it, set its `enabled` flag to false. A patch's `enabled` flag is its off-switch.

Rollback rule: deleting the newest patch folders returns the app to exactly the previous working version with no other edits needed. Database changes, if any, are separate and backward-compatible by default (new nullable columns, new tables), and the README of a patch that touches the database says how to undo it.

Every patch is its own commit, and every delivery gets a tag (v1.0.1, v1.0.2, and so on).

## Making yourself admin

1. Sign up through the app (or Supabase → Authentication → Users).
2. In the SQL editor run:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

> A bootstrap admin already exists: `lmart.store.test@gmail.com` (password `LmartTest#2026`). Change or remove it once you create your own.

3. Reload the app. The **Admin** entry appears in the header, and `/admin` unlocks.

Roles are checked by `is_admin()` on every admin row-level security policy, and customers cannot update their own `role` column.

## Admin panel

- **Dashboard**: revenue, order counts, low-stock and recent orders
- **Products**: add / edit / deactivate / delete, stock, prices, images (upload to the `product-images` bucket), search
- **Categories**: add / rename / reorder / remove
- **Orders**: status pipeline: placed → confirmed → packed → out for delivery → delivered / cancelled
- **Customers**: the customer database: phone, email, join date, order history, delivered count and lifetime spend (admin only; call links built in)
- **Orders: delivery handoff**: every order modal contains a copy-ready block (name, phone, address, chosen delivery slot, itemised list and the exact cash to collect) with one-click **Copy delivery info** and **Share on WhatsApp**, so it can be pasted straight to the delivery person
- **Banners**: hero carousel slides with scheduling and active toggle
- **Coupons**: percent or flat, min order, max discount, usage limits, validity window
- **Import & export**: CSV in and out for everything (see below)
- **Store settings**: theme & appearance (light/dark/system default plus festival presets: Diwali, Holi, Christmas, Eid, Republic Day), delivery area (which PIN codes can order, default `312601` · Nimbahera), delivery time options (customisable checkout slots: instant, 1–2 hours, fixed time windows), opening hours, fees and storefront copy

Customers get a light/dark toggle in the header; the admin's choice is the store-wide default and the festival preset recolours the whole storefront instantly.

## Delivery area and delivery time

- **Delivery area (PIN codes)**: only addresses whose 6-digit PIN code is in `store_settings.serviceable_pincodes` (default `312601` · Nimbahera, Rajasthan) can check out. Enforced twice: inline at checkout and again inside `place_order()`, so out-of-area orders are rejected even if the client is bypassed. Expand the area from **Store settings** by adding comma-separated PIN codes.
- **Delivery time options**: checkout offers a slot picker instead of a single "9 AM – 9 PM" line: instant (30 minutes), within 1–2 hours, plus fixed windows. The list is fully customisable in **Store settings → Delivery time options** (one per line), the choice is stored on the order (`orders.delivery_slot`), and `place_order()` rejects anything outside the admin's list.

## Cash on delivery only

Checkout collects name, phone and address, and places the order through `place_order()`. The confirmation screen shows the order number (e.g. `LMO-261024-1001`), shows the ordered items and total, gives the store's phone number as a tappable link, and pre-fills a WhatsApp message to the store with the order summary. Payment is always cash on delivery.

## Install as an app (PWA)

The store is installable straight to the home screen, no app store involved. An **Install app** button sits in the top bar of every page:

- **Chrome / Edge (desktop & Android):** the button fires the browser's native install dialog.
- **iPhone (Safari):** the button opens a 3-step guide: Share → *Add to Home Screen* → Add, since iOS offers no programmatic prompt.
- Once installed the button hides itself and the app opens full-screen, with the offline fallback served by the service worker.

The installable surface is the set of public icons and the manifest in `core/public/`:

| File | Purpose |
| --- | --- |
| `core/public/manifest.webmanifest` | app name, icons, fieldset mode, start URL, shortcuts |
| `core/public/sw.js` | service worker: network-first navigations with offline fallback |
| `core/public/icon-*.png`, `core/public/apple-touch-icon.png` | 192/512 icons plus maskable and iOS variants |
| `core/src/lib/pwa.ts` | `beforeinstallprompt` capture, standalone detection, service-worker registration |

Browsers only offer installation over **HTTPS** (or `localhost`), so it activates automatically once deployed.

## Supabase setup

Migrations live in `supabase/migrations/`:

| File | What it does |
| --- | --- |
| `20261024120000_init.sql` | extensions, tables, indexes, RLS policies, `is_admin()`, `validate_coupon()`, `place_order()`, storage bucket |
| `20261024120100_seed.sql` | categories, products, banners, starter coupons, default store settings |
| `20261024130000_customer_directory.sql` | `admin_customers()`: admin-only customer directory |
| `20261024140000_security_hardening.sql` | merges duplicate cart lines, caps/locks, least-privilege revokes, identity-column guard |
| `20261025110000_theme_delivery_area.sql` | **Run this next.** Adds `store_settings.theme_mode`, `theme_preset`, `serviceable_pincodes`, `delivery_options` and `orders.delivery_slot`; redefines `place_order()` to reject out-of-area PIN codes and slots outside the admin's list |

> **Status: migration 5 is pending.** Migrations 1–4 are already applied to the project. The app also reads settings through the admin panel, so theme, delivery area and delivery time options are configurable from the storefront now. Run migration 5 when you pull the latest set of migrations.

### Running the migrations

**Option A: Supabase CLI**

```bash
supabase link --project-ref your-project-ref
supabase db push          # or: supabase migration up
```

**Option B: SQL editor**

Open [SQL Editor](https://supabase.com/dashboard/project/<project-ref>/sql/new) in the dashboard and run the two files **in order** (init first, then seed).

### What the schema gives you

- **Tables**: `profiles` (with `role: customer | admin`), `categories`, `products`, `banners`, `coupons`, `orders`, `order_items`, `store_settings`, all with indexes on the hot paths (slug, category, active flags, `user_id`, `order_number`).
- **Auth**: a `handle_new_user()` trigger creates a `profiles` row for every new sign-up.
- **RLS**: customers read the catalogue and only their own orders/profile; only admins write products, banners, coupons and manage orders. Orders go through `place_order()`.
- **Server-side money**: `place_order()` re-reads prices and stock from the database, validates stock, enforces store-open/minimum-order, applies the coupon, decrements stock and computes totals in Postgres, so the client can't tamper with amounts. Payment method is always `cod`.
- **Coupons**: `validate_coupon(code, subtotal)` is exposed read-only for live cart feedback.
- **Storage**: public `product-images` bucket, read for everyone, write for admins only.

### Security hardening

- **`place_order()` merges duplicate cart lines** for the same product before pricing, so the subtotal and the stock decrement can never disagree, and each row is locked exactly once.
- **Input caps**: name, address, notes, phone, cart size, quantity.
- **Coupon row is locked** inside `place_order()`, so two concurrent checkouts can't both slip past a `usage_limit`.
- **Profile identity columns are frozen** for signed-in non-admins.
- **Least privilege**: direct order inserts and sequence draws are blocked from clients.

Everything is verified by `.logs/verify-sql.mjs` (the local Postgres checks) and `.logs/verify-live.mjs` (the live-API checks).

## CSV import & export

**Import products**: export a product list from your existing billing/inventory software as CSV and upload it:

- Required columns: `name`, `price`. Optional: `slug`, `category`, `mrp`, `unit`, `stock`, `is_active`, `is_featured`, `description`, `image_url`.
- Rows **match on slug** (falling back to name): matches update the existing product, the rest are created. Categories are matched by slug or name; unknown ones are created automatically (toggleable) or flagged as row errors.
- A preview table shows **new / update / error** per row with the exact problem. Problem rows are skipped, valid rows still import.
- A ready-made **template** button downloads a correct example file.

**Export**: one click downloads standard UTF-8 CSV: Products, Sales, Orders, Customers, Categories, Coupons, Banners and Store settings.

## Accounts & contact details

Phone number is **required** at sign-up. Every sign-up lands in the admin Customers directory automatically. Email confirmation is off on this project so new accounts are verified instantly.

## Deployment

The app is a static bundle served by a Cloudflare Worker. Build it from the repository root:

```bash
npm run build
```

Then deploy `dist/` via whatever Workers deployment path your stack uses (the Wrangler config is `wrangler.jsonc` in the repository root).

### Smoke test

Before a deploy, run:

```bash
cd core && npm run build
node scripts/smoke.mjs
```

It starts a static preview, checks that home, favicon, manifest, service worker and assets all respond, and that the pages render with JavaScript. A clean run means deploy may proceed; the script also lists the manual checks the owner should still eyeball before go-live.

## Browser tabs, reloads and background tabs

The store survives a switch to another tab and a return to it: the cart, the half-filled checkout form, the search text, the scroll position and the cart drawer are all restored from local storage. Refreshing in the background is silent and throttled (at most once per 60 seconds). A new app version is applied silently on the next full navigation; it does never reload the page by itself.

There is an error boundary at the app root and around each major section, so one failing component shows a friendly fallback, never a white screen.

## Design rule

The shop is meant to read like a careful neighbourhood store, not a generic template. The palette is one primary colour (the forest green), neutrals, and one accent for alerts. Animations are subtle and short, and visitors who ask their OS for reduced motion get instant state changes. Every visible line says something true: what we sell, the delivery area, the delivery hours, the payment method. Prices are in rupees, and the rupee symbol is shown consistently. Mock features that do not exist (fake reviews, fake live counters, fake urgency timers) are not present.

## Pre-launch checklist

Do not launch until every item is done.

1. Custom domain connected to the Worker, HTTPS working, www and non-www both handled, redirects from the workers.dev URL set up.
2. Favicon set (ico, 32px and 16px png, apple-touch-icon 180px, 192px and 512px icons) and a web app manifest.
3. Any "Made with AI", builder badge, or platform branding removed from the UI, HTML, footer and metadata.
4. Privacy Policy and Terms and Conditions, linked from the footer and the checkout screen. Written for an Indian local delivery shop: data collected (name, phone, address, order history), why, how long kept, who can see it, how to request deletion, contact details, cash on delivery terms, cancellation and refund policy, delivery area and timing, substitution policy, and governing law India. Use placeholders for business name, address, FSSAI licence number, GST number if applicable, and contact details, and get them reviewed by a qualified person.
5. SEO and sharing: unique title and meta description, `og:title`, `og:description`, `og:image`, canonical URL, `robots.txt`, `sitemap.xml`, and main content readable by crawlers.
6. Security: no secrets or API keys in client code, input sanitised, rate limiting on order submission, security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`), admin routes protected.
7. Performance: images compressed and lazy-loaded, Lighthouse mobile scores above 90 for Performance, Accessibility and Best Practices, no layout shift.
8. A custom 404 page and a friendly maintenance page.
9. Remove all test data, console logs, placeholder text and unused code.

## Latest delivery

This turn shipped Phase 5, the pre-launch checklist:

- Two legal pages and a maintenance page, with the footer and the checkout screen linking to Privacy Policy and Terms and Conditions.
- SEO surface: canonical URL, OG tags, Twitter card, `robots.txt`, `sitemap.xml`.
- Security headers file for Cloudflare Workers assets: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Client-side rate limiting on order submission (45 seconds per device) so a double-tap cannot place two orders at once.
- Quiet patch-loader logs in production.
- The `src/` → `core/src/` refactor that the whole repository now assumes, and the `README.md` update that keeps old and new paths in sync.

## How to ask for the next update

Describe it as one change, one patch. Include what should change, which routes or admin controls it touches, whether it touches the database, and how to test it. The owner of the live store decides which patch goes out and when.

## Old README

An older version of this file (still visible at `README.old.md`) used `src/` paths and a slightly different migration-number story. That version predates the `src/` → `core/src/` refactor. The paths and migration numbers in this README are the current ones.

## License

This is a private store. Nothing here is being released for other people to reuse yet.
