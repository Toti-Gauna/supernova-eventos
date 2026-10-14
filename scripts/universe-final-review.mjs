import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const chromePath = process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseURL = process.env.UNIVERSE_BASE_URL || 'http://127.0.0.1:5173/';
const directory = resolve('docs/experiencia-3d/captures/prompt-3');
const businessDate = '2026-10-09T15:00:00Z';
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 667 }];
const scope = process.env.UNIVERSE_FINAL_SCOPE || 'full';
const retainedFiles = new Set();
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const report = {
  baseURL, businessDate, recordedAt: new Date().toISOString(), browser: browser.version(), scope,
  environment: 'Chrome local con WebGL real y viewport emulado. No es una prueba sobre dispositivos móviles físicos.',
  frameMeasurement: 'Deltas de callbacks R3F con movimiento habilitado; el engine conserva uno de cada tres frames y descarta deltas >=250 ms. No mide tiempo GPU.',
  resourceMeasurement: 'gl.info.memory.geometries/textures, gl.info.programs.length y nodos scene.traverse; dos ciclos de calentamiento y cuatro ciclos medidos en el mismo destino. Una meseta local no demuestra ausencia de fugas.',
  captureFreeze: 'Pausa voluntaria persistida mantiene los destinos estáticos. El cue se captura a 320 ms con el reloj completo (rAF, performance y timers) pausado; se identifica en su metadata. animations:disabled sólo congela DOM. Las mediciones de recorridos usan reloj vivo.',
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
    for (let node = section; node && node.id !== 'main-content'; node = node.parentElement) {
      if (Number(getComputedStyle(node).opacity) < .999) return false;
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
    const rect = node => {
      const element = document.querySelector(node);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, top: box.top, bottom: box.bottom, right: box.right,
        fitsViewport: box.top >= -.5 && box.bottom <= innerHeight + .5 && box.x >= -.5 && box.right <= innerWidth + .5,
        overflow: element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1 };
    };
    return {
      userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGB: navigator.deviceMemory ?? null, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      webgl: gl ? { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER), contextLost: gl.isContextLost() } : null,
      canvasCount: host?.querySelectorAll('canvas').length ?? 0,
      theme: document.documentElement.getAttribute('data-theme'), status: host?.dataset.universeStatus,
      destination: host?.dataset.universeDestination, request: host?.dataset.universeRequest,
      quality: canvas?.dataset.universeQuality, camera: canvas?.dataset.universeCamera?.split(',').map(Number),
      calls: Number(canvas?.dataset.universeCalls), triangles: Number(canvas?.dataset.universeTriangles),
      trail: Number(canvas?.dataset.universeTrailCount), cue: canvas?.dataset.universeCueActive,
      frames: Number(canvas?.dataset.universeFrames), frameloop: canvas?.dataset.universeFrameloop,
      resources: { geometries: Number(canvas?.dataset.universeGeometries), textures: Number(canvas?.dataset.universeTextures), programs: Number(canvas?.dataset.universePrograms), sceneObjects: Number(canvas?.dataset.universeSceneObjects) },
      frameSamples: canvas?.dataset.universeFrameSamples?.split(',').map(Number).filter(Number.isFinite) ?? [],
      visibleBodies: canvas?.dataset.universeVisible,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      internalHorizontalOverflow: [...document.querySelectorAll('dialog[open],.registration-modal,.wizard-step-content')].filter(node => node.clientWidth && node.scrollWidth > node.clientWidth + 1).map(node => node.className),
      rectangles: { eventSurface: rect('[data-universe-surface="event"]'), pass: rect('.success-content'), modal: rect('.registration-modal'), calendar: rect('.calendar-table'), actions: rect('.success-actions'), cancellation: rect('.cancel-registration'), warning: rect('.demo-pass-note') },
      backgrounds: [document.documentElement, document.body, host, document.querySelector('.app-shell')].map(node => node ? getComputedStyle(node).backgroundColor : null),
    };
  });
}

function stats(values) {
  const sorted = values.filter(value => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  return sorted.length ? { count: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor((sorted.length - 1) * .95)], maxMs: sorted.at(-1), meanMs: Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2)) } : null;
}

