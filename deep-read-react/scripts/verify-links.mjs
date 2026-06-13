// Verify the Substack link placements (Prompt 7, part 1).
import { chromium } from '@playwright/test';
import { startServer } from './_server.mjs';

const { server, url: BASE } = await startServer('dist');
const results = [];
const ok = (n, p, d = '') => { results.push({ p }); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };

const browser = await chromium.launch();
const page = await browser.newPage();

// ---- one-pager ----
await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
await page.waitForTimeout(300);

const seat = await page.evaluate(() => {
  const a = document.querySelector('.seat-dispatch a');
  return a && { href: a.href, target: a.target, rel: a.rel, text: a.textContent };
});
ok('Seat dispatch line links to the newsroom (new tab, rel me noopener)',
  seat && /@themirrorplatform$/.test(seat.href) && seat.target === '_blank' && /me/.test(seat.rel) && /noopener/.test(seat.rel),
  seat ? `${seat.href} rel="${seat.rel}"` : 'missing');

const footer = await page.evaluate(() => {
  const a = [...document.querySelectorAll('footer.fin a')].find((x) => /substack/.test(x.href));
  return a && { href: a.href, target: a.target, rel: a.rel, text: a.textContent.trim() };
});
ok('Footer has NEWSROOM -> newsroom (new tab)',
  footer && footer.text === 'NEWSROOM' && /@themirrorplatform$/.test(footer.href) && footer.target === '_blank',
  footer ? `${footer.text} -> ${footer.href}` : 'missing');

const houseSubstack = await page.evaluate(() => document.querySelectorAll('#house a[href*="substack"]').length);
ok('#house has NO Substack links (story before socials)', houseSubstack === 0, `count=${houseSubstack}`);

const houseAttrib = await page.evaluate(() =>
  [...document.querySelectorAll('#house .attrib a')].every((a) => /\/about\.html$/.test(a.getAttribute('href'))));
ok('#house attribution still links to the About page', houseAttrib);

// ---- about page ----
await page.goto(`${BASE}/about.html`, { waitUntil: 'load' });
const about = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.reader a')].filter((a) => /substack/.test(a.href));
  const byUrl = (u) => links.find((a) => a.href.includes(u));
  const np = byUrl('@themirrorplatform');
  const rf = byUrl('@themirrorreflection');
  const okRel = (a) => a && a.target === '_blank' && /me/.test(a.rel) && /noopener/.test(a.rel);
  return { hasNp: !!np, hasRf: !!rf, relNp: okRel(np), relRf: okRel(rf), count: links.length };
});
ok('About page links A Reflection -> @themirrorreflection (new tab, rel me noopener)', about.hasRf && about.relRf);
ok('About page links The Mirror Platform -> @themirrorplatform (new tab, rel me noopener)', about.hasNp && about.relNp);
ok('About page has exactly the two Substack links', about.count === 2, `count=${about.count}`);

await browser.close();
server.close();
const failed = results.filter((r) => !r.p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
