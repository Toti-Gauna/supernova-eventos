import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseURL = process.env.SUPERNOVA_QA_URL || 'http://127.0.0.1:5173/supernova-eventos/';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];
const hotUpdates = [];
const results = { recordedAt: new Date().toISOString(), captureMode: 'Animaciones y reloj reales; sin animations:disabled ni freeze.', hotUpdates };
const captureRoot = 'docs/trailer/experiencia-3d/captures/prompt-03';
await mkdir(captureRoot, { recursive: true });

async function contextFor(reducedMotion = 'no-preference', viewport = { width: 1440, height: 900 }, pageErrors = errors) {
  const context = await browser.newContext({ viewport, reducedMotion, timezoneId: 'America/Montevideo', locale: 'es-AR' });
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
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (/\[vite\].*(?:hot updated|page reload)/.test(message.text())) hotUpdates.push(message.text());
  });
  return { context, page };
}

async function settled(page, destination) {
  await page.waitForFunction(expected => {
    const host = document.querySelector('[data-universe-host]');
    return host?.dataset.universeDestination === expected
      && host.dataset.universeRequest === host.dataset.universeSettled
      && host.dataset.universeTravelling === 'false';
  }, destination);
}

async function worldSnapshot(page) {
  return page.evaluate(() => {
    const host = document.querySelector('[data-universe-host]');
    const canvas = host?.querySelector('canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      atMs: performance.now(), width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
      destination: host?.dataset.universeDestination, reason: host?.dataset.universeReason,
      request: Number(host?.dataset.universeRequest), travelling: host?.dataset.universeTravelling === 'true',
      camera: canvas?.dataset.universeCamera?.split(',').map(Number) ?? null,
      canvasCount: document.querySelectorAll('canvas').length,
      visibleBodies: canvas?.dataset.universeVisible, trail: Number(canvas?.dataset.universeTrailCount),
      quality: canvas?.dataset.universeQuality, calls: Number(canvas?.dataset.universeCalls),
      triangles: Number(canvas?.dataset.universeTriangles),
      renderer: gl ? gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER) : null,
      contextLost: gl?.isContextLost() ?? null,
    };
  });
}

async function captureJourney(page, trigger, destination, name, width, originalCanvas) {
  const before = await worldSnapshot(page);
  await trigger();
  try {
    await page.waitForFunction(previous => {
      const host = document.querySelector('[data-universe-host]');
      return Number(host?.dataset.universeRequest) > previous && host.dataset.universeTravelling === 'true';
    }, before.request);
  } catch (error) {
    const state = await worldSnapshot(page);
    throw new Error(`No se observó el viaje ${name}: ${JSON.stringify(state)}`, { cause: error });
  }
  const startedAt = await page.evaluate(() => performance.now());
  await page.waitForFunction(startedAt => performance.now() - startedAt >= 210, startedAt);
  const intermediate = await worldSnapshot(page);
  assert.equal(intermediate.destination, destination);
  assert.equal(intermediate.travelling, true, `La captura ${name} debe corresponder a un viaje real en curso.`);
  assert.ok(intermediate.camera?.some((coordinate, index) => Math.abs(coordinate - before.camera[index]) > .02), 'La cámara debe desplazarse durante el viaje.');
  const file = `${name}-mid-${width}.png`;
  await page.screenshot({ path: `${captureRoot}/${file}` });
  const afterCapture = await worldSnapshot(page);
  assert.equal(afterCapture.travelling, true, `La cámara debe seguir viajando al terminar de capturar ${name}.`);
  await settled(page, destination);
  const arrival = await worldSnapshot(page);
  assert.equal(arrival.canvasCount, 1);
  assert.equal(await page.locator('canvas').evaluate((node, original) => node === original, originalCanvas), true);
  return { file, before, intermediate, afterCapture, arrival, sampleFromObservedTravelMs: intermediate.atMs - startedAt };
}

async function liveJourneys(viewport) {
  const { context, page } = await contextFor('no-preference', viewport);
  try {
    await page.goto(baseURL);
    await page.locator('[data-cinematic-intro]').waitFor({ state: 'detached' });
    await settled(page, 'section:explore');
    const originalCanvas = await page.locator('canvas').elementHandle();
    const travel = [];
    travel.push(await captureJourney(page, () => page.getByRole('button', { name: /^Mis eventos/ }).first().click(), 'section:registrations', 'viaje-mis-eventos', viewport.width, originalCanvas));
    travel.push(await captureJourney(page, () => page.getByRole('button', { name: /^Favoritos/ }).first().click(), 'section:favorites', 'viaje-favoritos', viewport.width, originalCanvas));
    await page.getByRole('button', { name: 'Explorar', exact: true }).click();
    await settled(page, 'section:explore');
    travel.push(await captureJourney(page, () => page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click(), 'event:supernova-sessions', 'viaje-evento', viewport.width, originalCanvas));
    await page.keyboard.press('Escape');
    await settled(page, 'section:explore');
    await page.getByRole('button', { name: 'Administrar', exact: true }).click();
    await settled(page, 'section:admin');
    travel.push(await captureJourney(page, () => page.getByRole('button', { name: 'Crear experiencia', exact: true }).click(), 'studio', 'abordaje-nave', viewport.width, originalCanvas));
    return { viewport, journeys: travel };
  } finally {
    await context.close();
  }
}

