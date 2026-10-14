import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const chromePath = process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseURL = process.env.UNIVERSE_BASE_URL || 'http://127.0.0.1:5173/';
const capturesDirectory = resolve('docs/experiencia-3d/captures/prompt-2');
const scope = process.env.UNIVERSE_REVIEW_SCOPE === 'dialogs' ? 'dialogs' : 'full';
const date = '2026-10-07T15:00:00Z';
const widths = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }];
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const report = {
  baseURL, browser: browser.version(), businessDate: date, recordedAt: new Date().toISOString(),
  environment: 'Chromium local, viewport emulado; no equivale a hardware móvil físico.',
  frameMeasurement: 'Deltas reales entre callbacks del render R3F con motion habilitado: se guarda uno de cada tres frames y el motor descarta deltas >=250ms. Incluye navegación y cue, no es tiempo GPU ni un benchmark de un teléfono.',
  captureFreeze: 'Pausa voluntaria persistida para destinos. En mapa solar se pausa el reloj completo de Playwright (rAF, performance y timers), conservando la escena renderizada.',
  journeys: [], captures: [], pageErrors: [], consoleErrors: [],
};

function errors(page) {
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
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

async function content(page, selector) {
  await page.waitForFunction(target => {
    const section = document.querySelector(target);
    if (!section || section.getBoundingClientRect().width === 0) return false;
    for (let element = section; element && element.id !== 'main-content'; element = element.parentElement) {
      if (Number(getComputedStyle(element).opacity) < .999) return false;
    }
    return true;
  }, selector);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const host = document.querySelector('[data-universe-host]');
    const canvas = host?.querySelector('canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGB: navigator.deviceMemory ?? null,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      canvasCount: host?.querySelectorAll('canvas').length ?? 0,
      canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
      webgl: gl ? { version: gl.getParameter(gl.VERSION), vendor: gl.getParameter(debug?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR), renderer: gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER), contextLost: gl.isContextLost() } : null,
      theme: document.documentElement.getAttribute('data-theme'),
      status: host?.getAttribute('data-universe-status'),
      destination: host?.getAttribute('data-universe-destination'),
      reason: host?.getAttribute('data-universe-reason'),
      request: Number(host?.getAttribute('data-universe-request')),
      quality: canvas?.dataset.universeQuality ?? null,
      camera: canvas?.dataset.universeCamera?.split(',').map(Number) ?? null,
      calls: Number(canvas?.dataset.universeCalls), triangles: Number(canvas?.dataset.universeTriangles),
      visibleBodies: canvas?.dataset.universeVisible ?? '',
      trailCount: Number(canvas?.dataset.universeTrailCount), cueActive: canvas?.dataset.universeCueActive,
      highlights: canvas?.dataset.universeHighlight,
      frameSamples: canvas?.dataset.universeFrameSamples?.split(',').map(Number).filter(value => Number.isFinite(value) && value > 0) ?? [],
      settledHistory: canvas?.dataset.universeSettled?.split(',').filter(Boolean) ?? [],
      overflow: document.documentElement.scrollWidth > innerWidth,
      dialogOverflow: Array.from(document.querySelectorAll('dialog[open],.registration-modal,.wizard-step-content')).filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1).map(element => element.className || element.tagName),
      backgrounds: [document.documentElement, document.body, host, document.querySelector('.app-shell')].map(element => element ? getComputedStyle(element).backgroundColor : null),
    };
  });
}

function frameStats(values) {
  const samples = values.filter(value => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!samples.length) return null;
  return {
    samples: samples.length, meanMs: Number((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2)),
    medianMs: samples[Math.floor(samples.length / 2)], p95Ms: samples[Math.min(samples.length - 1, Math.floor(samples.length * .95))],
    maximumMs: samples.at(-1), over33ms: samples.filter(value => value > 33.34).length,
  };
}

