// Verify the admin entry point on the live site: footer link -> sign-in gate.
import { chromium } from '@playwright/test';
const SITE = process.env.LIVE_URL || 'https://mirrorplatform.online';
const results = [];
const ok = (n, p, d = '') => { results.push(p); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: 'reduce', ignoreHTTPSErrors: true });
const page = await ctx.newPage();

await page.goto(`${SITE}/`, { waitUntil: 'load' });
await page.evaluate(() => document.querySelector('footer.fin')?.scrollIntoView());
const link = await page.evaluate(() => {
  const a = document.querySelector('footer.fin a.admin-link');
  return a && { text: a.textContent.trim(), href: a.getAttribute('href'), visible: a.offsetParent !== null };
});
ok('Footer has a visible ADMIN link', !!link && link.visible, link ? `"${link.text}" -> ${link.href}` : 'missing');

// follow it
await page.click('footer.fin a.admin-link');
await page.waitForLoadState('load');
const gate = await page.evaluate(() => {
  const f = document.querySelector('#gate');
  const btn = document.querySelector('#gate button');
  const inp = document.querySelector('#gate input#token');
  return { onAdmin: /\/admin(\.html)?$/.test(location.pathname), hasForm: !!f, btn: btn && btn.textContent.trim(), inputType: inp && inp.type };
});
ok('Link lands on the admin sign-in page', gate.onAdmin && gate.hasForm, `path ok=${gate.onAdmin}`);
ok('Sign-in gate has a password field + "Sign in" button', gate.inputType === 'password' && gate.btn === 'Sign in', `btn="${gate.btn}"`);

// /admin clean path
await page.goto(`${SITE}/admin`, { waitUntil: 'load' });
const cleanPath = await page.evaluate(() => !!document.querySelector('#gate button'));
ok('Clean /admin path serves the gate too', cleanPath);

await browser.close();
const failed = results.filter((p) => !p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
