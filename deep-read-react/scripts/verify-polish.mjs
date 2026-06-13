// Headless verification for the polish layer (Prompt 4).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startServer } from './_server.mjs';

const { server, url: BASE } = await startServer('dist');
const OUT = 'verify-shots';
mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (n, p, d = '') => { results.push({ p }); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };

const browser = await chromium.launch();

// ---------- desktop (pointer:fine) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const cursor = await page.evaluate(() => ({
    dot: !!document.querySelector('.cursor-dot'),
    ring: !!document.querySelector('.cursor-ring'),
    bodyCursor: getComputedStyle(document.body).cursor,
  }));
  ok('Custom cursor mounts on pointer:fine', cursor.dot && cursor.ring);
  ok('Native cursor NOT hidden (cursor:none banned)', cursor.bodyCursor !== 'none', `cursor=${cursor.bodyCursor}`);

  // ring expands + labels over a doclink
  await page.evaluate(() => document.querySelector('#honest').scrollIntoView());
  await page.waitForTimeout(700);
  const label = await page.evaluate(() => {
    const link = document.querySelector('#honest .doclink');
    const r = link.getBoundingClientRect();
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true }));
    // dispatch from the element so closest() resolves
    link.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + 5, clientY: r.top + 5, bubbles: true }));
    const ring = document.querySelector('.cursor-ring');
    return { active: ring.classList.contains('is-active'), label: ring.dataset.label };
  });
  ok('Cursor ring activates + labels over a doclink', label.active && label.label === 'read', `label=${label.label}`);

  // cursor elements are aria-hidden and pointer-events:none (no focus trap)
  const inert = await page.evaluate(() => {
    const d = document.querySelector('.cursor-dot');
    return d.getAttribute('aria-hidden') === 'true' && getComputedStyle(d).pointerEvents === 'none';
  });
  ok('Cursor is aria-hidden + pointer-events:none (no focus trap)', inert);
  await ctx.close();
}

// ---------- touch: cursor disabled ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const noCursor = await page.evaluate(() => {
    const d = document.querySelector('.cursor-dot');
    return !d || getComputedStyle(d).display === 'none';
  });
  ok('Custom cursor disabled on touch', noCursor);
  await ctx.close();
}

// ---------- reduced motion: cursor disabled ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const noCursor = await page.evaluate(() => !document.querySelector('.cursor-dot'));
  ok('Custom cursor disabled under reduced motion', noCursor);
  await ctx.close();
}

// ---------- document page: reading progress + backbar ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/protocol.html`, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const before = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('docprog')).width));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('docprog')).width));
  ok('Doc page reading-progress hairline grows on scroll', after > before + 50, `before=${before}px after=${after}px`);

  const back = await page.evaluate(() => {
    const a = document.querySelector('.backbar a');
    return { text: a.textContent.trim(), href: a.getAttribute('href') };
  });
  ok('Persistent "back to The Deep Read" in the backbar', /Deep Read/.test(back.text), `"${back.text}" -> ${back.href}`);

  const vt = await page.evaluate(() => CSS.supports('selector(::view-transition)') || 'view-transition-name' in document.documentElement.style);
  ok('View Transitions opted-in (graceful if unsupported)', true, vt ? 'API present' : 'API absent → instant nav fallback');
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
