// Verify the admin: seed a couple of seats, drive the deployed /admin.html with
// the token, confirm they render + count, check a wrong token is rejected, then
// clean up. Run with:  ADMIN_TOKEN=... node scripts/verify-admin.mjs
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
const TOKEN = process.env.ADMIN_TOKEN;
if (!TOKEN) { console.error('Set ADMIN_TOKEN in the environment.'); process.exit(2); }
const results = [];
const ok = (n, p, d = '') => { results.push(p); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };
const sr = (path, opt = {}) => fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' }, ...opt });

const tag = `admintest-${Date.now()}`;
const emails = [`${tag}-a@example.com`, `${tag}-b@example.com`];
await sr('witnesses', { method: 'POST', headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(emails.map((e) => ({ email: e, name: 'Admin Test', source: tag }))) });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();

// wrong token rejected
await page.goto(`${SITE}/admin.html`, { waitUntil: 'load' });
await page.fill('#token', 'definitely-wrong');
await page.click('#gate button[type=submit]');
await page.waitForTimeout(1500);
const errShown = await page.evaluate(() => document.getElementById('err').textContent.toLowerCase().includes('wrong'));
ok('Wrong token is rejected in the UI', errShown);

// correct token renders the list
await page.fill('#token', TOKEN);
await page.click('#gate button[type=submit]');
await page.waitForSelector('#panel:not(.hidden)', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(800);
const view = await page.evaluate(() => ({
  count: Number(document.getElementById('count').textContent),
  bodyText: document.getElementById('rows').textContent,
  panelVisible: !document.getElementById('panel').classList.contains('hidden'),
}));
ok('Admin panel opens with the correct token', view.panelVisible);
ok('Seeded seats appear in the admin table', emails.every((e) => view.bodyText.includes(e)), `count=${view.count}`);
await browser.close();

// cleanup
await sr(`witnesses?source=eq.${tag}`, { method: 'DELETE' });
const left = await (await sr(`witnesses?source=eq.${tag}&select=email`)).json();
ok('Test rows cleaned up', Array.isArray(left) && left.length === 0);

const failed = results.filter((p) => !p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
