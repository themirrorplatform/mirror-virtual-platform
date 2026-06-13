// Headless verification for the motion layer + responsive sanity.
// Usage: node scripts/verify.mjs [baseURL]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = 'verify-shots';
mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  ✓' : '  ✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch();

// ---------- 1. Normal motion (desktop) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];   // genuine JS exceptions only
  const blocked = [];  // external resources blocked by the offline sandbox (informational)
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    (/Failed to load resource|ERR_CERT|fonts\.g/.test(m.text()) ? blocked : errors).push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1600); // let load timeline + ScrollTrigger.refresh settle

  const hasLenis = await page.evaluate(() => document.documentElement.classList.contains('lenis'));
  ok('Lenis active under normal motion (html.lenis)', hasLenis);

  // hero billing lines revealed (transform back to identity, visible)
  const billing = await page.evaluate(() => {
    const line = document.querySelector('#open [data-split] [data-line]');
    if (!line) return null;
    const cs = getComputedStyle(line);
    const rect = line.getBoundingClientRect();
    return { opacity: cs.opacity, transform: cs.transform, visible: rect.height > 0 };
  });
  ok('Hero billing line revealed (visible, opacity 1)',
     billing && billing.visible && Number(billing.opacity) > 0.9,
     billing ? `opacity=${billing.opacity}` : 'not found');

  // hero h1 (a data-rise item) ended visible
  const h1 = await page.evaluate(() => {
    const el = document.querySelector('#open h1[data-rise]');
    return el ? Number(getComputedStyle(el).opacity) : null;
  });
  ok('Hero headline finished its entrance (opacity ~1)', h1 !== null && h1 > 0.9, `opacity=${h1}`);

  await page.screenshot({ path: `${OUT}/desktop-hero.png` });

  // scroll to the sealed scene and shoot it
  await page.evaluate(() => document.querySelector('#sealed')?.scrollIntoView());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/desktop-sealed.png` });

  // dot nav reflects active section
  const activeAria = await page.evaluate(() => document.querySelector('.dots a.on')?.getAttribute('aria-label'));
  ok('Dot nav highlights a section while scrolled', !!activeAria, `active=${activeAria}`);

  ok('No console / page errors (normal motion)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------- 2. Reduced motion ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  const blocked = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    (/Failed to load resource|ERR_CERT|fonts\.g/.test(m.text()) ? blocked : errors).push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const hasLenis = await page.evaluate(() => document.documentElement.classList.contains('lenis'));
  ok('Lenis DISABLED under reduced motion', !hasLenis);

  // all content visible: every billing line + a deep scene heading at full opacity, identity transform
  const allVisible = await page.evaluate(() => {
    const els = [
      ...document.querySelectorAll('[data-line]'),
      ...document.querySelectorAll('[data-rise]'),
    ];
    return els.every((el) => {
      const cs = getComputedStyle(el);
      const t = cs.transform;
      return Number(cs.opacity) > 0.95 && (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)');
    });
  });
  ok('All [data-rise]/[data-line] content fully visible & untransformed', allVisible);

  await page.screenshot({ path: `${OUT}/reduced-hero.png` });
  ok('No console / page errors (reduced motion)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------- 3. Responsive screenshots ----------
for (const [w, h] of [[360, 780], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  // horizontal overflow check
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`No horizontal overflow @ ${w}px`, overflow <= 1, `overflowX=${overflow}px`);
  await page.screenshot({ path: `${OUT}/w${w}-hero.png` });
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
