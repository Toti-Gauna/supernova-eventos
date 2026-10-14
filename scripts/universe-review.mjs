import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const chromePath = process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseURL = process.env.UNIVERSE_BASE_URL || 'http://127.0.0.1:5173/';
const capturesDirectory = resolve('docs/experiencia-3d/captures');
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const report = {
  baseURL,
  browser: browser.version(),
  businessDate: '2026-10-07T15:00:00Z',
  reducedMotion: 'no-preference',
  captureFreeze: 'Preferencia local Pausar movimiento; semilla de escena estable. animations:disabled sólo congela el DOM.',
  fps: 'No medido: rAF del navegador por sí solo no prueba el rendimiento del renderer.',
  journeys: [],
  captures: [],
  pageErrors: [],
  consoleErrors: [],
};

function collectErrors(page) {
  page.on('pageerror', error => report.pageErrors.push({ url: page.url(), message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') report.consoleErrors.push({ url: page.url(), message: message.text() });
  });
}

async function settle(page, destination) {
  await page.waitForFunction(expected => {
    const host = document.querySelector('[data-universe-host]');
    return host?.getAttribute('data-universe-status') === 'ready'
      && host.getAttribute('data-universe-destination') === expected
      && host.getAttribute('data-universe-request') === host.getAttribute('data-universe-settled')
      && host.getAttribute('data-universe-outcome') === 'arrived'
      && host.getAttribute('data-universe-travelling') === 'false';
  }, destination, { timeout: 20_000 });
}

async function ready(page) {
  await page.getByRole('heading', { name: /Salí de la rutina/ }).waitFor();
  await page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' }).waitFor({ state: 'detached', timeout: 10_000 });
  await settle(page, 'section:explore');
  await page.evaluate(() => document.fonts.ready);
}

async function settledContent(page, selector) {
  await page.waitForFunction(target => {
    const section = document.querySelector(target);
    if (!section || section.getBoundingClientRect().width === 0) return false;
    for (let element = section; element && element.id !== 'main-content'; element = element.parentElement) {
      if (Number(getComputedStyle(element).opacity) < .999) return false;
    }
    return true;
  }, selector);
}

async function sceneSnapshot(page) {
  return page.evaluate(() => {
    const host = document.querySelector('[data-universe-host]');
    const canvas = host?.querySelector('canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    const rect = canvas?.getBoundingClientRect();
    return {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGB: navigator.deviceMemory ?? null,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      canvasCount: host?.querySelectorAll('canvas').length ?? 0,
      canvasSize: rect ? { width: rect.width, height: rect.height, drawingWidth: canvas.width, drawingHeight: canvas.height } : null,
      webgl: gl ? {
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(debug?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR),
        renderer: gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER),
        contextLost: gl.isContextLost(),
      } : null,
      destination: host?.getAttribute('data-universe-destination'),
      activeTheme: document.documentElement.getAttribute('data-theme'),
      status: host?.getAttribute('data-universe-status'),
      quality: host?.getAttribute('data-universe-quality') ?? null,
      cameraPosition: canvas?.getAttribute('data-universe-camera')?.split(',').map(Number) ?? null,
      headingColor: document.querySelector('main h1') ? getComputedStyle(document.querySelector('main h1')).color : null,
      engine: canvas ? {
        request: canvas.getAttribute('data-universe-request'),
        destination: canvas.getAttribute('data-universe-destination'),
        motion: canvas.getAttribute('data-universe-motion'),
        quality: canvas.getAttribute('data-universe-quality'),
        drawCalls: canvas.getAttribute('data-universe-calls'),
        triangles: canvas.getAttribute('data-universe-triangles'),
        visibleBodies: canvas.getAttribute('data-universe-visible'),
      } : null,
      overflow: document.documentElement.scrollWidth > innerWidth,
      dialogOverflow: Array.from(document.querySelectorAll('dialog[open],.registration-modal,.wizard-step-content')).filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1).map(element => element.className || element.tagName),
      backgrounds: [document.documentElement, document.body, host, document.querySelector('.app-shell')].map(element => element ? getComputedStyle(element).backgroundColor : null),
    };
  });
}

async function captureComposition(page, theme, viewport, name, destination, section, resetScroll = true) {
  await settledContent(page, section);
  await settle(page, destination);
  if (resetScroll) await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  // Resize and HTML composition have two frames to invalidate a demand-rendered scene.
  await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const nameWithViewport = `${name}-${theme}-${viewport.width}.png`;
  await page.screenshot({ path: resolve(capturesDirectory, nameWithViewport), animations: 'disabled' });
  const snapshot = await sceneSnapshot(page);
  report.captures.push({ file: nameWithViewport, theme, ...snapshot });
  if (snapshot.activeTheme !== theme) throw new Error(`Preferencia de tema no aplicada: ${nameWithViewport}`);
  if (!snapshot.webgl || snapshot.canvasCount !== 1 || snapshot.overflow || snapshot.dialogOverflow.length) throw new Error(`Captura inválida: ${nameWithViewport}`);
  if (snapshot.backgrounds.slice(0, 3).some(color => color !== 'rgb(2, 2, 5)') || snapshot.backgrounds[3] !== 'rgba(0, 0, 0, 0)') throw new Error(`Fondo espacial inconsistente: ${nameWithViewport}`);
  console.log(JSON.stringify({ captured: nameWithViewport, destination, overflow: snapshot.overflow, renderer: snapshot.webgl.renderer }));
}

