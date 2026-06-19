// ============================================================================
// The Mirror Platform — derived sitemap (P15, §4). Generated from published rows
// in public_meta, so it updates as rows are added with no rebuild. Admin/gated
// paths are excluded (they are noindex / disallowed in robots).
// ============================================================================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eayfuwbzdidhbkfjkohv.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "sb_publishable_UPRtH2k8qIC7AxUoEyErWA_2nHAybU7";

export default async (request: Request) => {
  const origin = new URL(request.url).origin;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/public_meta?select=kind,slug`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  const rows: { kind: string; slug: string }[] = r.ok ? await r.json() : [];

  const urls = [
    `${origin}/`, `${origin}/map`, `${origin}/about`, `${origin}/events`,
    ...rows.map((x) => `${origin}/${x.kind === "thread" ? "t" : "c"}/${x.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "content-type": "application/xml" } });
};

export const config = { path: "/sitemap.xml" };
