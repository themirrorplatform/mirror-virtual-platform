# The Mirror Platform — The Shareability & SEO Spec

### Because there is no front door, every acquisition is a shared link to a continuation — so link-preview and discoverability are the funnel, not polish. The one technical trap: a React SPA serves empty meta to scrapers, so the meta must be rendered server-side or pre-rendered, or every share previews blank.

*Architect: Ilya Belous (“A Reflection”) · The Mirror Platform LLC. Follows from Everything Spec §2 (the inversion) and §13 (Vite-React SPA). §0–§3 frozen; image template provisional.*

-----

## §0. THE GOVERNING RULE

**The unit of discovery is the continuation, not the homepage — so per-page link-preview is load-bearing.** With no front door, a stranger arrives through a wedge essay or a shared `/t/` link. If that link previews blank or wrong, acquisition breaks at the first share. Two hard requirements: **meta correct per page type**, and because the site is an SPA, **the meta served to crawlers without requiring JS** (§2). Gated content must never leak into a preview.

-----

## §1. PER-PAGE-TYPE META (frozen)

|Page type|`<title>` / OG title|description|OG image|canonical|notes|
|---|---|---|---|---|---|
|**Continuation** `/t/`|the continuation’s title|**`share_line`** — author-written pull-line (§3), not auto-truncated|per-continuation card or house default|`/t/[slug]`|the primary shared object|
|**Construction** `/c/`|title + “a construction beneath [continuation]”|teaser only — **never the gated body** (§4)|house card|`/c/[slug]`|gated; preview is a handshake|
|**Home** `/`|“The Mirror Platform — the meta-philosophy”|the recognition line|house card|`/`|rarely the entry|
|**Map / Events / About**|page name + house|one plain line each|house card|self|public, plain|
|**Forum / Account / admin**|minimal|none / `noindex`|—|self|not for discovery|

Author = **A Reflection** (the handle), never the legal identity.

-----

## §2. THE SPA-META TRAP (frozen — the thing that silently breaks the funnel)

A Vite-React SPA ships an essentially empty HTML shell; real content (and client-set meta) appears only after JS runs. **Most social/scraper bots (Slack, iMessage, Twitter/X, Facebook, LinkedIn, Discord) do not run JS** — so client-side `<meta>` and react-helpers are invisible to them. The link previews blank even though the meta is “set.”

**Resolution (required, not optional):** per-`/t/` and per-`/c/` meta delivered **crawler-side without JS**, by one of:
- **SSR / pre-render the meta** — Vite SSR, or a Netlify prerender/edge function that detects bots and serves a meta-complete HTML head per slug; or
- **A dedicated OG/meta edge function** rendering `<head>` (title, description, OG, canonical, JSON-LD) from the node row for any `/t/[slug]` request, hydrating the SPA after.

The body can stay client-rendered; **the head must be server-true.** A Prompt-1-adjacent decision — name it in the build, not at first share.

-----

## §3. THE AUTHOR-OWNED SHARE LINE (frozen)

The continuation’s OG description is **`share_line`** — a field on the node, **authored** by A Reflection, never auto-generated and never machine-truncated (it is transmission-voice; AI-prose ban §17). The architect sets it at capture; if absent, fall back to a neutral house line, never to a truncated paragraph.

-----

## §4. DISCOVERABILITY MECHANICS (frozen)

- **Gated content never previews.** The read gate holds for scrapers too: a `/c/` or non-entry `/t/` exposes only its teaser in meta, never the body.
- **JSON-LD** `CreativeWork`/`Article` per continuation: headline, author (the handle), datePublished, isPartOf. Decoupled from PII.
- **Sitemap is derived** — generated from published `thread`/`construction` rows, updates as rows are added, no rebuild. `robots.txt`: allow public; **disallow** `/architect`, `/builder`, `/account`, gated `/c/` bodies; `noindex` admin.
- **`arrived_from` capture** — inbound links carry referrer/UTM; the landing reads it into the `arrival` event and the arrival-adaptive composition.
- **No ads, no trackers-for-sale** — analytics is the first-party event log only.

-----

## §5. THE ONE LINE

The inversion makes the homepage irrelevant to acquisition, so the funnel is the shared continuation link — which means the meta per page is the funnel, and because an SPA serves empty heads to the scrapers that build link previews, the meta must be rendered server-true or every share previews blank despite “working” in a browser; get that one pipeline decision right, give each continuation an author-written share line, keep every gated body out of every preview.
