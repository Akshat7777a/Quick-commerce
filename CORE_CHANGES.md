# Core change log

Every change to `core/src` made during the hardening pass beyond genuine bug
fixes is supposed to live in `patches/`, but patches can only attach to
documented extension points. The performance and correctness issues below
required minimal edits inside core itself, so they are logged here instead.

Rules kept: smallest correct change, no feature addition, no data deletion, no
visual redesign. Each entry lists the defect measured before the change and the
numbers measured after it.

Baseline and after-runs were measured locally with
`.internal/meas/throttle-metrics.mjs` (real Chrome, DevTools "Slow 4G"
1.6 Mbps down / 750 kbps up / 150 ms RTT, 4x CPU throttle, 360x800 viewport,
cold cache). Raw evidence: `.internal/meas/before-metrics.log`,
`before-local.json`, `before2-local.json`, `after-local.json`,
`after2-raw.log`.

## Phase B

- **Lazy-load admin routes** (`App.tsx`). The admin dashboard bundle shipped in
  the main chunk for every shopper. `React.lazy` + a Suspense fallback now load
  admin routes on demand. Measured: main JS chunk 206.4 KB gz -> 188.2 KB gz;
  ten admin chunks of 2.3-7.8 KB gz load only in `/admin`.
- **Deduplicate category fetches** (`api.ts`). Concurrent components each fired
  their own `listCategories()` request on Slow 4G. A shared promise pool now
  fans out one request; mutations on categories clear the pool.
- **Reserve hero height while banners load** (`BannerCarousel.tsx`). The
  carousel rendered nothing until the banners request landed, shifting the
  whole page by ~26rem. Skeleton with `min-h-[26rem]`. Measured: home CLS
  0.438 -> 0.
- **Render each home section when its own request lands** (`Home.tsx`). The
  banner was gated behind `Promise.all` of five requests, so its LCP image did
  not start loading until the slowest resolved. Measured: home LCP 15,416 ms ->
  10,072 ms on the same throttled run.
- **Downscale the eager banner image for phones** (`BannerCarousel.tsx`). Banner
  URLs are Unsplash and already carry `w=1600&q=80`; on a 360px viewport that
  overscans the home LCP element. Dragged to `w=800&q=75` for the eager slide
  (`fetchPriority="high"`, `decoding="async"`). Only `images.unsplash.com` URLs
  are rewritten; Supabase or other hosts pass through untouched.
- **Home category tiles duplicated accessible names** (`Home.tsx`). The tile
  had an `alt={category.name}` image plus visible text with the same name, so
  screen readers announced it twice. Image `alt` is now empty.
- **Free-delivery display matched the server, not the database**
  (`cart.tsx`). The DB rule (`place_order()`) is
  `subtotal >= coalesce(free_delivery_above, 0)` with no "threshold must be
  positive" guard; the client required `free_delivery_above > 0`, so a
  threshold of 0 would show delivery as paid while the server charged free.
  Client condition now mirrors the DB exactly.
- **Product skeleton did not match the loaded layout** (`ProductPage.tsx`).
  The loading skeleton lacked the breadcrumb bar and its text column was
  ~80px shorter, so the first data render shoved everything below the grid
  down. Measured: `/product/masala-bingo-200g` CLS 0.303 -> 0.003.
- **Mobile one-column grids** (`Account.tsx`, `Auth.tsx`, `Checkout.tsx`,
  `Home.tsx`, `ProductPage.tsx`, `admin/AdminDashboard.tsx`,
  `admin/AdminLayout.tsx`). Grids declared wide templates only from the base
  breakpoint up, causing horizontal overflow at 360px. Explicit
  `grid-cols-1` base.

## Measured totals (Slow 4G + 4x CPU + 360x800, cold cache)

| URL | Metric | Before | After |
| --- | --- | --- | --- |
| `/` | LCP | 15,416 ms | 10,072 ms |
| `/` | CLS | 0.438 | 0.000 |
| `/shop` | LCP | 3,580 ms | 1,440 ms |
| `/shop` | TBT | 1,756 ms | 621 ms |
| `/product/masala-bingo-200g` | CLS | 0.303 | 0.003 |
| `/login?next=/orders` | LCP | 1,192 ms | 1,108 ms |
| `/login?next=/orders` | TBT | 276 ms | 115 ms |

Product LCP numbers vary run to run (4,864 / 4,844 / 6,248 ms across runs, the
LCP element is the data-gated product heading); no improvement is claimed
there. Home LCP remains dominated by client-side boot time plus the Unsplash
transfer; remaining levers need owner decisions (image sizes are owner data).

## Phase C audit (no code change)

The service worker (`core/public/sw.js`, byte-identical modulo line endings to
the deployed `/sw.js`, 2,501 B; registration wired in `main.tsx` with a
secure-context guard) was audited end to end. Verdict: no genuine bug; both
candidate concerns are intentional tradeoffs that are correct for this app as
built.

- **skipWaiting + clients.claim**: a redeployed worker takes control of open
  tabs immediately. Safe here because navigations are network-first (no stale
  page), assets are immutable and hashed, and nothing couples worker session
  state to page state. The rare edge is an old tab whose first-ever admin lazy
  chunk request lands after a redeploy; forcing a reload recovers. Immediate
  control is also what lets users pick up the offline fallback quickly, so
  fixing the edge by delaying activation would cost more than it buys.
- **Old hashed assets retained in cache**: `activate` only deletes caches with
  a different name and the name is fixed (`lmart-v1`), so superseded assets
  accumulate (~1-2 MB per deploy) until the browser's own CacheStorage
  eviction kicks in. Retention also lets an already-open tab keep working
  across a redeploy, which pruning would break, so no pruning was added.