async function throttledReplay() {
  const { context, page } = await contextFor();
  const session = await context.newCDPSession(page);
  try {
    await page.goto(baseURL);
    await page.locator('[data-cinematic-intro]').waitFor({ state: 'detached' });
    await settled(page, 'section:explore');
    await page.getByRole('button', { name: /^Mis eventos/ }).first().click();
    await settled(page, 'section:registrations');
    const replay = page.getByRole('button', { name: /Volver a vivir el inicio/ });
    await replay.scrollIntoViewIfNeeded();
    const beforeScroll = await page.evaluate(() => scrollY);
    const originalCanvas = await page.locator('canvas').elementHandle();
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await replay.click();
    await page.locator('[data-cinematic-intro]').waitFor();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-cinematic-intro')), true);
    await page.locator('[data-cinematic-intro]').waitFor({ state: 'detached' });
    const elapsed = await page.evaluate(() => window.__supernovaIntroQA.introReleasedMs.at(-1));
    assert.ok(elapsed < 4000, `El deadline tampoco debe extenderse con CPU 4×: ${elapsed}`);
    assert.equal(await replay.evaluate(node => node === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
    assert.equal(await page.evaluate(() => scrollY), beforeScroll);
    assert.equal(await page.locator('canvas').evaluate((node, original) => node === original, originalCanvas), true);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await replay.click();
    await page.locator('[data-cinematic-intro]').waitFor({ state: 'detached' });
    const reducedElapsed = await page.evaluate(() => window.__supernovaIntroQA.introReleasedMs.at(-1));
    assert.ok(reducedElapsed < 200, `Reduced con CPU 4×: ${reducedElapsed}`);
    assert.equal(await replay.evaluate(node => node === document.activeElement), true);
    return { cpuSlowdownRate: 4, replayReleaseMs: Math.round(elapsed), reducedReplayReleaseMs: Math.round(reducedElapsed), scrollPreserved: true, sameCanvas: true, focusRestored: true, note: 'CPU emulada sobre replay con recursos ya cargados. No representa GPU ni teléfono físico.' };
  } finally {
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
    await session.detach();
    await context.close();
  }
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

async function failedIntroChunk() {
  const expectedErrors = [];
  const { context, page } = await contextFor('no-preference', { width: 1440, height: 900 }, expectedErrors);
  let chunkRequests = 0;
  await page.route('**/src/features/intro/CinematicIntro.tsx*', async route => {
    chunkRequests += 1;
    await route.abort('failed');
  });
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    await page.waitForFunction(() => {
      const shell = document.querySelector('.app-shell');
      return shell && !shell.classList.contains('intro-playing') && !document.querySelector('[data-cinematic-intro]');
    });
    assert.equal(chunkRequests, 1, 'La prueba debe rechazar el import real de la intro.');
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
    assert.equal(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(2, 2, 5)');
    await settled(page, 'section:explore');
    const initialReleaseMs = await page.evaluate(() => window.__supernovaIntroQA.introReleasedMs.at(-1));
    assert.ok(initialReleaseMs < 4000, `Un import rechazado no debe prolongar la intro: ${initialReleaseMs}`);
    const originalCanvas = await page.locator('canvas').elementHandle();
    await page.screenshot({ path: `${captureRoot}/intro-import-fallback.png` });
    await page.getByRole('button', { name: /^Mis eventos/ }).first().click();
    await settled(page, 'section:registrations');
    const replay = page.getByRole('button', { name: /Volver a vivir el inicio/ });
    await replay.click();
    await page.waitForFunction(() => !document.querySelector('.app-shell.intro-playing'));
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
    assert.equal(await replay.evaluate(node => node === document.activeElement), true);
    await page.getByRole('heading', { name: /Tu agenda tiene/ }).waitFor();
    assert.equal(await page.locator('canvas').evaluate((node, original) => node === original, originalCanvas), true);
    assert.ok(expectedErrors.every(message => /Failed to fetch dynamically imported module/.test(message)), `Sólo se admiten errores del import deliberadamente rechazado: ${JSON.stringify(expectedErrors)}`);
    return { rejectedChunkRequests: chunkRequests, initialReleaseMs: Math.round(initialReleaseMs), replayFocusRestored: true, navigationUsable: true, sameCanvas: true, expectedPageErrors: expectedErrors };
  } finally {
    await context.close();
  }
}

async function escapeBeforeRendererReady() {
  const { context, page } = await contextFor();
  let releaseRenderer;
  const gate = new Promise(resolve => { releaseRenderer = resolve; });
  await page.route('**/src/features/universe/UniverseExperience.tsx*', async route => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    const intro = page.locator('[data-cinematic-intro]');
    await intro.waitFor();
    assert.equal(await intro.getAttribute('data-intro-universe-status'), 'loading');
    assert.equal(await page.locator('canvas').count(), 0);
    const escapedAtMs = await page.evaluate(() => performance.now());
    await page.keyboard.press('Escape');
    await intro.waitFor({ state: 'detached' });
    const releasedAtMs = await page.evaluate(() => window.__supernovaIntroQA.lastIntroReleasedAtMs);
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
    await page.getByRole('button', { name: /^Mis eventos/ }).first().click();
    await page.getByRole('heading', { name: /Tu agenda tiene/ }).waitFor();
    assert.equal(await page.locator('[data-universe-host]').getAttribute('data-universe-destination'), 'section:registrations');
    releaseRenderer();
    await settled(page, 'section:registrations');
    assert.equal(await intro.count(), 0);
    assert.equal(await page.locator('canvas').count(), 1);
    return { releaseAfterEscapeMs: Math.round(releasedAtMs - escapedAtMs), rendererReadyAtEscape: false, navigationUsableBeforeRenderer: true, lateRendererUsesCurrentDestination: true };
  } finally {
    releaseRenderer();
    await context.close();
  }
}

async function captureOpening(viewport) {
  const { context, page } = await contextFor('no-preference', viewport);
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    const intro = page.locator('[data-cinematic-intro]');
    await intro.waitFor();
    const samples = [];
    for (const targetMs of [1100, 1800, 2750]) {
      await page.waitForFunction(target => {
        const node = document.querySelector('[data-cinematic-intro]');
        return node && performance.now() - Number(node.getAttribute('data-intro-started-at')) >= target;
      }, targetMs);
      const sample = await intro.evaluate((node, targetMs) => ({
        targetMs, elapsedMs: Math.round(performance.now() - Number(node.getAttribute('data-intro-started-at'))),
        universeStatus: node.getAttribute('data-intro-universe-status'),
        staticSkyOpacity: getComputedStyle(node.querySelector('.intro-static-sky')).opacity,
        identityOpacity: getComputedStyle(node.querySelector('[data-intro="identity"]')).opacity,
      }), targetMs);
      const file = `solar-live-${targetMs}-${viewport.width}.png`;
      await page.screenshot({ path: `${captureRoot}/${file}` });
      samples.push({ ...sample, file });
    }
    await intro.waitFor({ state: 'detached', timeout: 4500 });
    const releaseMs = await page.evaluate(() => window.__supernovaIntroQA.introReleasedMs.at(-1));
    assert.ok(releaseMs < 4000, `Apertura ${viewport.width}px: ${releaseMs} ms`);
    await settled(page, 'section:explore');
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal(await page.evaluate(() => document.getElementById('root').inert), false);
    await page.screenshot({ path: `${captureRoot}/solar-arrival-${viewport.width}.png` });
    return { viewport, releaseMs: Math.round(releaseMs), samples };
  } finally {
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

  results.openings = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    results.openings.push(await captureOpening(viewport));
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
  results.liveJourneys = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    results.liveJourneys.push(await liveJourneys(viewport));
  }
  results.cpu4x = await throttledReplay();
  results.escapeBeforeReady = await escapeBeforeRendererReady();
  results.failedIntroChunk = await failedIntroChunk();
  assert.deepEqual(hotUpdates, [], 'La revisión final requiere fuente estable, sin actualizaciones HMR durante las capturas.');
  assert.deepEqual(errors, []);
  const report = { ...results, pageErrors: errors, browserVersion: browser.version(), userAgent: await browser.newPage().then(page => page.evaluate(() => navigator.userAgent)) };
  await writeFile(`${captureRoot}/intro-report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} catch (error) {
  const failure = { ...results, verificationsCompleted: false, introQAError: error.message, pageErrors: errors };
  await writeFile(`${captureRoot}/intro-report-incomplete.json`, `${JSON.stringify(failure, null, 2)}\n`);
  console.error(JSON.stringify({ introQAError: error.message, pageErrors: errors }));
  throw error;
} finally {
  await browser.close();
}
