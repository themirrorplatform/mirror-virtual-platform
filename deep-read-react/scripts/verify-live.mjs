// True end-to-end: drive the DEPLOYED site, submit a real seat, and confirm it
// landed in the live database via the service-role key. Cleans up after itself.
import { chromium } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const SITE = process.env.LIVE_URL || 'https://the-deep-read.netlify.app';
const URL = process.env.VITE_SUPABASE_URL;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = `live-probe-${Date.now()}@example.com`;
const results = [];
const ok = (n, p, d = '') => { results.push(p); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: 'reduce', ignoreHTTPSErrors: true });
const page = await ctx.newPage();
await page.goto(`${SITE}/`, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.evaluate(() => document.getElementById('seat')?.scrollIntoView());
await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 8000 });
await page.fill('input[name="name"]', 'Live Probe');
await page.fill('input[name="email"]', email);
await page.click('button:has-text("Save my seat")');
const done = await page.waitForSelector('.seat-done', { timeout: 6000 }).then(() => true).catch(() => false);
ok('Deployed site: submitting a seat shows the confirmation', done);
await browser.close();

// confirm it actually persisted, via service role
const r = await fetch(`${URL}/rest/v1/witnesses?email=eq.${encodeURIComponent(email)}&select=email,source,name`, {
  headers: { apikey: SR, Authorization: `Bearer ${SR}` },
});
const rows = r.ok ? await r.json() : [];
ok('The seat actually landed in the live database', rows.length === 1 && rows[0].source === 'deep-read-site', `rows=${rows.length} source=${rows[0]?.source}`);

// cleanup
await fetch(`${URL}/rest/v1/witnesses?email=eq.${encodeURIComponent(email)}`, {
  method: 'DELETE', headers: { apikey: SR, Authorization: `Bearer ${SR}` },
});

const failed = results.filter((p) => !p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
