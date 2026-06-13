// Headless verification for the three set pieces (Prompt 3).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startServer } from './_server.mjs';

const { server, url: BASE } = await startServer('dist');
const OUT = 'verify-shots';
mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (n, p, d = '') => { results.push({ p }); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };

// read scaleX from a computed transform matrix ('none' => 1)
const scaleXOf = (t) => {
  if (!t || t === 'none') return 1;
  const m = t.match(/matrix\(([^)]+)\)/);
  return m ? parseFloat(m[1].split(',')[0]) : 1;
};

const browser = await chromium.launch({ args: ['--use-gl=swiftshader'] });

// ---------- Normal motion ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // ledger bars hidden before the scene is reached
  const barBefore = await page.evaluate(() => getComputedStyle(document.querySelector('#sealed .case .bar')).transform);
  ok('Ledger bars start collapsed (scaleX ~0) before scroll', scaleXOf(barBefore) < 0.1, `scaleX=${scaleXOf(barBefore).toFixed(2)}`);

  // scroll to sealed → bars assemble, stamps visible
  await page.evaluate(() => document.querySelector('#sealed').scrollIntoView());
  await page.waitForTimeout(1500);
  const barAfter = await page.evaluate(() => getComputedStyle(document.querySelector('#sealed .case .bar')).transform);
  const stampVisible = await page.evaluate(() => Number(getComputedStyle(document.querySelector('#sealed .case .stamp')).opacity) > 0.9);
  ok('Ledger bars draw to full width on scroll', scaleXOf(barAfter) > 0.9, `scaleX=${scaleXOf(barAfter).toFixed(2)}`);
  ok('SEALED stamps pressed in (visible)', stampVisible);
  await page.screenshot({ path: `${OUT}/setpiece-ledger.png` });

  // touch tap-equivalent on a row reveals the line
  await page.evaluate(() => {
    const row = document.querySelector('#sealed .case');
    row.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
  });
  const touched = await page.evaluate(() => document.querySelector('#sealed .case').classList.contains('is-touched'));
  ok('Row reveals its line on touch (tap-equivalent of hover)', touched);

  // sides: edges meet (after scroll they sit at x≈0, visible)
  await page.evaluate(() => document.querySelector('#sides').scrollIntoView());
  await page.waitForTimeout(1200);
  const sides = await page.evaluate(() => {
    const g = document.querySelector('#sides [data-edge="left"]');
    const s = document.querySelector('#sides [data-edge="right"]');
    return { gv: Number(getComputedStyle(g).opacity), sv: Number(getComputedStyle(s).opacity) };
  });
  ok('Sides: gold + steel lines arrived (visible)', sides.gv > 0.9 && sides.sv > 0.9);
  await page.screenshot({ path: `${OUT}/setpiece-sides.png` });

  // seat: border draws itself
  await page.evaluate(() => document.querySelector('#seat').scrollIntoView());
  await page.waitForTimeout(1600);
  const dash = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#seat .seat-border rect')).strokeDashoffset));
  ok('Seat border drew itself (dashoffset → ~0)', dash < 5, `dashoffset=${dash}`);

  // seal micro-animation on a VALID submit (button → red SEALED stamp), then resets.
  // (An empty required email is correctly blocked by the browser, so fill it first.)
  await page.fill('#seat input[type=email]', 'witness@example.com');
  await page.evaluate(() => document.querySelector('#seat form').requestSubmit());
  await page.waitForTimeout(150);
  const sealing = await page.evaluate(() => {
    const b = document.querySelector('#seat .magnetic');
    return { cls: b.classList.contains('sealing'), label: b.querySelector('.magnetic-label').textContent };
  });
  ok('Submit plays the seal stamp (red SEALED)', sealing.cls && sealing.label === 'SEALED', `label=${sealing.label}`);
  await page.screenshot({ path: `${OUT}/setpiece-seal.png` });
  await page.waitForTimeout(1500);
  const reset = await page.evaluate(() => document.querySelector('#seat .magnetic .magnetic-label').textContent);
  ok('Seal resets afterward', reset === 'Save my seat', `label=${reset}`);

  // real form: autocomplete attrs + Enter submits
  const attrs = await page.evaluate(() => {
    const email = document.querySelector('#seat input[type=email]');
    const name = document.querySelector('#seat input[type=text]');
    return { email: email.getAttribute('autocomplete'), name: name.getAttribute('autocomplete'), required: email.required };
  });
  ok('Form fields have autocomplete + required email', attrs.email === 'email' && attrs.name === 'given-name' && attrs.required);

  await page.fill('#seat input[type=email]', 'witness@example.com');
  await page.focus('#seat input[type=email]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const enterSealed = await page.evaluate(() => document.querySelector('#seat .magnetic').classList.contains('sealing'));
  ok('Enter key submits the form', enterSealed);
  await ctx.close();
}

// ---------- Reduced motion: instant final states ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?webgl=off`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => {
    const bar = getComputedStyle(document.querySelector('#sealed .case .bar')).transform;
    const dash = parseFloat(getComputedStyle(document.querySelector('#seat .seat-border rect')).strokeDashoffset);
    const edge = Number(getComputedStyle(document.querySelector('#sides [data-edge="left"]')).opacity);
    return { bar, dash, edge };
  });
  ok('Reduced: ledger bars at full width (no collapse)', scaleXOf(state.bar) > 0.95);
  ok('Reduced: seat border fully drawn', state.dash < 1, `dashoffset=${state.dash}`);
  ok('Reduced: sides lines visible in place', state.edge > 0.95);
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