try {
  await mkdir(capturesDirectory, { recursive: true });

  // Observe real journeys before freezing the scene for reproducible captures.
  const liveContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', timezoneId: 'America/Montevideo', locale: 'es-AR',
  });
  await liveContext.addInitScript(() => {
    localStorage.setItem('supernova-universe-motion-v1', 'false');
    localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions']));
  });
  const livePage = await liveContext.newPage();
  collectErrors(livePage);
  await livePage.clock.setFixedTime(new Date(report.businessDate));
  await livePage.goto(baseURL);
  await ready(livePage);
  const originalCanvas = await livePage.locator('[data-universe-host] canvas').elementHandle();
  for (const { label, destination } of [
    { label: /^Mis eventos/, destination: 'section:registrations' },
    { label: /^Favoritos/, destination: 'section:favorites' },
    { label: /^Explorar$/, destination: 'section:explore' },
  ]) {
    const previousCamera = (await sceneSnapshot(livePage)).cameraPosition;
    await livePage.getByRole('button', { name: label }).click();
    await livePage.waitForFunction(() => document.querySelector('[data-universe-host]')?.getAttribute('data-universe-travelling') === 'true');
    const beganAt = await livePage.evaluate(() => performance.now());
    await settle(livePage, destination);
    const finishedAt = await livePage.evaluate(() => performance.now());
    const snapshot = await sceneSnapshot(livePage);
    const cameraDistance = previousCamera && snapshot.cameraPosition
      ? Math.hypot(...snapshot.cameraPosition.map((value, index) => value - previousCamera[index])) : null;
    const persistentCanvas = await livePage.locator('[data-universe-host] canvas').evaluate((canvas, original) => canvas === original, originalCanvas);
    report.journeys.push({ destination, observedRemainingTravelMs: Math.round(finishedAt - beganAt), persistentCanvas, cameraDistance, ...snapshot });
    if (!persistentCanvas || !snapshot.webgl || snapshot.overflow || (cameraDistance !== null && cameraDistance < .5)) throw new Error(`Viaje inválido: ${destination}`);
  }
  await liveContext.close();

  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', timezoneId: 'America/Montevideo', locale: 'es-AR',
    });
    // Keep motion enabled at OS level and freeze WebGL with the actual persisted user preference.
    await context.addInitScript(value => {
      localStorage.setItem('supernova-theme-v1', JSON.stringify(value));
      localStorage.setItem('supernova-universe-motion-v1', 'true');
      localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions']));
    }, theme);
    const page = await context.newPage();
    collectErrors(page);
    await page.clock.setFixedTime(new Date(report.businessDate));
    await page.goto(baseURL);
    await ready(page);
    for (const viewport of [
      { width: 320, height: 667 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const { label, destination, name, section } of [
        { label: /^Explorar$/, destination: 'section:explore', name: 'hero', section: '.hero' },
        { label: /^Mis eventos/, destination: 'section:registrations', name: 'mis-eventos', section: '.my-events' },
        { label: /^Favoritos/, destination: 'section:favorites', name: 'favoritos', section: '.favorites-page' },
      ]) {
        await page.getByRole('button', { name: label }).click();
        await captureComposition(page, theme, viewport, name, destination, section);
      }
    }

    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.getByRole('button', { name: 'Abrir perfil de Alex García', exact: true }).click();
      await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
      await captureComposition(page, theme, viewport, 'perfil', 'section:profile', '.profile-page');

      await page.getByRole('button', { name: 'Administrar', exact: true }).click();
      await page.getByRole('button', { name: 'Crear experiencia', exact: true }).waitFor();
      await captureComposition(page, theme, viewport, 'admin', 'section:admin', '.admin-dashboard');
      await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
      await page.getByLabel('Nombre del evento').waitFor();
      await captureComposition(page, theme, viewport, 'estudio', 'studio', '.wizard-step-content');
      await page.getByRole('button', { name: 'Volver a eventos', exact: true }).click();
      await settledContent(page, '.admin-dashboard');

      await page.getByRole('button', { name: 'Explorar', exact: true }).click();
      await settledContent(page, '.hero');
      await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
      await page.getByRole('dialog', { name: 'Supernova Sessions', exact: true }).waitFor();
      await captureComposition(page, theme, viewport, 'evento', 'event:supernova-sessions', '.registration-layout');
      if (viewport.width === 390) {
        await page.getByLabel('Tu nombre', { exact: true }).scrollIntoViewIfNeeded();
        await captureComposition(page, theme, viewport, 'evento-formulario', 'event:supernova-sessions', '.registration-layout', false);
      }
      await page.keyboard.press('Escape');
      await page.getByRole('dialog', { name: 'Supernova Sessions', exact: true }).waitFor({ state: 'detached' });
      await settle(page, 'section:explore');
    }
    await context.close();
  }
  if (report.pageErrors.length || report.consoleErrors.length) throw new Error('La revisión registró errores de página o consola.');
} catch (error) {
  report.failure = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(capturesDirectory, 'review.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  console.log(JSON.stringify({ captures: report.captures.length, journeys: report.journeys.length, pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length, failure: report.failure ?? null, report: resolve(capturesDirectory, 'review.json') }));
}