function galleryMarkdown() {
  const labels = { 'hero': 'Hero', 'mis-eventos': 'Mis eventos', 'favoritos-vacio': 'Favoritos vacío', 'favoritos-con-datos': 'Favoritos con datos', 'evento': 'Evento', 'evento-formulario': 'Formulario móvil', 'pase': 'Pase confirmado', 'nave-admin': 'Nave admin', 'cabina': 'Cabina', 'mapa-solar': 'Mapa solar' };
  const scenes = [...new Set(report.captures.map(capture => capture.file.replace(/-(dark|light)-\d+\.png$/, '')))];
  const columns = ['dark-1440', 'light-1440', 'dark-390', 'light-390', 'dark-320', 'light-320'];
  const files = new Set(report.captures.map(capture => capture.file));
  const rows = scenes.map(scene => `| ${labels[scene] || scene} | ${columns.map(column => files.has(`${scene}-${column}.png`) ? `[Ver](${scene}-${column}.png)` : '—').join(' | ')} |`);
  if (report.revisions?.length) rows.push('\nSe recapturaron sólo las16 imágenes de evento, formulario y pase con `UNIVERSE_REVIEW_SCOPE=dialogs` tras ocultar el DOM de origen. Las42 capturas restantes y las3 mediciones live conservan su registro inicial; sus timestamps están en el JSON.');
  const measurements = report.journeys.map(journey => `| ${journey.viewport.width} × ${journey.viewport.height} | ${journey.quality} | ${journey.maximumCalls} | ${journey.maximumTriangles} | ${journey.frameStats?.medianMs ?? 'N/A'} | ${journey.frameStats?.p95Ms ?? 'N/A'} | ${journey.maximumTrail} → ${journey.finalTrail} |`);
  return `# Capturas y mediciones · Prompt 2\n\n${report.failure ? `Revisión incompleta: ${report.failure}` : `Revisión completada: ${report.captures.length} capturas, ${report.journeys.length} recorridos medidos y ${report.pageErrors.length + report.consoleErrors.length} errores de página/consola.`}\n\nComando ejecutado: \`node scripts/universe-motion-review.mjs\`. URL: \`${baseURL}\`. Chromium ${report.browser}. ${report.environment}\n\nRenderer observado: \`${report.journeys[0]?.webgl?.renderer ?? 'Sin medición'}\`. ${report.captureFreeze}\n\n| Escena | Oscuro 1440 | Claro 1440 | Oscuro 390 | Claro 390 | Oscuro 320 | Claro 320 |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n| Viewport | Calidad final | Calls máximas | Triángulos máximos | Frame mediano ms | Frame p95 ms | Pool estela |\n|---|---|---|---|---|---|---|\n${measurements.join('\n')}\n\n${report.frameMeasurement} Los detalles del entorno, estados de llegada, cue y errores están en [motion-review.json](motion-review.json).\n`;
}

async function capture(page, name, destination, selector, resetScroll = true) {
  await content(page, selector);
  await settle(page, destination);
  if (resetScroll) await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const state = await snapshot(page);
  const file = `${name}-${state.theme}-${state.viewport.width}.png`;
  await page.screenshot({ path: resolve(capturesDirectory, file), animations: 'disabled' });
  const { frameSamples, ...metadata } = state;
  report.captures.push({ file, ...metadata });
  if (!state.webgl || state.canvasCount !== 1 || state.overflow || state.dialogOverflow.length) throw new Error(`Composición inválida: ${file}`);
  if (state.backgrounds.slice(0, 3).some(color => color !== 'rgb(2, 2, 5)') || state.backgrounds[3] !== 'rgba(0, 0, 0, 0)') throw new Error(`Fondo inconsistente: ${file}`);
  const budget = state.quality === 'low' ? { calls: 20, triangles: 18_000 } : state.quality === 'balanced' ? { calls: 35, triangles: 40_000 } : { calls: 60, triangles: 100_000 };
  if (state.calls > budget.calls || state.triangles > budget.triangles) throw new Error(`Presupuesto ${state.quality} excedido: ${file} (${state.calls} calls / ${state.triangles} triángulos)`);
  console.log(JSON.stringify({ captured: file, quality: state.quality, calls: state.calls, triangles: state.triangles }));
}

async function seed(context, theme, paused) {
  await context.addInitScript(({ theme, paused }) => {
    localStorage.setItem('supernova-theme-v1', JSON.stringify(theme));
    localStorage.setItem('supernova-universe-motion-v1', String(paused));
    localStorage.setItem('supernova-favorites-v1', '[]');
  }, { theme, paused });
}

async function captureEventAndPass(page, viewport) {
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await capture(page, 'evento', 'event:supernova-sessions', '.registration-layout');
  if (viewport.width < 768) {
    await page.getByLabel('Tu nombre', { exact: true }).scrollIntoViewIfNeeded();
    await capture(page, 'evento-formulario', 'event:supernova-sessions', '.registration-layout', false);
  }
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await page.getByRole('heading', { name: 'Ya sos parte.', exact: true }).waitFor();
  await capture(page, 'pase', 'event:supernova-sessions', '.success-content');
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click();
  await settle(page, 'section:favorites');
}

