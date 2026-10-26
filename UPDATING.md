# UPDATING.md, how to ask for and ship a change from now on

The app is now a frozen core plus numbered patches.

- `core/`: the app itself. Treated as frozen. Future changes do NOT edit core
  files. The only exception is adding an extension point there (a new slot,
  hook or registry), which needs your explicit approval and its own commit,
  because it is a core change.
- `patches/<nnn-name>/`: one folder per update. Numbered, self-contained,
  removable by deleting the folder.

A patch can only attach to the documented extension points in
`core/src/lib/extensions.ts`:

- `registerRoute({ path, element, bare? })`: a whole page. `bare: true`
  renders without header/footer, otherwise inside the storefront shell.
- `registerSlot(name, component)`: UI positions that exist today:
  `home-top` (above everything on the home page), `checkout-before-summary`
  (before the order summary card at checkout), `footer-note` (extra footer
  line). Adding a new slot is a core change, needs approval.
- `registerHook("before-checkout" | "after-checkout" | "before-order-confirm")`
  and `registerThemeTokens({ "--css-var": "value" })`.

Fail-safety, verified with the demo round in Phase 2:

- A patch that throws while loading is skipped and the core boots normally.
- A patch component that crashes at runtime shows the section fallback only
  inside that patch.
- `"enabled": false` in a patch's own `manifest.json`, or its id in
  `patches/patches.config.json` `disabled: []`, turns it off without deletion.
- Deleting the patch folder returns the app to exactly the previous version
  (verified). If the patch declared `requires_db_migration: true`, run its
  `down.sql` first, because folders are not the database.

## How to request a new update

Copy this template into the chat and fill it in:

```
Update request: <short title>

What should change:
  <describe the behaviour, not the implementation>

Where it shows up:
  <home page / shop / product / cart / checkout / orders / admin / other>

Data changes:
  <none, or what new columns/tables are needed>

Must not touch:
  <anything that must stay exactly as it is>

How I will decide it works:
  <the check I would do myself, e.g. "add an item, see the new field at checkout">
```

Every such request becomes `patches/<nnn>-<name>/` by default. Core changes
happen only when the behaviour genuinely cannot plug into an extension point.

## What a patch folder contains

```
patches/001-add-coupon-field/
  manifest.json     id, title, date, version, description, depends_on,
                    enabled, requires_db_migration
  patch.tsx         export default { register(extensions) { ... } }
  up.sql            only if requires_db_migration: true
  down.sql          the undo for up.sql, documented in the README
  README.md         what changed, how to test, how to remove it
```

Rules: no edits outside the folder, no new dependencies without a commit that
says so, README must state the removal steps, and every patch is one commit
followed by a `vX.Y.Z` tag after deployment (see ROLLBACK.md).