- **Privacy check**: only same-origin GET requests are intercepted; Supabase
  API traffic, images and cross-origin anything pass untouched, so no user
  data or auth material ever enters the cache.
- **Verified live and offline** (real Chrome, 360x800): worker registers and
  activates on scope `/`; offline home navigation serves the cached copy with
  HTTP 200; an offline deep link (`/product/...`) serves the cached home
  fallback as designed.

## Blocked on owner input

- **Product/aisle image bytes** (`M-02`): Supabase image transformations are
  not enabled on the project (params are ignored, same bytes returned). Owner
  must either enable transformations (paid feature) or re-upload pre-resized
  images. No code change can resize those bytes today.
- **Admin account flag** (`M-09`): the README documents
  `lmart.store.test@gmail.com` as admin, but `/admin` rejects it; `is_admin`
  needs owner verification in the database.
- **Service worker behaviour** (`M-06`): `sw.js` skipWaiting/clients.claim
  audit deferred to Phase C.

## Phase D audit (Supabase live data-access; no code change)

The migrations in `supabase/migrations/` declare the intended policy model;
this phase verified by probing the **live** database that the model actually
holds, using the public anon key and the shipped test account, plus a one-off
throwaway signup. Probes were booby-trapped (incomplete bodies, zero-match
filters, invalid MIME) so no real data could be created or changed.

- **RLS is enforced live.** Anon and customer INSERTs into `products` return a
  proper `42501` row-level-security violation; anon reads of `orders` and
  `profiles` return nothing; `admin_customers()` answers "Admin access
  required."; a non-admin image upload to the `product-images` bucket is
  rejected by RLS (and non-image MIME is rejected by the bucket itself).
- **Profile auto-create is live.** A throwaway signup instantly got a
  `profiles` row with `role = 'customer'` (`handle_new_user` trigger works).
- **Self-escalation to admin is blocked, verified by behavior.** The probe
  account PATCHed its own profile to `role = 'admin'`; PostgREST reported the
  row as written, but the `guard_profile_role` trigger silently kept the old
  `customer` value (read-back confirms). The README's security claim holds on
  the live DB.
- **No secrets exposure.** Only the anon key ships with the client; no
  service-role key appears anywhere in `core/src` or scripts.
- **Drift observations (owner, low priority):**
  1. An anonymous caller can *invoke* the `place_order` RPC (expected:
     "permission denied"); it fails harmlessly at the sign-in guard, but the
     least-privilege revoke on the function is not effective on the live DB.
     Re-run `revoke all on function public.place_order ... from public` in the
     SQL editor as defense in depth.
  2. The test account (`lmart.store.test@gmail.com`, uid
     `7fae7815-39f8-406f-a0f6-5846478803fd`) has an auth user but **no
     `profiles` row** (even its own `select own` returns nothing). It was
     likely created before the auto-create trigger went live. This fully
     explains M-09: `is_admin()` reads the profile row, so promoting this
     account to admin also requires inserting its missing profile row.
- **Signup auto-confirm is enabled** (instant session, no email
  verification). Acceptable for a neighbourhood store, but the owner should
  know anyone can create disposable accounts.
- **Cleanup note:** one throwaway probe account was created during this audit:
  uid `5f44bb85-3dba-4146-a9d7-a99972db576f`,
  email `lmart.probe.1793649236@gmail.com` (also recorded in
  `.internal/probe-account.txt`). Its role was never changed from `customer`.
  The owner can delete it in Supabase → Auth if desired.

## Home page simplification (owner-directed)

Owner reviewed the local preview and asked for a leaner, flatter home page.
Changes, all in `core/src/pages/Home.tsx` and
`core/src/components/BannerCarousel.tsx`, preserving the visual identity:

- **Shorter banner poster.** Slide height reduced from 26/30/32rem to
  17/21/24rem (mobile measured 272 px vs ~416 px before; desktop 384 px), the
  poster heading scale reduced a step, skeleton matches the new height, CTA
  button one step smaller. Same image, same tones, same autoplay/dots.
- **Trust strip removed.** The four-pillar band ("Cash on delivery / Free
  over 499 / Delivery times / Delivery area") is gone from the home page.
  Details still live where they matter (checkout, shop, footer).
- **"Shop the aisles" category rail removed.** Redundant with the Shop tab,
  which already shows all categories. This also drops the per-home
  `listCategories` request.
- **"How to order" section removed** (heading, copy, and the
  Fill basket / Confirm order / Pay at the door step list). The CTA the owner
  wanted to keep ("Explore the shop") becomes a quiet centered band between
  the featured strip and the full shelf.
- **Featured section auto-hides** when the DB has no `is_featured` products
  (true at audit time; live DB returned no flagged products), so the page
  never shows an empty band. It reappears as soon as products are flagged in
  the admin panel.

Home sections are now, top to bottom: poster, (featured when flagged),
explore band, full shelf (+ mobile "Browse all products"). Main chunk shrank
slightly: 188.2 KB to 187.5 KB gzip. Verified at 360x800 and 1280x800 in the
preview: no console errors, no horizontal overflow, featured/full-shelf grids
render.

Follow-up (same owner review): the "Everyday essentials / Browse the whole
shop" band added above is also removed. The home page is now just the poster,
the Featured strip (only when products are flagged), and the full shelf with
its mobile "Browse all products" button. The Shop tab and every section
heading already link nowhere else a CTA band needed to point.
