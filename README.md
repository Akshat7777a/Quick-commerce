# L MART ONLINE

A modern, minimal, premium neighbourhood grocery store — browse categories, search products, add to cart, apply coupon codes, and order online with **cash on delivery only**. Supabase is the backend for auth, database, storage and row-level security. Includes a full admin panel for products, categories, orders, banners, coupons, store open/close and store settings.

No payment integration, no rider tracking, no dark-store logistics — just simple online ordering.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** with a small premium design-token layer in [src/index.css](src/index.css)
- **React Router** for storefront + `/admin` routes
- **Supabase**: Auth (email/password), Postgres, Storage, RLS, SQL migrations
- Resilient **demo fallback**: when Supabase env vars are missing or unreachable, the app runs against an in-memory demo catalogue so the UI is always explorable

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev            # http://localhost:5173
```

`.env`:

```
VITE_SUPABASE_URL=https://waiywwrqxegmhgwlxhkt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # publishable/anon key (safe in the browser)
```

Other scripts: `npm run build` (typecheck + production bundle), `npm run typecheck`, `npm run preview`.

## Supabase setup

Migrations live in [supabase/migrations](supabase/migrations):

| File | What it does |
| --- | --- |
| `20261024120000_init.sql` | Extensions, `profiles`, `categories`, `products`, `banners`, `coupons`, `orders`, `order_items`, `store_settings`, indexes, triggers, RLS policies, `is_admin()`, `validate_coupon()`, `place_order()` RPC, storage bucket |
| `20261024120100_seed.sql` | 8 categories, 38 products, 3 banners, starter coupons, default store settings |
| `20261024130000_customer_directory.sql` | `admin_customers()` — admin-only customer directory with contact details, order counts, lifetime spend and last order |
| `20261024140000_security_hardening.sql` | Hardening: merges duplicate cart lines in `place_order()`, input length/phone/cart-size caps, coupon row lock (usage-limit race), profile identity-column guard, least-privilege revokes (order-number sequence, `order_items` writes) |
| `20261025110000_theme_delivery_area.sql` | **Migration 5 — run this next.** Adds `store_settings.theme_mode` (light/dark/system), `theme_preset` (festival presets), `serviceable_pincodes` (delivery area, default `312601`), `delivery_options` (checkout time slots) and `orders.delivery_slot`; redefines `place_order()` to reject out-of-area PIN codes and slots outside the admin's list |

> **Status: migration 5 pending.** Migrations 1–4 are already applied to the `waiywwrqxegmhgwlxhkt` project (tables, RLS, seed data, storage bucket, customer directory and hardening are live). **`20261025110000_theme_delivery_area.sql` still needs to be run** — until then the app falls back to local preview data for theme/delivery-area saves and checkout. The steps below are kept for re-runs or a fresh project.

### Run the migrations

**Option A — Supabase CLI**

```bash
supabase link --project-ref waiywwrqxegmhgwlxhkt
supabase db push          # or: supabase migration up
```

**Option B — SQL editor**

Open [SQL Editor](https://supabase.com/dashboard/project/waiywwrqxegmhgwlxhkt/sql/new) in the dashboard and run the two files **in order** (init first, then seed).

### What the schema gives you

- **Tables**: `profiles` (with `role: customer | admin`), `categories`, `products`, `banners`, `coupons`, `orders`, `order_items`, `store_settings` — all with indexes on the hot paths (slug, category, active flags, `user_id`, `order_number`).
- **Auth**: a `handle_new_user()` trigger creates a `profiles` row for every new sign-up.
- **RLS**: customers read the catalogue and only their own orders/profile; only admins (via the `is_admin()` security-definer helper) write products, banners, coupons and manage orders. Direct `insert into orders` from a client is blocked — orders go through `place_order()`.
- **Server-side money**: `place_order()` re-reads prices, validates stock, enforces store-open/minimum-order, applies the coupon, decrements stock and computes totals in Postgres, so the client can't tamper with amounts. Payment method is always `cod`.
- **Coupons**: `validate_coupon(code, subtotal)` is exposed read-only for live cart feedback.
- **Storage**: public `product-images` bucket (5 MB, image types), read for everyone, write for admins only.

### Security hardening (migration 4)

The hardening migration closes the holes a review of the first schema found:

- **`place_order()` merges duplicate cart lines** for the same product before pricing, so the subtotal and the stock decrement can never disagree, and each row is locked exactly once.
- **Input caps**: name ≤ 100, address ≤ 500, notes ≤ 500 chars, phone must contain ≥ 10 digits, at most 50 distinct cart lines, quantity ≤ 50 each.
- **Coupon row is locked (`for update`)** inside `place_order()`, so two concurrent checkouts can't both slip past a `usage_limit`.
- **Profile identity columns are frozen** for signed-in non-admins: a customer editing their own row can only change name/phone — never `email`, `id`, `created_at` or `role` (the SQL editor, which runs without a JWT, can still promote admins).
- **Least privilege**: clients can no longer draw from `order_number_seq` or insert/delete `order_items` rows directly — sales lines are written only by `place_order()`.

Everything is verified by [.logs/verify-sql.mjs](.logs/verify-sql.mjs) (44 checks against a local Postgres, including the delivery-area and slot rules of migration 5) and [.logs/verify-live.mjs](.logs/verify-live.mjs) (14 REST checks against the live project).

## Making yourself admin

1. Sign up through the app (or Supabase → Authentication → Users).
2. In the SQL editor run:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

> A bootstrap admin already exists: `lmart.store.test@gmail.com` (password `LmartTest#2026`). Change or remove it once you create your own.