async function makeContext(viewport, theme, paused, controlledClock = false) {
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference', timezoneId: 'America/Montevideo', locale: 'es-AR' });
  await context.addInitScript(({ theme, paused }) => {
    localStorage.setItem('supernova-theme-v1', JSON.stringify(theme));
    localStorage.setItem('supernova-universe-motion-v1', String(paused));
    localStorage.setItem('supernova-favorites-v1', '[]');
  }, { theme, paused });
  const page = await context.newPage(); errors(page);
  if (controlledClock) await page.clock.install({ time: new Date(businessDate) });
  else await page.clock.setFixedTime(new Date(businessDate));
  await page.goto(baseURL); await ready(page);
  return { context, page };
}

async function capture(page, name, destination, selector, resetScroll = true) {
  await content(page, selector); await settle(page, destination);
  if (name.startsWith('pase')) await content(page, '.calendar-table-wrap');
  if (resetScroll) await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const state = await snapshot(page);
  const file = `${name}-${state.theme}-${state.viewport.width}x${state.viewport.height}.png`;
  await page.screenshot({ path: resolve(directory, file), animations: 'disabled' });
  const { frameSamples, ...metadata } = state;
  report.captures.push({ file, ...metadata });
  if (!state.webgl || state.webgl.contextLost || state.canvasCount !== 1 || state.horizontalOverflow || state.internalHorizontalOverflow.length) throw new Error(`Composición inválida: ${file}`);
  if (state.backgrounds.slice(0, 3).some(color => color !== 'rgb(2, 2, 5)') || state.backgrounds[3] !== 'rgba(0, 0, 0, 0)') throw new Error(`Fondo espacial inconsistente: ${file}`);
  if (name.startsWith('pase')) {
    for (const key of ['calendar', 'actions', 'cancellation', 'warning']) {
      if (!state.rectangles[key]?.fitsViewport) throw new Error(`Pase: ${key} fuera del viewport en ${file}`);
    }
    if (state.rectangles.modal.overflow || state.rectangles.pass.overflow) throw new Error(`Pase con scroll en ${file}`);
    if (!state.rectangles.eventSurface?.height || !state.rectangles.eventSurface.fitsViewport) throw new Error(`Pase sin región espacial visible y medida: ${file}`);
  }
  console.log(JSON.stringify({ captured: file, destination, resources: state.resources }));
}