async function startSampler(page) {
  await page.evaluate(() => {
    const state = { samples: [], frame: 0, start: performance.now() };
    function sample() {
      const canvas = document.querySelector('[data-universe-host] canvas');
      const host = document.querySelector('[data-universe-host]');
      state.samples.push({ atMs: performance.now() - state.start, request: Number(host?.dataset.universeRequest), travelling: host?.dataset.universeTravelling === 'true', calls: Number(canvas?.dataset.universeCalls), triangles: Number(canvas?.dataset.universeTriangles), trail: Number(canvas?.dataset.universeTrailCount), cue: canvas?.dataset.universeCueActive === 'true', quality: canvas?.dataset.universeQuality });
      state.frame = requestAnimationFrame(sample);
    }
    state.frame = requestAnimationFrame(sample);
    window.__universeReview = state;
  });
}

async function stopSampler(page) {
  return page.evaluate(() => {
    const state = window.__universeReview;
    cancelAnimationFrame(state.frame);
    return state.samples;
  });
}

try {
  await mkdir(capturesDirectory, { recursive: true });
  if (scope === 'dialogs') {
    const previous = JSON.parse(await readFile(resolve(capturesDirectory, 'motion-review.json'), 'utf8'));
    report.journeys = previous.journeys;
    report.captures = previous.captures.filter(capture => !/^(evento|evento-formulario|pase)-/.test(capture.file));
    report.revisions = [...(previous.revisions ?? []), { recordedAt: report.recordedAt, scope, reason: 'Recaptura de evento, formulario y pase tras corregir la visibilidad del DOM de origen.' }];
    report.retainedMeasurementsRecordedAt = previous.recordedAt;
  }
  // Measure a real renderer journey at each size before pausing the environment.
  for (const viewport of scope === 'full' ? widths : []) {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference', timezoneId: 'America/Montevideo', locale: 'es-AR' });
    await seed(context, 'dark', false);
    const page = await context.newPage(); errors(page);
    await page.clock.setFixedTime(new Date(date));
    await page.goto(baseURL); await ready(page);
    const original = await page.locator('[data-universe-host] canvas').elementHandle();
    const before = await snapshot(page);
    await startSampler(page);
    await page.getByRole('button', { name: /^Mis eventos/ }).click();
    await settle(page, 'section:registrations');
    await page.getByRole('button', { name: /^Favoritos/ }).click();
    await settle(page, 'section:favorites');
    // Lifetime is verified after arrival while the real render loop remains enabled.
    await page.waitForFunction(() => document.querySelector('[data-universe-host] canvas')?.dataset.universeTrailCount === '0');
    const navigationSamples = await stopSampler(page);
    await page.getByRole('button', { name: 'Explorar', exact: true }).click();
    await settle(page, 'section:explore');
    await content(page, '.hero');
    await startSampler(page);
    await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
    await settle(page, 'event:supernova-sessions');
    await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
    await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
    await page.getByRole('heading', { name: 'Ya sos parte.', exact: true }).waitFor();
    await settle(page, 'event:supernova-sessions');
    await page.waitForFunction(() => document.querySelector('[data-universe-host] canvas')?.dataset.universeCueActive === 'false');
    const cueSamples = await stopSampler(page);
    const samples = [...navigationSamples, ...cueSamples];
    const state = await snapshot(page);
    const persistentCanvas = await page.locator('[data-universe-host] canvas').evaluate((canvas, originalCanvas) => canvas === originalCanvas, original);
    const calls = Math.max(0, ...samples.map(sample => sample.calls).filter(Number.isFinite));
    const triangles = Math.max(0, ...samples.map(sample => sample.triangles).filter(Number.isFinite));
    const trailMaximum = Math.max(0, ...samples.map(sample => sample.trail).filter(Number.isFinite));
    const historyIds = state.settledHistory.map(result => result.split(':')[0]);
    const cueObserved = cueSamples.some(sample => sample.cue);
    report.journeys.push({ ...state, frameStats: frameStats(state.frameSamples), observedFrameCount: samples.length, maximumCalls: calls, maximumTriangles: triangles, maximumTrail: trailMaximum, finalTrail: state.trailCount, cueObserved, finalCue: state.cueActive, persistentCanvas, cameraDisplacement: Math.hypot(...state.camera.map((value, index) => value - before.camera[index])), samples });
    if (!state.webgl || !state.frameSamples.length || !calls || !triangles || !historyIds.length) throw new Error(`Faltan mediciones DEV del renderer a ${viewport.width}px. Ejecutá contra Vite dev.`);
    if (!persistentCanvas || trailMaximum <= 0 || state.trailCount !== 0 || !cueObserved || state.cueActive !== 'false' || new Set(historyIds).size !== historyIds.length) throw new Error(`Viaje/estela/cue inválidos a ${viewport.width}px`);
    const low = samples.filter(sample => sample.quality === 'low');
    const balanced = samples.filter(sample => sample.quality === 'balanced');
    if (low.some(sample => sample.calls > 20 || sample.triangles > 18_000) || balanced.some(sample => sample.calls > 35 || sample.triangles > 40_000)) throw new Error(`Presupuesto excedido a ${viewport.width}px`);
    console.log(JSON.stringify({ measured: viewport.width, renderer: state.webgl.renderer, frames: frameStats(state.frameSamples), calls, triangles, trailMaximum }));
    await context.close();
  }

  for (const theme of ['dark', 'light']) for (const viewport of widths) {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference', timezoneId: 'America/Montevideo', locale: 'es-AR' });
    await seed(context, theme, true);
    const page = await context.newPage(); errors(page);
    await page.clock.setFixedTime(new Date(date));
    await page.goto(baseURL); await ready(page);
    if (scope === 'dialogs') {
      await page.getByRole('button', { name: 'Guardar Supernova Sessions', exact: true }).click();
      await page.getByRole('button', { name: /^Favoritos/ }).click();
      await content(page, '.favorites-page');
      await captureEventAndPass(page, viewport);
      await context.close();
      continue;
    }
    await capture(page, 'hero', 'section:explore', '.hero');
    await page.getByRole('button', { name: /^Mis eventos/ }).click();
    await capture(page, 'mis-eventos', 'section:registrations', '.my-events');
    await page.getByRole('button', { name: /^Favoritos/ }).click();
    await capture(page, 'favoritos-vacio', 'section:favorites', '.favorites-page');
    await page.getByRole('button', { name: 'Explorar', exact: true }).click();
    await content(page, '.hero');
    await page.getByRole('button', { name: 'Guardar Supernova Sessions', exact: true }).click();
    await page.getByRole('button', { name: /^Favoritos/ }).click();
    await capture(page, 'favoritos-con-datos', 'section:favorites', '.favorites-page');
    await captureEventAndPass(page, viewport);
    await page.getByRole('button', { name: 'Administrar', exact: true }).click();
    await capture(page, 'nave-admin', 'section:admin', '.admin-dashboard');
    await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
    await page.getByLabel('Nombre del evento').waitFor();
    await capture(page, 'cabina', 'studio', '.wizard-step-content');
    await page.getByRole('button', { name: 'Volver a eventos', exact: true }).click();
    await settle(page, 'section:admin');
    await context.close();

    // Freeze the shared clock during a replay to capture the first solar frame.
    const solarContext = await browser.newContext({ viewport, reducedMotion: 'no-preference', timezoneId: 'America/Montevideo', locale: 'es-AR' });
    await seed(solarContext, theme, false);
    const solarPage = await solarContext.newPage(); errors(solarPage);
    await solarPage.clock.install({ time: new Date(date) });
    await solarPage.goto(baseURL); await ready(solarPage);
    const currentDate = await solarPage.evaluate(() => Date.now());
    await solarPage.clock.pauseAt(currentDate + 30);
    await solarPage.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Volver a vivir el inicio')?.click());
    await solarPage.clock.runFor(400);
    await solarPage.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' }).waitFor();
    const solar = await snapshot(solarPage);
    const file = `mapa-solar-${theme}-${viewport.width}.png`;
    await solarPage.screenshot({ path: resolve(capturesDirectory, file), animations: 'disabled' });
    report.captures.push({ file, ...solar, clockFrozenAtMs: await solarPage.evaluate(() => performance.now() - Number(document.querySelector('[data-cinematic-intro]')?.dataset.introStartedAt)), solarPresentation: 'Primer frame solar DOM + universo persistente, como lo especifica el storyboard.' });
    if (!solar.webgl || solar.canvasCount !== 1 || solar.overflow) throw new Error(`Mapa solar inválido: ${file}`);
    if (solar.quality === 'low' && (solar.calls > 20 || solar.triangles > 18_000) || solar.quality === 'balanced' && (solar.calls > 35 || solar.triangles > 40_000)) throw new Error(`Presupuesto del mapa solar excedido: ${file}`);
    console.log(JSON.stringify({ captured: file, freeze: 'rAF+performance+timers' }));
    await solarContext.close();
  }
  if (report.pageErrors.length || report.consoleErrors.length) throw new Error('La revisión registró errores de página o consola.');
} catch (error) {
  report.failure = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(capturesDirectory, 'motion-review.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(capturesDirectory, 'README.md'), galleryMarkdown());
  await browser.close();
  console.log(JSON.stringify({ captures: report.captures.length, journeys: report.journeys.length, errors: report.pageErrors.length + report.consoleErrors.length, failure: report.failure ?? null, report: resolve(capturesDirectory, 'motion-review.json') }));
}
