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
