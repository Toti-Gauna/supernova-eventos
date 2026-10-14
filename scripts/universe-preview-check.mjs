import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const baseURL = process.env.UNIVERSE_PREVIEW_URL || 'http://127.0.0.1:4173/supernova-eventos/';
const outputDirectory = resolve(process.env.UNIVERSE_PREVIEW_OUTPUT || 'docs/experiencia-3d/captures/prompt-2');
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const report = { baseURL, browser: browser.version(), checks: [], pageErrors: [], httpErrors: [], failedRequests: [] };

async function arrived(page, destination) {
  await page.waitForFunction(expected => {
    const host = document.querySelector('[data-universe-host]');
    return host?.dataset.universeStatus === 'ready' && host.dataset.universeDestination === expected
      && host.dataset.universeRequest === host.dataset.universeSettled && host.dataset.universeOutcome === 'arrived';
  }, destination);
}

try {
  for (const theme of ['dark', 'light']) {
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', locale: 'es-AR' });
      await context.addInitScript(value => localStorage.setItem('supernova-theme-v1', JSON.stringify(value)), theme);
      const page = await context.newPage();
      page.on('pageerror', error => report.pageErrors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) report.httpErrors.push({ url: response.url(), status: response.status() }); });
      page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      await page.goto(baseURL);
      await page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' }).waitFor({ state: 'detached' });
      await arrived(page, 'section:explore');
      const firstFrameFont = await page.evaluate(async () => {
        await document.fonts.ready;
        return {
          loaded: Array.from(document.fonts).some(face => face.family.replaceAll('"', '') === 'Manrope' && face.weight === '400' && face.status === 'loaded'),
          preload: document.querySelector('link[rel="preload"][as="font"]')?.href ?? '',
        };
      });
      assert(firstFrameFont.loaded, 'Manrope400 local debe estar cargada.');
      assert(new URL(firstFrameFont.preload).pathname.startsWith(new URL(baseURL).pathname), 'La fuente crítica debe respetar el prefijo de producción.');
      const originalCanvas = await page.locator('[data-universe-host] canvas').elementHandle();
      assert(originalCanvas, 'El renderer de producción debe estar montado.');
      for (const { label, destination, heading } of [
        { label: /^Mis eventos/, destination: 'section:registrations', heading: /Tu agenda tiene/ },
        { label: /^Favoritos/, destination: 'section:favorites', heading: /Esos planes que/ },
        { label: /^Explorar$/, destination: 'section:explore', heading: /Salí de la rutina/ },
      ]) {
        await page.getByRole('button', { name: label }).click();
        await page.getByRole('heading', { name: heading }).waitFor();
        await arrived(page, destination);
        const sameCanvas = await page.locator('[data-universe-host] canvas').evaluate((canvas, original) => canvas === original, originalCanvas);
        const snapshot = await page.evaluate(() => {
          const canvas = document.querySelector('[data-universe-host] canvas');
          const gl = canvas.getContext('webgl2');
          return {
            theme: document.documentElement.dataset.theme,
            canvasCount: document.querySelectorAll('[data-universe-host] canvas').length,
            webgl: !!gl && !gl.isContextLost(),
            overflow: document.documentElement.scrollWidth > innerWidth,
            black: getComputedStyle(document.body).backgroundColor === 'rgb(2, 2, 5)',
            images: Array.from(document.querySelectorAll('.event-cover img')).map(image => ({ url: image.currentSrc, loaded: image.complete && image.naturalWidth > 0 })),
          };
        });
        assert.equal(snapshot.theme, theme);
        assert.equal(snapshot.canvasCount, 1);
        assert(snapshot.webgl && sameCanvas && snapshot.black && !snapshot.overflow);
        if (destination === 'section:explore') {
          await page.waitForFunction(() => Array.from(document.querySelectorAll('.event-cover img')).every(image => image.complete && image.naturalWidth > 0));
        }
        report.checks.push({ theme, width, destination, sameCanvas, firstFrameFont, ...snapshot });
      }
      await context.close();
    }
  }
  if (process.env.UNIVERSE_PREVIEW_RECOVERY === '1') {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'es-AR' });
    await context.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions'])));
    const page = await context.newPage();
    const recovery = { entryRequests: [], expectedFailures: [], pageErrors: [] };
    report.recovery = recovery;
    const pattern = /\/assets\/UniverseExperience-[^/]+\.js$/;
    let rejected = false;
    page.on('request', request => { if (pattern.test(request.url())) recovery.entryRequests.push(request.url()); });
    page.on('requestfailed', request => recovery.expectedFailures.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('pageerror', error => recovery.pageErrors.push(error.message));
    await page.route(pattern, route => {
      if (!rejected) { rejected = true; return route.abort('failed'); }
      return route.continue();
    });
    await page.goto(baseURL);
    await page.waitForFunction(() => document.querySelector('[data-universe-host]')?.getAttribute('data-universe-status') === 'fallback');
    await page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' }).waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Abrir perfil de Alex García', exact: true }).click();
    await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
    await page.getByRole('button', { name: 'Reintentar ambiente', exact: true }).click();
    await arrived(page, 'section:profile');
    assert.equal(await page.locator('[data-universe-host] canvas').count(), 1);
    assert.equal(new Set(recovery.entryRequests).size, 2, 'El retry debe solicitar una entrada alternativa real bajo BASE_URL.');
    assert(recovery.entryRequests.every(url => new URL(url).pathname.startsWith(new URL(baseURL).pathname)));
    assert.equal(recovery.expectedFailures.length, 1);
    assert(recovery.pageErrors.every(message => /dynamically imported module|module script|fetch/i.test(message)), 'Solo se admite el rechazo de import provocado.');
    await page.getByRole('button', { name: /^Favoritos/ }).click();
    await arrived(page, 'section:favorites');
    await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).count(), 1);
    recovery.destination = 'section:favorites';
    recovery.favorites = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-favorites-v1')));
    assert.deepEqual(recovery.favorites, ['supernova-sessions']);
    await context.close();
  }
  assert.equal(report.pageErrors.length + report.httpErrors.length + report.failedRequests.length, 0);
} catch (error) {
  report.failure = error instanceof Error ? error.message : String(error);
  report.failureStack = error instanceof Error ? error.stack : undefined;
  process.exitCode = 1;
} finally {
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(resolve(outputDirectory, 'production-review.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  console.log(JSON.stringify({ checks: report.checks.length, pageErrors: report.pageErrors.length, httpErrors: report.httpErrors.length, failedRequests: report.failedRequests.length, failure: report.failure ?? null }));
}