async function profile(page) {
  await page.getByRole('button', { name: 'Abrir perfil de Alex García', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
  await settle(page, 'section:profile');
}

async function resourceCycle(page, first = false) {
  for (const [name, destination] of [[/^Mis eventos/, 'section:registrations'], [/^Favoritos/, 'section:favorites'], ['Administrar', 'section:admin']]) {
    await page.getByRole('button', { name, exact: typeof name === 'string' }).click(); await settle(page, destination);
  }
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click(); await settle(page, 'studio');
  await page.getByRole('button', { name: 'Volver a eventos', exact: true }).click(); await settle(page, 'section:admin');
  await page.getByRole('button', { name: 'Explorar', exact: true }).click(); await settle(page, 'section:explore');
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click(); await settle(page, 'event:supernova-sessions');
  if (first) {
    await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
    await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
    await settle(page, 'event:supernova-sessions');
  }
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click(); await settle(page, 'section:explore');
  for (const [category, title, eventId] of [['Bienestar', 'Un respiro para vos', 'reset-mind'], ['Tecnología', 'El futuro empieza acá', 'next-frontier']]) {
    await page.getByRole('button', { name: category, exact: true }).click();
    await page.getByRole('button', { name: `Ver ${title}`, exact: true }).click(); await settle(page, `event:${eventId}`);
    await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click(); await settle(page, 'section:explore');
  }
  await page.getByRole('button', { name: /Todo el universo/ }).click();
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('[data-universe-host]')?.dataset.universePaused === 'false');
  // Read telemetry after at least thirteen actual render callbacks, not browser rAF alone.
  const previous = Number(await page.locator('[data-universe-host] canvas').getAttribute('data-universe-frames'));
  await page.waitForFunction(value => Number(document.querySelector('[data-universe-host] canvas')?.dataset.universeFrames) > value + 12, previous);
  return snapshot(page);
}

async function measure(viewport) {
  const { context, page } = await makeContext(viewport, 'dark', false);
  const original = await page.locator('[data-universe-host] canvas').elementHandle();
  await page.evaluate(() => {
    const samples = []; let frame;
    const sample = () => {
      const canvas = document.querySelector('[data-universe-host] canvas');
      samples.push({ atMs: performance.now(), calls: Number(canvas?.dataset.universeCalls), triangles: Number(canvas?.dataset.universeTriangles), trail: Number(canvas?.dataset.universeTrailCount), cue: canvas?.dataset.universeCueActive === 'true', quality: canvas?.dataset.universeQuality });
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    window.__finalSampler = { samples, stop: () => cancelAnimationFrame(frame) };
  });
  const warmup = [await resourceCycle(page, true), await resourceCycle(page)];
  const cycles = [];
  for (let index = 0; index < 4; index++) cycles.push(await resourceCycle(page));
  const samples = await page.evaluate(() => { window.__finalSampler.stop(); return window.__finalSampler.samples; });
  const state = await snapshot(page);
  const persistentCanvas = await page.locator('[data-universe-host] canvas').evaluate((element, saved) => element === saved, original);
  const resourceCounts = cycles.map(cycle => cycle.resources);
  const resourceRange = Object.fromEntries(Object.keys(resourceCounts[0]).map(key => [key, { minimum: Math.min(...resourceCounts.map(value => value[key])), maximum: Math.max(...resourceCounts.map(value => value[key])) }]));
  const measurement = { recordedAt: new Date().toISOString(), viewport, ...state, frameStats: stats(state.frameSamples), warmup: warmup.map(value => value.resources), cycles: resourceCounts, cycleQuality: cycles.map(value => value.quality), resourceRange, persistentCanvas,
    maximumCalls: Math.max(...samples.map(value => value.calls)), maximumTriangles: Math.max(...samples.map(value => value.triangles)), maximumTrail: Math.max(...samples.map(value => value.trail)), cueObserved: samples.some(value => value.cue), sampledBrowserFrames: samples.length };
  report.journeys.push(measurement);
  if (!state.webgl || state.webgl.contextLost || !persistentCanvas || !measurement.frameStats || !measurement.cueObserved || !measurement.maximumTrail || state.trail !== 0 || state.cue !== 'false') throw new Error(`Medición de movimiento incompleta a ${viewport.width}px`);
  if (resourceCounts.some(value => Object.values(value).some(count => !Number.isFinite(count))) || state.resources.geometries === 0) throw new Error('Falta telemetry DEV de recursos');
  for (const sample of samples) {
    const max = sample.quality === 'low' ? { calls: 20, triangles: 18000 } : sample.quality === 'balanced' ? { calls: 35, triangles: 40000 } : { calls: 60, triangles: 100000 };
    if (sample.calls > max.calls || sample.triangles > max.triangles) throw new Error(`Presupuesto excedido a ${viewport.width}px`);
  }
  console.log(JSON.stringify({ measured: viewport, frameStats: measurement.frameStats, resourceRange, persistentCanvas }));
  await context.close();
}

async function captureFlow(theme, viewport) {
  const { context, page } = await makeContext(viewport, theme, true);
  await capture(page, 'hero', 'section:explore', '.hero');
  await page.getByRole('button', { name: /^Mis eventos/ }).click(); await capture(page, 'mis-eventos', 'section:registrations', '.my-events');
  await page.getByRole('button', { name: /^Favoritos/ }).click(); await capture(page, 'favoritos-vacio', 'section:favorites', '.favorites-page');
  await page.getByRole('button', { name: 'Explorar', exact: true }).click(); await content(page, '.hero');
  await page.getByRole('button', { name: 'Guardar Supernova Sessions', exact: true }).click();
  await page.getByRole('button', { name: /^Favoritos/ }).click(); await capture(page, 'favoritos', 'section:favorites', '.favorites-page');
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click(); await capture(page, 'evento', 'event:supernova-sessions', '.registration-layout');
  if (viewport.width < 768) {
    await page.getByLabel('Tu nombre', { exact: true }).scrollIntoViewIfNeeded();
    await capture(page, 'evento-formulario', 'event:supernova-sessions', '.registration-layout', false);
  }
  await capturePasses(page, viewport);
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click(); await settle(page, 'section:favorites');
  await page.getByRole('button', { name: /^Mis eventos/ }).click(); await capture(page, 'mis-eventos-con-pase', 'section:registrations', '.my-events');
  await profile(page); await capture(page, 'perfil', 'section:profile', '.profile-page');
  await page.getByRole('button', { name: 'Administrar', exact: true }).click(); await capture(page, 'nave', 'section:admin', '.admin-dashboard');
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click(); await capture(page, 'cabina', 'studio', '.wizard-step-content');
  await context.close();
}

async function capturePasses(page, viewport) {
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click(); await capture(page, 'pase', 'event:supernova-sessions', '.success-content');
  await page.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await page.locator('.calendar-table tbody tr').nth(5).waitFor();
  await capture(page, 'pase-seis-filas', 'event:supernova-sessions', '.success-content');
  if (viewport.width === 1440) {
    await page.setViewportSize({ width: 1280, height: 550 }); await capture(page, 'pase-seis-filas', 'event:supernova-sessions', '.success-content');
    await page.setViewportSize(viewport);
  } else if (viewport.width === 390) {
    await page.setViewportSize({ width: 390, height: 667 }); await capture(page, 'pase-seis-filas', 'event:supernova-sessions', '.success-content');
    await page.setViewportSize(viewport);
  }
}

async function captureRevisions(theme, viewport, includeCabin = true) {
  const { context, page } = await makeContext(viewport, theme, true);
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click(); await settle(page, 'event:supernova-sessions');
  await capturePasses(page, viewport);
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click(); await settle(page, 'section:explore');
  if (includeCabin) {
    await page.getByRole('button', { name: 'Administrar', exact: true }).click(); await settle(page, 'section:admin');
    await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click(); await capture(page, 'cabina', 'studio', '.wizard-step-content');
  }
  await context.close();
}

async function captureCue(theme, viewport) {
  const { context, page } = await makeContext(viewport, theme, false, true);
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await settle(page, 'event:supernova-sessions');
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 30);
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).evaluate(button => button.click());
  await page.clock.runFor(320);
  const state = await snapshot(page);
  const file = `pase-cue-${theme}-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({ path: resolve(directory, file), animations: 'disabled' });
  const { frameSamples, ...metadata } = state;
  report.captures.push({ file, ...metadata, clockFrozenCueMs: 320, captureMode: 'Reloj completo pausado; sólo evidencia visual, excluida de mediciones de rendimiento.' });
  if (!state.webgl || state.webgl.contextLost || state.canvasCount !== 1 || state.cue !== 'true' || state.horizontalOverflow) throw new Error(`Cue visual inválido: ${file}`);
  console.log(JSON.stringify({ captured: file, cue: state.cue, clockFrozenCueMs: 320 }));
  await context.close();
}

function markdown() {
  const scenes = [...new Set(report.captures.map(value => value.file.split(/-(dark|light)-/)[0]))];
  const columns = ['dark-1440x900', 'light-1440x900', 'dark-390x844', 'light-390x844', 'dark-320x667', 'light-320x667'];
  const files = new Set(report.captures.map(value => value.file));
  const gallery = scenes.map(scene => `| ${scene} | ${columns.map(column => files.has(`${scene}-${column}.png`) ? `[Ver](${scene}-${column}.png)` : '—').join(' | ')} |`).join('\n');
  const resources = report.journeys.map(value => `| ${value.viewport.width} × ${value.viewport.height} | ${value.frameStats?.medianMs} / ${value.frameStats?.p95Ms} | ${value.maximumCalls} / ${value.maximumTriangles} | ${Object.entries(value.resourceRange).map(([key, range]) => `${key}: ${range.minimum}–${range.maximum}`).join('; ')} |`).join('\n');
  const small = report.captures.filter(value => value.viewport.height === 550 || value.viewport.width === 390 && value.viewport.height === 667).map(value => `[${value.viewport.width} × ${value.viewport.height}, ${value.theme}](${value.file})`).join(', ');
  const revision = report.captureRevision;
  const revisionNote = revision ? `Se conservaron ${revision.retained} capturas aprobadas y se renovaron ${revision.renewed}. Timestamps UTC: retenidas ${revision.retainedFrom ?? 'N/A'} a ${revision.retainedTo ?? 'N/A'}; renovadas ${revision.renewedFrom ?? 'N/A'} a ${revision.renewedTo ?? 'N/A'}. Cada PNG lleva capturedAt y retained en el JSON.\n\n` : '';
  return `# Capturas y mediciones · Prompt 3\n\n${report.failure ? `Revisión incompleta: ${report.failure}.` : `Revisión completada: ${report.captures.length} capturas y ${report.journeys.length} recorridos medidos.`}\n\nComando: \`node scripts/universe-final-review.mjs\`. Alcance: \`${scope}\` (variable \`UNIVERSE_FINAL_SCOPE\`). URL: \`${baseURL}\`. Chrome ${report.browser}. ${report.environment}\n\n${revisionNote}${report.previousRunAt ? `Cada recorrido lleva su timestamp; la primera revisión visual y de recursos se conserva en [revision-01/](revision-01/).\n\n` : ''}${report.captureFreeze}\n\n| Escena | Oscuro 1440 | Claro 1440 | Oscuro 390 | Claro 390 | Oscuro 320 | Claro 320 |\n|---|---|---|---|---|---|---|\n${gallery}\n\nPases con seis filas y poca altura: ${small || 'Pendiente'}.\n\n| Viewport | Frame mediano / p95 ms | Calls / triángulos máximos | Recursos tras calentamiento |\n|---|---|---|---|\n${resources}\n\n${report.frameMeasurement} ${report.resourceMeasurement}\n\nErrores JS/consola registrados: ${report.pageErrors.length + report.consoleErrors.length}. Detalles en [final-review.json](final-review.json). Las capturas históricas de prompts 1 y 2 se conservaron.\n`;
}