3. Reload the app — the **Admin** entry appears in the header, and `/admin` unlocks.

Roles are checked by `is_admin()` on every admin RLS policy, and customers cannot update their own `role` column.

## Admin panel (`/admin`)

- **Dashboard** — revenue, order counts, low-stock and recent orders
- **Products** — add / edit / deactivate / delete, stock, prices, images (upload to the `product-images` bucket), search
- **Categories** — add / rename / reorder / remove
- **Orders** — status pipeline: placed → confirmed → packed → out for delivery → delivered / cancelled
- **Customers** — the customer database: phone, email, join date, order history, delivered count and lifetime spend (admin only; call links built in)
- **Orders — delivery handoff** — every order modal contains a copy-ready block (name, phone, address, chosen delivery slot, itemised list and the exact cash to collect) with one-click **Copy delivery info** and **Share on WhatsApp**, so it can be pasted straight to your delivery person
- **Banners** — hero carousel slides with scheduling and active toggle
- **Coupons** — percent or flat, min order, max discount, usage limits, validity window
- **Import & export** — CSV in and out for everything (see below)
- **Store settings** — theme & appearance (light/dark/system default plus festival presets: Diwali, Holi, Christmas, Eid, Republic Day), delivery area (which PIN codes can order, default `312601` · Nimbahera), delivery time options (customisable checkout slots: instant, 1–2 hours, fixed time windows), opening hours, fees and storefront copy

Customers get a light/dark toggle in the header; the admin's choice is the store-wide default and the festival preset recolours the whole storefront instantly.

## CSV import & export (`/admin/data`)

**Import products** — export a product list from your existing billing/inventory software as CSV and upload it:

- Required columns: `name`, `price`. Optional: `slug`, `category`, `mrp`, `unit`, `stock`, `is_active`, `is_featured`, `description`, `image_url` (extra/unknown columns are ignored; headers match case/space-insensitively).
- Rows **match on `slug`** (falling back to name): matches update the existing product, the rest are created. `price`/`mrp` accept `₹1,299`-style values; booleans accept `true/false/1/0/yes/no`.
- Categories are matched by slug or name; unknown ones are created automatically (toggleable) or flagged as row errors.
- A preview table shows **new / update / error** per row with the exact problem (invalid price, negative stock, mrp below price, duplicate slug, bad image URL…) — problem rows are skipped, valid rows still import.
- A ready-made **template** button downloads a correct example file.

