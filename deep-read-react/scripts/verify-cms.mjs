// Verify the Home content editor end-to-end against the LIVE site: sign into the
// admin, edit the headline through the UI, confirm it changes on the homepage,
// upload a crest image and confirm it renders, then revert everything.
import { chromium } from '@playwright/test';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
if (existsSync(join(root, '.env'))) for (const l of readFileSync(join(root, '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const SITE = 'https://mirrorplatform.online';
const TOKEN = process.env.ADMIN_TOKEN;
const SUPA = process.env.VITE_SUPABASE_URL;
if (!TOKEN) { console.error('Set ADMIN_TOKEN'); process.exit(2); }
const results = []; const ok = (n, p, d = '') => { results.push(p); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };
const MARK = `Headline ${Date.now()}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: 'reduce', ignoreHTTPSErrors: true });
const page = await ctx.newPage();

// sign in
await page.goto(`${SITE}/admin`, { waitUntil: 'load' });
await page.fill('#token', TOKEN);
await page.click('#gate button[type=submit]');
await page.waitForSelector('#panel:not(.hidden)', { timeout: 8000 });
await page.click('#tab-content');
await page.waitForTimeout(1200);
const loaded = await page.inputValue('#c-headline');
ok('Home-content tab loads current headline', loaded.length > 0, `"${loaded}"`);

// edit headline + save
await page.fill('#c-headline', MARK);
await page.click('#cform button[type=submit]');
await page.waitForFunction(() => document.getElementById('c-status').textContent.includes('Saved'), { timeout: 8000 });
ok('Save reports success', true);

// crest upload via UI
const png = join(root, 'scripts', '_probe.png');
writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
await page.setInputFiles('#c-crest-file', png);
await page.waitForFunction(() => document.getElementById('c-status').textContent.includes('uploaded'), { timeout: 12000 });
await page.click('#cform button[type=submit]');
await page.waitForFunction(() => document.getElementById('c-status').textContent.includes('Saved'), { timeout: 8000 });
const crestUrl = await page.getAttribute('#c-crest-preview', 'src');
ok('Crest image uploaded to storage', !!crestUrl && crestUrl.includes('/storage/v1/object/public/site/assets/'), crestUrl);

// confirm on the live homepage
const home = await ctx.newPage();
await home.goto(`${SITE}/?webgl=off`, { waitUntil: 'load' });
await home.waitForTimeout(1500);
const h1 = await home.textContent('h1');
ok('Homepage shows the edited headline', (h1 || '').trim() === MARK, `"${(h1 || '').trim()}"`);
const imgSrc = await home.getAttribute('#open .crest img', 'src');
ok('Homepage crest uses the uploaded image', !!imgSrc && imgSrc.includes('/storage/v1/object/public/site/assets/'), imgSrc);
await home.close();

// revert via the content API (clean slate)
await fetch(`${SUPA}/storage/v1/object/site/content.json`, {
  method: 'POST', headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', 'x-upsert': 'true' },
  body: JSON.stringify({ home: { headline: 'The Deep Read', intro: 'A first-of-its-kind experiment about something we all wonder: how well can anyone really understand what an experience does to a person?' } }),
});
const back = await ctx.newPage();
await back.goto(`${SITE}/?webgl=off`, { waitUntil: 'load' });
await back.waitForTimeout(1500);
const reverted = await back.textContent('h1');
ok('Reverted: homepage back to "The Deep Read"', (reverted || '').trim() === 'The Deep Read', `"${(reverted || '').trim()}"`);

await browser.close();
const failed = results.filter((p) => !p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
