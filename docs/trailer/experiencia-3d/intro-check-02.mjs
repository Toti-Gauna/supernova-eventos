import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseURL = process.env.SUPERNOVA_QA_URL || 'http://127.0.0.1:5173/supernova-eventos/';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];
const results = {};
const captureRoot = 'docs/trailer/experiencia-3d/captures/prompt-02';
await mkdir(captureRoot, { recursive: true });

async function contextFor(reducedMotion = 'no-preference', viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, reducedMotion, timezoneId: 'America/Montevideo' });
  await context.addInitScript(() => localStorage.setItem('supernova-theme-v1', JSON.stringify('light')));
  await context.addInitScript(() => {
    const measurements = { bootstrapReleasedMs: null, introReleasedMs: [], lastIntroReleasedAtMs: null, reducedChangedAtMs: null };
    window.__supernovaIntroQA = measurements;
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
      if (event.matches) measurements.reducedChangedAtMs = performance.now();
    });
    const observer = new MutationObserver(records => {
      const bootstrap = document.getElementById('intro-bootstrap');
      if (bootstrap?.getAttribute('data-intro-dismissed') === 'true' && measurements.bootstrapReleasedMs === null) {
        measurements.bootstrapReleasedMs = performance.now() - Number(bootstrap.getAttribute('data-intro-started-at'));
      }
      for (const record of records) {
        for (const node of record.removedNodes) {
          if (!(node instanceof HTMLElement) || !node.hasAttribute('data-cinematic-intro')) continue;
          if (document.querySelector('[data-cinematic-intro]')) continue;
          measurements.introReleasedMs.push(performance.now() - Number(node.getAttribute('data-intro-started-at')));
          measurements.lastIntroReleasedAtMs = performance.now();
        }
      }
    });
    observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-intro-dismissed'] });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page };
}

