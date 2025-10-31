# The Mirror Virtual Platform (GitHub Pages Starter)

A free, fully‑controlled static site built for GitHub Pages + Namecheap custom domain.

## Features
- Gold/Black reflective theme
- Home carousel with 7 Mirrors (cursor‑edge advance + mobile swipe)
- SPA hash routes: Home, About, Help, Social, Discussions, Coming Soon, Money
- Gumroad + ConvertKit + Discord embed placeholders
- SEO: meta, robots.txt, sitemap.xml
- 404 SPA fallback
- **CNAME** file for custom domain

## Quick Start
1. Create a GitHub repo named `themirrorplatform.online` (or any name).
2. Upload all files from this folder to the repo root.
3. In repo Settings → Pages → Source: `main` branch `/root`.
4. In Settings → Pages → Custom domain: `themirrorplatform.online`.
5. In Namecheap DNS, create:
   - A @ → 185.199.108.153
   - A @ → 185.199.109.153
   - A @ → 185.199.110.153
   - A @ → 185.199.111.153
   - CNAME www → yourusername.github.io
6. Wait for DNS to propagate (5–30 mins).

## Customize
- Replace `YOUR_DISCORD_SERVER_ID` in `index.html`.
- Replace Gumroad links with your products.
- Paste your ConvertKit embed inside the Money section placeholder.
- Swap assets in `/assets` and OG image path in `<head>`.

## Dev Notes
No build step required. Vanilla HTML/CSS/JS. Tested for mobile swipe and desktop hover‑edge navigation.