**Export** — one click downloads standard UTF-8 CSV (opens directly in Excel/Google Sheets): Products (round-trips back through the importer), Sales (line items), Orders, Customers (incl. lifetime spend), Categories, Coupons, Banners and Store settings — filenames like `lmart-products-2026-10-24.csv`.
- **Settings** — store name, delivery fee, free-delivery threshold, minimum order, contact info, and the **open / closed** toggle (closed store blocks checkout)

## Accounts & contact details

Phone number is **required** at sign-up — the store needs it to confirm orders and contact customers. Every sign-up lands in the admin Customers directory automatically.

**Email confirmation is disabled** on this project (`Confirm email` off in Authentication → Sign In / Providers), so new accounts are verified instantly and can sign in right away — no "check your inbox" dead end. If you re-enable it, make sure your Supabase plan's email sender is verified, otherwise confirmation emails land in spam and sign-ups stall.

## Cash on delivery only

Checkout collects name, phone and address, and places the order through `place_order()`. The confirmation screen shows the order number (e.g. `LMO-261024-1001`) and instructs the customer to pay cash on delivery.

## Delivery area & delivery time

- **Delivery area (PIN codes)** — only addresses whose 6-digit PIN code is in `store_settings.serviceable_pincodes` (default `312601` · Nimbahera, Rajasthan) can check out. Enforced twice: inline at checkout and again inside `place_order()`, so out-of-area orders are rejected even if the client is bypassed. Admins expand the area from **Store settings** by adding comma-separated PIN codes.
- **Delivery time options** — checkout offers a slot picker instead of a single "9 AM – 9 PM" line: instant (30 minutes), within 1–2 hours, plus fixed windows (10 AM – 12 PM, etc.). The list is fully customisable in **Store settings → Delivery time options** (one per line), the choice is stored on the order (`orders.delivery_slot`), and `place_order()` rejects anything outside the admin's list.

## Install as an app (PWA)

The store is installable straight to the home screen — no app store involved. An **Install app** button sits in the top bar of every page:

- **Chrome / Edge (desktop & Android):** the button fires the browser's native install dialog.
- **iPhone (Safari):** the button opens a 3-step guide — Share → *Add to Home Screen* → Add, since iOS offers no programmatic prompt.
- Once installed the button hides itself and the app opens full-screen (`display: standalone`), with the offline fallback served by the service worker.

What makes it installable:

| File | Purpose |
| --- | --- |
| `public/manifest.webmanifest` | App name, icons, `standalone` display, start URL, shortcuts |
| `public/sw.js` | Service worker: network-first navigations with offline fallback, cache-first hashed assets |
| `public/icon-*.png`, `apple-touch-icon.png` | 192/512 icons plus maskable and iOS variants, generated from the favicon design by `.logs/gen-icons.mjs` |
| `src/lib/pwa.ts` | `beforeinstallprompt` capture, standalone detection, SW registration |
| `src/components/InstallButton.tsx` | The button and the how-to dialog |

Browsers only offer installation over **HTTPS** (or `localhost`), so it activates automatically once deployed.

## Verifying the SQL locally

The migrations are exercised end-to-end against an in-process Postgres (PGlite) with Supabase's `auth`/`storage` stubbed:

```bash
node .logs/verify-sql.mjs
```

It asserts: migrations run, seeds land, the signup trigger works, coupon math (15% with cap and min-order), `place_order` totals/stock/coupon usage, RLS blocks direct order inserts and role self-promotion, cross-user isolation, closed-store checkout blocking, admin visibility, and bucket provisioning.

## Project layout

```
src/
  components/   Header, Footer, BannerCarousel, CartDrawer, ProductCard, ui, ...
  pages/        Home, Shop, ProductPage, Cart/Checkout, Orders, Auth, Offers, Account
  pages/admin/  Dashboard, Products, Categories, Orders, Banners, Coupons, Settings
  lib/          supabase client, api layer, auth/cart/store contexts, demo fallback
supabase/
  migrations/   SQL schema + seed
```
