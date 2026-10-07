import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', timezoneId: 'America/Montevideo' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('docs/trailer/captures', { recursive: true });

let releaseMain;
let releaseScene;
const mainGate = new Promise(resolve => { releaseMain = resolve; });
const sceneGate = new Promise(resolve => { releaseScene = resolve; });
await page.route('**/src/main.tsx*', async route => { await mainGate; await route.continue(); });
await page.route('**/src/features/intro/CinematicIntro.tsx*', async route => { await sceneGate; await route.continue(); });

try {
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'commit' });
  await page.locator('#intro-bootstrap .intro-orbital-map').waitFor();
  assert.equal(await page.locator('#intro-bootstrap .intro-topline, #intro-bootstrap .intro-edition, #intro-bootstrap .intro-bottomline').count(), 0);
  await page.waitForTimeout(400);
  const firstOrbit = await page.locator('#intro-bootstrap [data-intro="orbits"]').evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(500);
  const nextOrbit = await page.locator('#intro-bootstrap [data-intro="orbits"]').evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(firstOrbit, nextOrbit, 'The first HTML frame must already animate.');
  await page.waitForTimeout(1050);
  await page.screenshot({ path: 'docs/trailer/captures/intro-first-frame-before-react.png' });

  releaseMain();
  await page.locator('[data-cinematic-intro].intro-pending').waitFor();
  await page.locator('#intro-bootstrap').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.intro-loading').count(), 0);
  assert.equal(await page.evaluate(() => document.getElementById('root').inert), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-cinematic-intro')), true);
  await page.screenshot({ path: 'docs/trailer/captures/intro-first-frame-pending-chunk.png' });

  releaseScene();
  await page.locator('[data-cinematic-intro]:not(.intro-pending)').waitFor();
  assert.equal(await page.evaluate(() => document.getElementById('root').inert), true, 'Replacing the pending stage must keep the app inert.');
  assert.equal(await page.locator('.intro-topline, .intro-edition, .intro-bottomline').count(), 0);
  await page.locator('[data-cinematic-intro]').waitFor({ state: 'detached', timeout: 4200 });
  assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
  await page.getByRole('button', { name: 'Volver a vivir el inicio' }).click();
  await page.locator('[data-cinematic-intro]').waitFor();
  assert.equal(await page.locator('[data-cinematic-intro]').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(247, 245, 251)');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'docs/trailer/captures/intro-light-desktop.png' });
  await page.keyboard.press('Escape');
  await page.locator('[data-cinematic-intro]').waitFor({ state: 'detached' });
  assert.equal(await page.getByRole('button', { name: 'Volver a vivir el inicio' }).evaluate(el => el === document.activeElement), true);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const replayAt = Date.now();
  await page.getByRole('button', { name: 'Volver a vivir el inicio' }).click();
  await page.locator('[data-cinematic-intro]').waitFor({ state: 'detached' });
  assert.ok(Date.now() - replayAt < 700, 'Reduced motion completes promptly without a second lazy-clock delay.');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ preReactAnimated: true, pendingArtwork: true, lazyHandoffInert: true, cornerTextsRemoved: true, lightIntro: true, escapeFocusRestored: true, reducedMotion: true, pageErrors: errors }));
} finally {
  releaseMain();
  releaseScene();
  await browser.close();
}
