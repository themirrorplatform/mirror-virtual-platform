// Headless verification for the WebGL hero (Prompt 2).
// Uses ?webgl=force / ?webgl=off so the result is deterministic regardless of
// headless rAF throttling. Run after `npm run preview`.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startServer } from './_server.mjs';

const { server, url: BASE } = await startServer('dist');
const OUT = 'verify-shots';
mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (n, p, d = '') => { results.push({ p }); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };

const isCtxErr = (t) => /web ?gl|three|shader|context lost/i.test(t);
const isBlocked = (t) => /Failed to load resource|ERR_CERT|fonts\.g/.test(t);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });

// ---------- A. WebGL forced on ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const ctxErrors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !isBlocked(m.text())) ctxErrors.push(m.text()); });
  page.on('pageerror', (e) => ctxErrors.push(String(e)));

  await page.goto(`${BASE}/?webgl=force`, { waitUntil: 'load' });
  await page.waitForTimeout(3000); // probe + dynamic import + texture load + fade

  const hasCanvas = await page.evaluate(() => !!document.querySelector('.crest-canvas canvas'));
  ok('WebGL canvas mounts in the hero', hasCanvas);

  const faded = await page.evaluate(() => {
    const img = document.querySelector('.crest img');
    return img && img.classList.contains('crest-faded');
  });
  ok('Static crest <img> fades out once WebGL is ready', faded);

  const glWorks = await page.evaluate(() => {
    const c = document.querySelector('.crest-canvas canvas');
    if (!c) return false;
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return !!gl && !gl.isContextLost();
  });
  ok('Live WebGL context (not lost)', glWorks);

  await page.screenshot({ path: `${OUT}/webgl-hero.png` });

  // scroll a little to drive the dissolve, shoot mid-transition
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.55));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/webgl-dissolve.png` });

  ok('No WebGL/three context errors in console', ctxErrors.filter(isCtxErr).length === 0,
     ctxErrors.filter(isCtxErr).slice(0, 2).join(' | '));
  ok('No JS errors at all (forced WebGL)', ctxErrors.length === 0, ctxErrors.slice(0, 2).join(' | '));
  await ctx.close();
}

// ---------- B. WebGL explicitly off (fallback path) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const noCanvas = await page.evaluate(() => !document.querySelector('.crest-canvas'));
  const imgVisible = await page.evaluate(() => {
    const img = document.querySelector('.crest img');
    return img && !img.classList.contains('crest-faded') && img.getBoundingClientRect().height > 0;
  });
  ok('No canvas when WebGL is off (graceful fallback)', noCanvas);
  ok('Static crest <img> remains visible in fallback', imgVisible);
  await page.screenshot({ path: `${OUT}/webgl-off.png` });
  await ctx.close();
}

// ---------- C. WebGL stubbed unavailable (capability detect) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (String(type).includes('webgl')) return null; // pretend no WebGL
      return orig.call(this, type, ...rest);
    };
  });
  await page.goto(`${BASE}/?webgl=force`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const noCanvas = await page.evaluate(() => !document.querySelector('.crest-canvas'));
  ok('Capability detect: no WebGL support -> static crest, even when forced', noCanvas);
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