try {
  await mkdir(directory, { recursive: true });
  if (scope !== 'full' && existsSync(resolve(directory, 'final-review.json'))) {
    const previous = JSON.parse(await readFile(resolve(directory, 'final-review.json'), 'utf8'));
    if (scope === 'captures' || scope === 'compositions' || scope === 'passes') report.journeys = previous.journeys;
    if (scope === 'metrics') report.captures = previous.captures;
    if (scope === 'compositions') {
      report.captures = previous.captures.filter(value => !/^(cabina|pase)-/.test(value.file));
      report.retainedCapturesRecordedAt = previous.recordedAt;
    }
    if (scope === 'passes' || scope === 'final') {
      report.captures = previous.captures.filter(value => !/^pase-/.test(value.file));
      report.retainedCapturesRecordedAt = previous.recordedAt;
    }
    report.previousRunAt = previous.recordedAt;
    report.captures.forEach(capture => retainedFiles.add(capture.file));
  }
  if (scope === 'full' || scope === 'metrics' || scope === 'final') for (const viewport of viewports) await measure(viewport);
  if (scope !== 'metrics') for (const theme of ['dark', 'light']) for (const viewport of viewports) {
    if (scope === 'compositions') await captureRevisions(theme, viewport);
    else if (scope === 'passes' || scope === 'final') await captureRevisions(theme, viewport, false);
    else await captureFlow(theme, viewport);
    await captureCue(theme, viewport);
  }
  if (report.pageErrors.length || report.consoleErrors.length) throw new Error('La revisión registró errores de página o consola');
} catch (error) {
  report.failure = error instanceof Error ? error.message : String(error); process.exitCode = 1;
} finally {
  await Promise.all(report.captures.map(async capture => {
    capture.capturedAt = (await stat(resolve(directory, capture.file))).mtime.toISOString();
    capture.retained = retainedFiles.has(capture.file);
  }));
  const retained = report.captures.filter(capture => capture.retained).map(capture => capture.capturedAt).sort();
  const renewed = report.captures.filter(capture => !capture.retained).map(capture => capture.capturedAt).sort();
  report.captureRevision = { retained: retained.length, renewed: renewed.length, retainedFrom: retained[0], retainedTo: retained.at(-1), renewedFrom: renewed[0], renewedTo: renewed.at(-1), timestamps: 'UTC del archivo PNG, no del reloj de negocio simulado.' };
  await writeFile(resolve(directory, 'final-review.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(directory, 'README.md'), markdown());
  await browser.close();
  console.log(JSON.stringify({ captures: report.captures.length, journeys: report.journeys.length, failure: report.failure ?? null, report: resolve(directory, 'final-review.json') }));
}
