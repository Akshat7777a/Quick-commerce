# ROLLBACK.md, going back to an earlier version

Two kinds of rollback: app code, and database.

## 1. Roll back a single update (no deploy, no git)

Delete the patch folder:

```
patches/<nnn-name>/
```

If its manifest said `requires_db_migration: true`, FIRST run the patch's
`down.sql` (see the patch README for where): Supabase, SQL Editor, paste, Run.
Then delete the folder, rebuild and deploy. Deleting the folder removes the
code with no other edits needed.

Prefer turning it off first to check: `"enabled": false` in the patch's
`manifest.json` (add the comma in the right place), rebuild, deploy. Keep the
folder as a record.

## 2. Roll back the whole deployment on Cloudflare

Every deployed version has a tag: v1.0.1, v1.0.2 and so on (v-baseline is the
state before this whole improvement work).

Option A, Cloudflare dashboard (no git, friendly):

1. Cloudflare dashboard, Workers and Pages, click `lmart`.
2. Deployments / Versions tab: every earlier version is listed.
3. Rollback to the version that worked. This is instant and reversible.

Option B, redeploy a git tag from the machine:

```
git checkout v1.0.1
npm install
npm run build
npx wrangler deploy
git checkout main
```

## 3. Before every deploy

Run the smoke test:

```
node scripts/smoke.mjs
```

It checks (against a local preview server): home loads, product list returns
rows, add to cart state works, checkout renders, no console errors. Unless it
prints SMOKE OK, do not deploy.
