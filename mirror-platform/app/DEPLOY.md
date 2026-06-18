# Deploying the Encounter Platform

## Where it lives
- **Netlify site:** `encounter-platform` (id `839288b5-e7de-4458-b4b0-46fcf5d9e47b`)
- **Preview URL:** https://encounter-platform.netlify.app
- **Admin:** https://app.netlify.com/projects/encounter-platform
- This is a **standalone preview** site. It is separate from the Deep Read
  (`the-deep-read`, id `42f8c91f-…`); point a domain at it only when it's ready
  to replace the Deep Read.

## What's deployed
- The Vite-React SPA (`dist/`), built locally with the `VITE_SUPABASE_*` values
  from `.env.local` baked in.
- Three Netlify **edge functions** (`netlify/edge-functions/`):
  - `head` — the server-true `<head>` per `/t/` and `/c/` (title, OG, canonical,
    JSON-LD) from `public_meta`. Gated bodies never preview; admin is `noindex`.
  - `sitemap` — `/sitemap.xml`, derived from published rows.
  - `robots` — `/robots.txt`, disallow admin/account/auth + sitemap pointer.

## Deploy an update (manual, from this folder)
```bash
cd mirror-platform/app
export NETLIFY_AUTH_TOKEN=<your Netlify PAT>
npm run build
netlify deploy --prod --dir dist --site 839288b5-e7de-4458-b4b0-46fcf5d9e47b
```

## Edge-function env (optional — public fallbacks are baked in)
The edge functions default to the public Supabase URL + publishable key. To set
them explicitly: Site settings → Environment variables (scope: Edge Functions):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (the publishable key — safe in the browser).

## Before go-live
- Add a real `public/og-default.png` (1200×630) for share-card images.
- Swap Stripe sandbox keys for your own (test → live) in the Supabase function
  secrets; configure OAuth providers + the Auth Site URL in Supabase.
- P17: seed the real graph + the wedge prose (authored — the AI-prose ban).
