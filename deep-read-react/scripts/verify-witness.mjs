// Verify the witness form client behavior (Prompt 7). The *.supabase.co host
// isn't reachable from here, so we intercept the PostgREST call and assert the
// request shape + the three outcomes (success, honeypot, error).
import { chromium } from '@playwright/test';
import { startServer } from './_server.mjs';

const { server, url: BASE } = await startServer('dist');
const results = [];
const ok = (n, p, d = '') => { results.push(p); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };

const browser = await chromium.launch();

async function run({ status, honeypot }) {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const reqs = [];
  await page.route('**/rest/v1/witnesses*', async (route) => {
    reqs.push({ method: route.request().method(), headers: route.request().headers(), body: route.request().postData() });
    await route.fulfill({ status, contentType: 'application/json', body: status >= 400 ? '{"message":"boom"}' : '' });
  });
  await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
  await page.waitForTimeout(250);
  await page.evaluate(() => document.getElementById('seat')?.scrollIntoView());
  await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 5000 });
  await page.fill('input[name="email"]', 'witness@example.com');
  await page.fill('input[name="name"]', 'Ada');
  if (honeypot) await page.$eval('input[name="company"]', (el) => { el.value = 'spam-co'; });
  await page.click('button:has-text("Save my seat")');
  const done = await page.waitForSelector('.seat-done', { timeout: 3500 }).then(() => true).catch(() => false);
  const errored = await page.$('.seat-error').then((e) => !!e);
  await page.close();
  return { reqs, done, errored };
}

// 1) happy path — 201, request well-formed
{
  const { reqs, done } = await run({ status: 201, honeypot: false });
  ok('Submit posts exactly one INSERT to /rest/v1/witnesses', reqs.length === 1 && reqs[0].method === 'POST', `count=${reqs.length}`);
  const r = reqs[0] || { headers: {}, body: '{}' };
  const body = JSON.parse(r.body || '{}');
  ok('Request carries the anon apikey + bearer', !!r.headers['apikey'] && /Bearer /.test(r.headers['authorization'] || ''));
  ok('Request body has email + source + user_agent (no select/read-back)',
    body.email === 'witness@example.com' && body.source === 'deep-read-site' && !!body.user_agent && (r.headers['prefer'] || '').includes('return=minimal'));
  ok('On success the seat shows the confirmation state', done);
}

// 2) honeypot — filled => fake success, NO network call
{
  const { reqs, done } = await run({ status: 201, honeypot: true });
  ok('Honeypot submission makes ZERO backend calls', reqs.length === 0, `count=${reqs.length}`);
  ok('Honeypot submission still shows success (bot none the wiser)', done);
}

// 3) error — 500 => error message, not sealed
{
  const { done, errored } = await run({ status: 500, honeypot: false });
  ok('A backend error surfaces a retry message', errored && !done);
}

await browser.close();
server.close();
const failed = results.filter((p) => !p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
