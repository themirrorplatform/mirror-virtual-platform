// ============================================================================
// The Mirror Platform — server-true <head> (P15, the SPA-meta trap §2)
// Scrapers don't run JS, so per-route title/description/OG/canonical/JSON-LD are
// injected into the HTML head BEFORE it is served. Gated bodies never leak: meta
// comes from public_meta (construction = title-only handshake, §4). The body
// stays client-rendered; only the head is server-true.
// ============================================================================
import type { Context } from "https://edge.netlify.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eayfuwbzdidhbkfjkohv.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "sb_publishable_UPRtH2k8qIC7AxUoEyErWA_2nHAybU7";
const HOUSE_IMG = "/og-default.png";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Meta { title: string; description: string; canonical: string; noindex?: boolean; jsonld?: object }

async function fetchMeta(kind: "thread" | "construction", slug: string) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/public_meta?kind=eq.${kind}&slug=eq.${encodeURIComponent(slug)}&select=title,description,author_handle`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] ?? null;
}

async function buildMeta(url: URL): Promise<Meta> {
  const path = url.pathname;
  const origin = url.origin;
  const house = "The Mirror Platform — the meta-philosophy";

  // admin / account / auth: not for discovery (noindex), no leak
  if (/^\/(architect|builder|account|signin)/.test(path)) {
    return { title: house, description: "", canonical: origin + path, noindex: true };
  }

  const t = path.match(/^\/t\/([^/]+)/);
  if (t) {
    const m = await fetchMeta("thread", t[1]);
    if (m) return {
      title: m.title, description: m.description, canonical: `${origin}/t/${t[1]}`,
      jsonld: { "@context": "https://schema.org", "@type": "CreativeWork", headline: m.title,
        author: { "@type": "Person", name: m.author_handle }, isPartOf: { "@type": "CreativeWorkSeries", name: "The Mirror Platform" },
        url: `${origin}/t/${t[1]}` },
    };
    return { title: house, description: "A continuation in a living philosophical corpus.", canonical: `${origin}/t/${t[1]}` };
  }

  const c = path.match(/^\/c\/([^/]+)/);
  if (c) {
    const m = await fetchMeta("construction", c[1]);
    // title + handshake only — never the gated body (§4)
    const title = m ? `${m.title} — a construction beneath the spine` : house;
    return { title, description: m?.description ?? "The formal grounding beneath the spine.", canonical: `${origin}/c/${c[1]}` };
  }

  if (path === "/" ) return { title: house, description: "A corpus that carries its work to the edge of an encounter it cannot itself close. Nothing here completes.", canonical: origin + "/" };
  if (path.startsWith("/map")) return { title: "Atlas — The Mirror Platform", description: "Where the work reaches, verb-tagged.", canonical: origin + path };
  if (path.startsWith("/about")) return { title: "About — The Mirror Platform", description: "The public surface of a philosophical corpus, published as A Reflection.", canonical: origin + path };
  if (path.startsWith("/events")) return { title: "Events — The Mirror Platform", description: "The Deep Read and new drops.", canonical: origin + path };
  if (path.startsWith("/forum")) return { title: "Forum — The Mirror Platform", description: "", canonical: origin + path, noindex: true };
  return { title: house, description: "", canonical: origin + path };
}

function metaTags(m: Meta): string {
  const og = m.canonical;
  const lines = [
    `<meta name="description" content="${esc(m.description)}" />`,
    m.noindex ? `<meta name="robots" content="noindex" />` : `<meta name="robots" content="index,follow" />`,
    `<link rel="canonical" href="${esc(m.canonical)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(og)}" />`,
    `<meta property="og:image" content="${HOUSE_IMG}" />`,
    `<meta property="og:site_name" content="The Mirror Platform" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
  ];
  if (m.jsonld) lines.push(`<script type="application/ld+json">${JSON.stringify(m.jsonld)}</script>`);
  return lines.join("\n");
}

export default async (request: Request, context: Context) => {
  const res = await context.next();
  const ctype = res.headers.get("content-type") ?? "";
  if (!ctype.includes("text/html")) return res;

  const meta = await buildMeta(new URL(request.url));
  let html = await res.text();
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace("</head>", metaTags(meta) + "\n</head>");

  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return new Response(html, { status: res.status, headers });
};

export const config = { path: ["/", "/t/*", "/c/*", "/map", "/about", "/events", "/forum", "/account", "/signin", "/architect", "/builder"] };
