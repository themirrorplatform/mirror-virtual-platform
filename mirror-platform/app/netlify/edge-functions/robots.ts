// Robots (P15, §4): allow public, disallow admin/account/auth, point at the
// derived sitemap. Generated so the Sitemap line uses the live host.
export default (request: Request) => {
  const origin = new URL(request.url).origin;
  const body = [
    "User-agent: *", "Allow: /",
    "Disallow: /architect", "Disallow: /builder", "Disallow: /account", "Disallow: /signin",
    `Sitemap: ${origin}/sitemap.xml`, "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain" } });
};

export const config = { path: "/robots.txt" };
