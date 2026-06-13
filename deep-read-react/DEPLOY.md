# Deploying The Deep Read

## Where it lives
- **Netlify site:** `the-deep-read`  (id `42f8c91f-bf56-45d8-a99f-ffedc0cd0e25`)
- **Live (staging) URL:** https://the-deep-read.netlify.app
- **Admin:** https://app.netlify.com/projects/the-deep-read
- Security headers + cache rules: `public/_headers`. Build config: `../netlify.toml`.

The custom domain `www.themirrorplatform.com` is **not** attached yet — the site
is on the Netlify subdomain only, so the existing Duda site stays up until the
DNS go (below).

## Deploy an update (manual)
The repo isn't Git-connected to Netlify yet, so deploys are a build + zip push:

```bash
cd deep-read-react
npm run build
(cd dist && zip -qr /tmp/site.zip .)
curl -X POST -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/zip" --data-binary @/tmp/site.zip \
  https://api.netlify.com/api/v1/sites/42f8c91f-bf56-45d8-a99f-ffedc0cd0e25/deploys
```

To switch to push-to-deploy: connect the repo in Netlify (Site → Build & deploy),
which uses `netlify.toml` (base `deep-read-react`, publish `dist`). Then set the
two `VITE_SUPABASE_*` build env vars in Site settings → Environment variables.

## Before go-live: make the form save
The witness form posts to Supabase under RLS. It only saves once the migration
is applied (see `supabase/migrations/0001_witnesses.sql`). Until then the form
shows a retry error. Apply it via the Management API:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=hhyilmbejidzriljesph \
  node scripts/apply-migration.mjs
```

…or paste that SQL into the Supabase dashboard SQL Editor and run it.

## Go-live: point www.themirrorplatform.com at Netlify  (⏸ needs your go)
This takes the old Duda site dark for `www`, so do it deliberately.

1. **Netlify** → site → Domain management → **Add domain** `www.themirrorplatform.com`
   (and the apex `themirrorplatform.com`, set to redirect to `www`).
2. **At your DNS host** (registrar / Duda DNS) set:
   - `www`  → **CNAME** → `the-deep-read.netlify.app`
   - apex `@` → **A** → `75.2.60.5`  (Netlify load balancer), or an ALIAS/ANAME
     → `apex-loadbalancer.netlify.com` if your host supports it.
   - Remove the old Duda records for those names.
3. Netlify auto-provisions Let's Encrypt SSL once DNS resolves (a few minutes).
4. Verify: `https://www.themirrorplatform.com` serves the new site with valid SSL,
   and submit a test seat to confirm the save (after the migration is applied).

Alternatively, move the domain's nameservers to **Netlify DNS** and let it manage
both records automatically.
