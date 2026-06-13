# The Deep Read

> Five humans. Five machines. Five true stories.

The one-page site for **The Deep Read**, brought to you by *A Reflection of The
Mirror Platform* — deployed at **https://www.themirrorplatform.com**.

## Layout

| Path | What it is |
|---|---|
| `deep-read-react/` | The live site — Vite + React, the project that builds & deploys (`dist/`). |
| `deep-read-site/` | The static v3 build — the **canonical source of truth** for all copy, structure, and design language. Reference only. |
| `crest.jpeg` | The brand crest (favicon + hero). |

## Develop

```bash
cd deep-read-react
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Design system (locked)

Stage `#0B0A08` · Bone `#E9E4D8` · Dim `#A39A87` · Gold `#C9A227` (human) ·
Steel `#8FA7B3` (machine) · Seal `#B3261E` (stamps only).
Grammar: **gold = human, steel = machine, mono = evidence, red = seals only.**
Fonts: Playfair Display (display) · Spectral (body) · IBM Plex Mono (labels).

The five document pages (`protocol`, `vow`, `seal-log`, `about`, `institute`)
ship as static files in `deep-read-react/public/` and are served verbatim.

---

*The previous Mirror Virtual Platform monorepo that occupied this repository
remains recoverable in git history prior to this commit.*
