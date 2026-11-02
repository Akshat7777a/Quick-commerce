# L MART design system

This document describes the visual system shipped in the `v-redesign-1.0` release. The
single source of truth is `core/src/styles/tokens.css`. Tailwind names in
`core/src/index.css` map onto those variables, and components read only those names or
the variables themselves. No component hard-codes a colour, radius, shadow or font size.

## Principles

1. Calm and legible first. Cream background, white surfaces, one green action colour and
   a small gold accent. No gradients on surfaces, no decorative animation, no colour used
   only for decoration.
2. Real content only. Prices, discounts, stock, delivery facts and store status come from
   the database. Nothing invents urgency, ratings or savings.
3. One obvious action per screen. ADD on product tiles, one primary button per form, one
   primary link per empty state.
4. Touch first. Interactive targets are at least 44px tall (`--lm-tap`), including footer
   and header links that look like plain text.
5. Text and layout survive slow networks. Space for data-driven regions is reserved before
   the data arrives.

## Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| `--lm-bg` | `#f7f4ec` | Page background (warm cream) |
| `--lm-bg-soft` | `#efeade` | Skeletons, secondary panels |
| `--lm-surface` | `#ffffff` | Cards, sheets, sticky bars |
| `--lm-primary` | `#1e7b3c` | Primary buttons, links, ADD control |
| `--lm-primary-pressed` | `#155d2c` | Pressed and hover state |
| `--lm-primary-tint` | `#e7f3ea` | Selected chips, subtle highlights |
| `--lm-accent` | `#f5c542` | Small highlights only, never text on cream |
| `--lm-accent-soft` | `#fdf3d7` | Offer tags, soft badges |
| `--lm-text` | `#1a1a1a` | Body and headings |
| `--lm-text-muted` | `#5f5f5f` | Secondary text |
| `--lm-text-disabled` | `#9a9a9a` | Disabled labels |
| `--lm-border` | `#e6e1d3` | Hairlines, input borders |
| `--lm-success` | `#1e7b3c` | Confirmed states |
| `--lm-warning` | `#8a5200` | Store closed, low stock (4.5:1 on cream) |
| `--lm-error` | `#c62828` | Validation and failures |

Dark mode and seasonal palettes are deliberately not implemented. A second theme would
need a full re-check of every contrast pair, so it is out of scope for this release.

## Type

- Family: `--lm-font`, Inter first, Noto Sans Devanagari for Hindi script, then system
  sans. Both are self-hosted through `@fontsource`, so no third-party font request.
- Page title: 20px / 28px line, semibold.
- Section title: 18px / 24px line, semibold.
- Body: 14px / 20px line, regular.
- Small: 12px / 16px line, regular or medium.
- Price: 16px semibold.
- Weights used: 400, 500, 600 only.

Text never goes below 12px. Long names clamp to two lines rather than shrinking.

## Space, shape, elevation, motion

- Spacing is a 4px scale: 4, 8, 12, 16, 20, 24, 32, 40.
- Radius: cards 12px, controls 8px, sheets 16px, tags 4px. Pills are used only for
  status chips, never for primary buttons.
- Elevation: one soft shadow (`--lm-shadow-sticky`), used only on sticky bars and sheets.
- Motion: 150ms for state changes, 180ms for sheets and drawers, one easing curve.
  No parallax, cursor effects or scroll hijacking.

## Layout

- `container-page` caps content at 1200px with 16px gutters (24px from `sm`).
- Header: compact bar with logo, PIN picker, search and cart. On phones the search sits on
  its own row; the header is hidden on `/search` so the field owns the screen.
- Bottom navigation keeps the owner's four tabs: Home, Shop, Categories, Account, plus a
  cart bar when the cart has items. It is hidden on `/checkout` and shown on desktop by
  owner request.
- Product grid: 2 columns on phones, 3 at `sm`, 4 at `lg`, 5 at `xl`.

## Components

All live in `core/src/components/ui/`.

| Component | Rules |
| --- | --- |
| `Button` | Variants primary, secondary, ghost, danger; sizes sm, md. One primary per view. |
| `AddControl` | ADD when not in cart, then minus and plus with the count. Shows a spinner while the mutation runs. Never a second ADD elsewhere on the same tile. |
| `ProductTile` | Square image area, optional real discount tag, two-line name, pack size, price, struck MRP only when higher, ADD. Image and name open the product page. |
| `ProductGrid` / `ProductTileSkeleton` | Grid owns column counts. First four tiles may load eagerly, the rest lazily. |
| `CategoryTile` / `CategoryRail` / `CategoryChip` | Rail scrolls horizontally, 80px tiles, no arrows. Chips are for filters only. |
| `SearchBar` | Owns focus and the clear button. Recents are stored per browser. |
| `Sheet` | Bottom sheet on phones, centred dialog from `sm`. Escape and backdrop close it. |
| `CartBar` | Fixed above the bottom nav, shows count and total, hidden when the cart is empty or on `/checkout`. |
| `StatusTimeline` | Order states as a vertical list with the current step marked, timestamps only when real. |
| `Field` / `TextAreaField` | Label above input, hint below, error replaces hint and sets `aria-invalid`. |
| `Primitives` | `Spinner`, `Skeleton`, `ProgressBar`, `StateBlock` for empty, error and loading states. |

## Patterns

- Loading: skeletons for the banner and category rail are height-matched to their loaded
  content. Product shelves appear in place instead of replacing a shorter skeleton grid,
  which was the main source of layout shift.
- Empty: `StateBlock` with one sentence and one action, never a dead end.
- Errors: plain sentence, retry when the action is safe to repeat.
- Toasts: short confirmations, with an Undo action where a change is reversible (cart
  quantity). Six seconds when an action is offered.

## Accessibility standards

- Every page has one `h1`, sections use `h2`, product names use `h3`. A visually hidden
  `h2` is used where a grid would otherwise skip a level.
- Inactive carousel slides are `aria-hidden` and `inert`, so their links cannot be focused.
- Icon-only buttons carry an `aria-label`. Buttons with visible text do not use an
  `aria-label` that omits that text; extra meaning goes in visually hidden text.
- Contrast: body text at least 4.5:1 on its surface, large text at least 3:1. The warning
  colour was darkened to `#8a5200` for this reason.
- Focus is visible on every interactive element, including links inside cards.
- No horizontal scrolling at 360px. Long names truncate or clamp.

## Images

- Unsplash URLs are rewritten to the displayed width through `core/src/lib/images.ts`.
- Supabase product images are served as uploaded. The project's image transform endpoint
  returns 403, so the app cannot downscale them. Owner uploads should be at most 400px on
  the long edge and under 100KB.
- The hero photo is rendered from `sm` up only; on phones the banner is text on its tone
  background, which keeps the mobile largest paint out of a late third-party download.

## Changing the theme

1. Edit values in `core/src/styles/tokens.css`.
2. Keep the token names; components and Tailwind names depend on them.
3. Re-check contrast for `--lm-text` on `--lm-bg`, `--lm-primary` on `--lm-surface`, and
   every text colour on `--lm-primary`.
4. Run `npm run build` and the Lighthouse command in `FINAL_REPORT.md`.