async function delayedMain({ reduced = false, escape = false } = {}) {
  const { context, page } = await contextFor(reduced ? 'reduce' : 'no-preference');
  let releaseMain;
  const gate = new Promise(resolve => { releaseMain = resolve; });
  await page.route('**/src/main.tsx*', async route => { await gate; await route.continue(); });
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    const bootstrap = page.locator('#intro-bootstrap');
    await bootstrap.waitFor({ state: 'attached' });
    assert.equal(await page.locator('.intro-backdrop').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(2, 2, 5)');
    assert.equal(await bootstrap.locator('[data-intro="point"]').count(), 5);
    assert.equal(await page.locator('canvas').count(), 0);
    assert.equal(await page.evaluate(() => document.fonts.ready.then(() => (
      Array.from(document.fonts).some(face => face.family.replace(/['"]/g, '') === 'Manrope' && face.status === 'loaded')
      && document.fonts.check('400 62px Manrope')
    ))), true, 'Brand font must be available before React.');
    if (escape) await page.keyboard.press('Escape');
    else if (!reduced) {
      await page.waitForTimeout(850);
      await page.screenshot({ path: `${captureRoot}/solar-before-react.png` });
    }
    await bootstrap.waitFor({ state: 'hidden', timeout: 4500 });
    await page.waitForFunction(() => window.__supernovaIntroQA.bootstrapReleasedMs !== null);
    const elapsedMs = await page.evaluate(() => window.__supernovaIntroQA.bootstrapReleasedMs);
    assert.ok(Number.isFinite(elapsedMs));
    assert.ok(elapsedMs < (reduced ? 200 : escape ? 500 : 4000), `Bootstrap deadline: ${elapsedMs} ms`);
    await page.locator('#intro-bootstrap-note').waitFor({ state: 'visible' });
    assert.match(await page.locator('#intro-bootstrap-note').textContent(), /todavía se está cargando/);
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(2, 2, 5)', 'Space background must remain black after the art releases, before app CSS arrives.');
    releaseMain();
    await bootstrap.waitFor({ state: 'detached' });
    await page.locator('#intro-bootstrap-note').waitFor({ state: 'detached' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.waitForTimeout(450);
    assert.equal(await page.locator('[data-cinematic-intro]').count(), 0, 'Late React must not restart a dismissed opening.');
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
    return Math.round(elapsedMs);
  } finally {
    releaseMain();
    await context.close();
  }
}

try {
  results.beforeReactNormalMs = await delayedMain();
  results.beforeReactReducedMs = await delayedMain({ reduced: true });
  results.beforeReactEscapeMs = await delayedMain({ escape: true });
  results.manropeAvailableBeforeReact = true;

  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const { context, page } = await contextFor('no-preference', viewport);
    let releaseMain;
    const gate = new Promise(resolve => { releaseMain = resolve; });
    await page.route('**/src/main.tsx*', async route => { await gate; await route.continue(); });
    try {
      await page.goto(baseURL, { waitUntil: 'commit' });
      await page.locator('#intro-bootstrap').waitFor();
      await page.waitForTimeout(1000);
      const map = await page.locator('#intro-bootstrap .intro-orbital-map').boundingBox();
      assert.ok(map && map.x >= 0 && map.x + map.width <= viewport.width);
      await page.screenshot({ path: `${captureRoot}/solar-bootstrap-${viewport.width}.png` });
    } finally {
      releaseMain();
      await context.close();
    }
  }
  results.mobileArtwork320And390 = true;

  const normal = await contextFor();
  try {
    await normal.page.goto(baseURL, { waitUntil: 'commit' });
    const intro = normal.page.locator('[data-cinematic-intro]');
    await intro.waitFor();
    results.frameSamples = [];
    for (const targetMs of [1100, 1800, 2750]) {
      await normal.page.waitForFunction(target => {
        const node = document.querySelector('[data-cinematic-intro]');
        return node && performance.now() - Number(node.getAttribute('data-intro-started-at')) >= target;
      }, targetMs);
      results.frameSamples.push(await intro.evaluate((node, targetMs) => ({
        targetMs, elapsedMs: Math.round(performance.now() - Number(node.getAttribute('data-intro-started-at'))),
        universeStatus: node.getAttribute('data-intro-universe-status'),
        staticSkyOpacity: getComputedStyle(node.querySelector('.intro-static-sky')).opacity,
        identityOpacity: getComputedStyle(node.querySelector('[data-intro="identity"]')).opacity,
      }), targetMs));
      await normal.page.screenshot({ path: `${captureRoot}/solar-live-${targetMs}.png` });
    }
    await intro.waitFor({ state: 'detached', timeout: 4500 });
    const normalElapsedMs = await normal.page.evaluate(() => window.__supernovaIntroQA.introReleasedMs.at(-1));
    assert.ok(normalElapsedMs < 4000, `Normal opening release: ${normalElapsedMs} ms`);
    results.normalOpeningReleaseMs = Math.round(normalElapsedMs);
    assert.equal(await normal.page.locator('canvas').count(), 1);
    assert.equal(await normal.page.evaluate(() => document.getElementById('root').inert), false);
    await normal.page.screenshot({ path: `${captureRoot}/solar-arrival.png` });
  } finally {
    await normal.context.close();
  }

  const lateScene = await contextFor();
  let releaseLateScene;
  const lateSceneGate = new Promise(resolve => { releaseLateScene = resolve; });
  await lateScene.page.route('**/src/features/intro/CinematicIntro.tsx*', async route => { await lateSceneGate; await route.continue(); });
  try {
    await lateScene.page.goto(baseURL, { waitUntil: 'commit' });
    await lateScene.page.waitForFunction(() => {
      const intro = document.querySelector('[data-cinematic-intro]');
      const sky = intro?.querySelector('.intro-static-sky');
      return intro?.getAttribute('data-intro-universe-status') === 'ready'
        && performance.now() - Number(intro.getAttribute('data-intro-started-at')) >= 2400
        && sky && Number(getComputedStyle(sky).opacity) < .01;
    });
    releaseLateScene();
    await lateScene.page.waitForFunction(() => {
      const intro = document.querySelector('[data-cinematic-intro]');
      return intro && !intro.classList.contains('intro-pending');
    });
    const opacity = await lateScene.page.locator('[data-cinematic-intro] .intro-static-sky').evaluate(node => Number(getComputedStyle(node).opacity));
    assert.ok(opacity < .01, `A resolved lazy scene must not restore the already-hidden solar SVG: ${opacity}`);
    results.lateSceneDoesNotRestoreSVG = true;
    await lateScene.page.locator('[data-cinematic-intro]').waitFor({ state: 'detached', timeout: 2000 });
    assert.equal(await lateScene.page.locator('canvas').count(), 1);
  } finally {
    releaseLateScene();
    await lateScene.context.close();
  }

  const { context, page } = await contextFor();
  let releaseScene;
  const gate = new Promise(resolve => { releaseScene = resolve; });
  await page.route('**/src/features/intro/CinematicIntro.tsx*', async route => { await gate; await route.continue(); });
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    const intro = page.locator('[data-cinematic-intro]');
    await intro.waitFor();
    assert.match(await intro.getAttribute('class'), /intro-pending/);
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-cinematic-intro')), true);
    await page.screenshot({ path: `${captureRoot}/solar-pending-lazy.png` });
    await intro.waitFor({ state: 'detached', timeout: 4200 });
    const pendingElapsedMs = await page.evaluate(() => window.__supernovaIntroQA.introReleasedMs.at(-1));
    assert.ok(pendingElapsedMs <= 4000, `Pending intro release: ${pendingElapsedMs} ms`);
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
    releaseScene();
    await page.waitForTimeout(350);
    assert.equal(await intro.count(), 0, 'Resolving an expired lazy chunk must not reopen the intro.');
    const canvas = await page.locator('canvas').count();
    assert.ok(canvas <= 1, 'The intro must never add another Canvas.');
    results.pendingChunkReleaseMs = Math.round(pendingElapsedMs);

    await page.getByRole('button', { name: /^Mis eventos/ }).first().click();
    await page.getByRole('heading', { name: /Tu agenda tiene/ }).waitFor();
    const replay = page.getByRole('button', { name: /Volver a vivir el inicio/ });
    await replay.click();
    await intro.waitFor();
    await page.keyboard.press('Escape');
    await intro.waitFor({ state: 'detached' });
    assert.equal(await replay.evaluate(el => el === document.activeElement), true);
    await page.getByRole('heading', { name: /Tu agenda tiene/ }).waitFor();
    assert.equal(await page.locator('canvas').count(), canvas);
    results.replayKeepsSectionAndFocus = true;

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await replay.click();
    await intro.waitFor({ state: 'detached' });
    const reducedElapsedMs = await page.evaluate(() => window.__supernovaIntroQA.introReleasedMs.at(-1));
    assert.ok(reducedElapsedMs < 200, `Reduced replay: ${reducedElapsedMs} ms`);
    assert.equal(await replay.evaluate(el => el === document.activeElement), true);
    results.reducedReplayMs = Math.round(reducedElapsedMs);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await replay.click();
    await intro.waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await intro.waitFor({ state: 'detached' });
    const preferenceReleaseMs = await page.evaluate(() => window.__supernovaIntroQA.lastIntroReleasedAtMs - window.__supernovaIntroQA.reducedChangedAtMs);
    assert.ok(preferenceReleaseMs < 200, `Reduced preference change: ${preferenceReleaseMs} ms`);
    assert.equal(await replay.evaluate(el => el === document.activeElement), true);
    results.reducedPreferenceReleaseMs = Math.round(preferenceReleaseMs);
  } finally {
    releaseScene();
    await context.close();
  }
  assert.deepEqual(errors, []);
  const report = { ...results, pageErrors: errors, browserVersion: browser.version(), userAgent: await browser.newPage().then(page => page.evaluate(() => navigator.userAgent)) };
  await writeFile(`${captureRoot}/intro-report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} catch (error) {
  console.error(JSON.stringify({ introQAError: error.message, pageErrors: errors }));
  throw error;
} finally {
  await browser.close();
}
