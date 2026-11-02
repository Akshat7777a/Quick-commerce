# L MART redesign: final report

Release: `v-redesign-1.0` on branch `redesign/v1`. Previous state is preserved at tag
`v-pre-redesign`. Phase tags: `v-redesign-phase1`, `v-redesign-phase2`,
`v-redesign-phase3`.

## Scope delivered

Every customer-facing screen was rebuilt on one token system and component library:

- Home: category rail, offer carousel built from real banners, Order again from real
  orders, Offers today derived from real MRP, up to three category shelves.
- Shop: sticky category rail with active marker, sort and filters, 24-item chunks with
  Load more, scroll position restored on return.
- Search: new `/search` page with recent searches, category matches, debounced input and a
  WhatsApp request link when nothing matches.
- Product: single ADD action, real stock and savings, related products, pinned mobile bar.
- Cart drawer and checkout: progress, real bill, coupons only when active coupons exist,
  delivery slots, inline validation, sticky mobile submit, confirmation screen, Undo.
- Orders: timeline, expandable details, reorder.
- Account, refunds and cancellation page, 404 with search.
- Header, footer, bottom navigation and cart bar.
- Hidden `/design-system` gallery for the component library (lazy loaded).

Existing behaviour was kept: cart, orders, auth, Supabase schema, admin pages and the
patch architecture are untouched. Admin screens inherit the new palette only.

## Verification

All numbers are Lighthouse mobile runs against `vite preview` on this machine, with the
default simulated Slow 4G and 4x CPU throttling. Reports are in `.internal/lh-*.json`.

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 84 | 100 | 100 | 100 | 4.6s | 0.001 |
| Shop | 87 | 100 | 100 | 100 | 4.1s | 0 |
| Product | 88 | 100 | 100 | 100 | 4.0s | 0.001 |
| Search | 78 | 100 | 100 | 100 | 5.8s | 0.001 |

Home before the polish pass: performance 77, accessibility 89, LCP 5.0s, CLS 0.133.

Targets from the brief:

| Target | Result | Status |
| --- | --- | --- |
| Lighthouse mobile 90+ | 84 to 88 on all four pages | Not met |
| LCP at most 2.5s | 4.0s to 5.8s | Not met |
| CLS at most 0.05 | 0 to 0.001 | Met |
| Accessibility | 100 on all four pages | Met |
| Best practices and SEO | 100 on all four pages | Met |

### Why performance is below 90

The largest paint on every page is a product photo. The largest single file in the store
is a 1.07 MB WebP displayed at 134x134, and several others are 100KB to 200KB. The
project's Supabase image transform endpoint returns 403, so the app cannot request smaller
versions, and the owner uploads have not been replaced. That download alone takes about
five seconds on Slow 4G. On top of that the app is a client-rendered single page app: the
190KB (gzip) bundle must load before data is fetched and the grid painted. Hitting 2.5s
LCP requires smaller uploaded images, or server-side rendering, or an image CDN. None of
those can be done from the front end alone.

### What the polish pass fixed

- Accessibility: inactive carousel slides are now `inert` (focus could enter hidden CTAs),
  the warning colour moved from `#b76e00` to `#8a5200` for 4.5:1 on cream, footer legal
  links have 44px targets, the PIN button takes its accessible name from its visible text,
  the install label matches its text, and Shop gained a hidden `h2` so headings no longer
  jump from `h1` to `h3`.
- Layout shift: the category rail reserves its height while categories load, and the
  loading grid that was swapped for taller real shelves was removed. CLS went from 0.133 to
  0.001 on Home, and the intermediate states measured 0.24 to 0.62 while diagnosing it.
- Bytes and discovery: preconnect hints for the image CDN and Supabase, banner images
  rewritten to 1200px (first) and 800px (others) at quality 70, category images reduced from
  900px to 160px, and the hero photo is no longer downloaded on phones.
- A metric-matched fallback font was tried and reverted: it raised CLS to 0.618, so the
  plain Inter stack with system fallbacks ships instead.

## Needs owner input

These remain visible placeholders or gaps, not invented values:

- FSSAI licence number, GSTIN, registered trading name and opening hours for the footer and
  legal pages.
- Real clean square product photos, ideally 400px and under 100KB. This is also the main
  performance fix available.
- Logo file. The current mark is set in type.
- A decision on whether to enable Supabase image transformations, which would let the app
  request right-sized product images without re-uploading.

## Not verified

- Real checkout submission. The store is closed (`is_open` false), so the submit button is
  correctly disabled. Placing an order would create production data and needs owner
  approval with the store open.
- Width matrix at 360, 390, 768 and 1280px on the final build. Earlier phases were checked
  at 390px with no horizontal overflow; the final polish changed only image sources,
  spacing of footer links and a hidden heading.
- Tab return after several minutes idle. The app has no auto reload and keeps cart, forms
  and route in memory and storage, but a five-minute background test was not run.
- Safari on iOS and Samsung Internet. No devices were available.
- Real payment, coupon and delivery-slot edge cases beyond the disabled-store path.

## Rollback

The redesign is a normal set of commits on `redesign/v1`, not a patch package. To revert
everything: `git checkout v-pre-redesign`. To revert one phase, reset to the previous phase
tag. To keep the redesign but return the old look, restoring `core/src/styles/tokens.css`
and `core/src/index.css` from `v-pre-redesign` moves most colour and type back, though the
new components would need their old pages restored too.

## Reproduce the checks

```
npm run build
npx vite preview --port 4199
npx --yes lighthouse http://localhost:4199/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.internal/lh-final.json --chrome-flags="--headless=new --disable-gpu --no-sandbox" --quiet
```
