import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const directory = resolve('docs/trailer/experiencia-3d/captures-tierra');
const baseUrl = process.env.INTRO_REVIEW_BASE_URL ?? 'http://127.0.0.1:5173';
const times = [100, 900, 1100, 1200, 1800, 2400, 2750, 3250, 3650];
const viewports = [
  { width:1920, height:814 }, { width:1440, height:1000 },
  { width:390, height:844 }, { width:320, height:667 },
];
await mkdir(directory, { recursive:true });
const report = {
  recordedAt:new Date().toISOString(), baseUrl,
  clock:'Reloj Playwright instalado antes de navegar; carga inicial con movimiento reducido y replay con reloj pausado. Las poses reproducibles no miden rendimiento.',
  captures:[], contexts:[], errors:[], failures:[],
};
const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const verify = (condition, message) => { if (!condition) report.failures.push(message); };
try {
  for (const mode of [{ name:'hibrida', path:'/hibrida/' }, { name:'3d', path:'/3d/' }]) {
    for (const viewport of viewports) {
      const label = `${mode.name}-${viewport.width}x${viewport.height}`;
      const context = await browser.newContext({ viewport, reducedMotion:'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push({ label, message:error.message }));
      try {
        // Install before modules load: GSAP, performance.now and Date.now share this clock.
        await page.clock.install({ time:new Date('2026-10-13T15:00:00Z') });
        await page.goto(`${baseUrl}${mode.path}`);
        await page.waitForFunction(() => document.querySelector('[data-universe-host]')?.getAttribute('data-universe-status') === 'ready' && !document.querySelector('.intro-playing'));
        await page.waitForFunction(() => !!document.querySelector('canvas')?.dataset.universeEarthScreen);
        await page.emulateMedia({ reducedMotion:'no-preference' });
        const pauseTime = await page.evaluate(() => Date.now() + 100);
        await page.clock.pauseAt(new Date(pauseTime));
        await page.evaluate(() => {
          window.__introEarthReview = { canvas:document.querySelector('canvas'), backdrop:document.querySelector('#tour-nebula-backdrop') };
          scrollTo({ top:0, behavior:'instant' });
          const replay = document.querySelector('.footer-main>button');
          if (!replay) throw new Error('No se encontró el botón para repetir la presentación.');
          replay.click();
        });
        await page.getByRole('dialog', { name:'Bienvenido a Supernova Eventos' }).waitFor();
        let previous = 0;
        let first = null;
        for (const time of times) {
          await page.clock.runFor(time - previous);
          previous = time;
          const state = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            const map = document.querySelector('.intro-orbital-map')?.getBoundingClientRect();
            const scale = map ? Math.min(map.width / 480, map.height / 380) : null;
            const slot = document.querySelector('.cosmic-installation[data-universe-surface]')?.getBoundingClientRect();
            const fallback = document.querySelector('.universe-fallback');
            return {
              projection:canvas?.dataset.universeEarthScreen?.split(',').map(Number) ?? null,
              depth:Number(canvas?.dataset.universeEarthDepth), far:Number(canvas?.dataset.universeCameraFar),
              loaderPlanet:map ? [map.left + map.width / 2 + 60 * scale, map.top + map.height / 2 - 33 * scale, 28 * scale] : null,
              heroCenter:slot ? [slot.left + slot.width * .51, slot.top + slot.height * .46] : null,
              intro:!!document.querySelector('[data-cinematic-intro]'),
              fallbackVisibility:fallback ? getComputedStyle(fallback).visibility : null,
              orbitalOpacity:document.querySelector('.intro-orbital-system') ? getComputedStyle(document.querySelector('.intro-orbital-system')).opacity : null,
              sameCanvas:window.__introEarthReview.canvas === canvas,
              canvasCount:document.querySelectorAll('canvas').length,
              sameBackdrop:window.__introEarthReview.backdrop === document.querySelector('#tour-nebula-backdrop'),
              scrollY,
            };
          });
          const file = `${label}-${String(time).padStart(4,'0')}ms.png`;
          await page.screenshot({ path:resolve(directory,file), animations:'allow' });
          report.captures.push({ file, mode:mode.name, viewport, time, ...state });
          console.log(file);
          if (time === 100) first = state;
          const at = `${label} @ ${time} ms`;
          verify(state.projection?.length === 3 && state.projection.every(Number.isFinite), `${at}: falta proyección de Tierra`);
          verify(state.far > state.depth + 3, `${at}: Tierra queda fuera del plano lejano`);
          verify(state.sameCanvas && state.canvasCount === 1, `${at}: cambió el Canvas persistente`);
          verify(state.sameBackdrop, `${at}: cambió el fondo persistente`);
          verify(state.scrollY === 0, `${at}: el replay desplazó la página`);
          if (state.intro) verify(state.fallbackVisibility === 'hidden', `${at}: fallback visible durante intro`);
          if ([100,900,1100].includes(time)) {
            verify(state.loaderPlanet && state.projection && state.loaderPlanet.every((value,index) => Math.abs(value - state.projection[index]) <= 2), `${at}: Tierra no coincide con el SVG inicial`);
          }
          if (time === 1800) {
            verify(state.projection && first?.projection && state.projection[2] > first.projection[2] * 1.8, `${at}: acercamiento menor a 1,8×`);
            verify(state.projection && first?.projection && state.projection.slice(0,2).every((value,index) => Math.abs(value - first.projection[index]) <= 2), `${at}: deriva lateral antes de llegar al hero`);
          }
          if (time === 2400) verify(state.projection && first?.projection && state.projection[2] > first.projection[2] * 3, `${at}: acercamiento menor a 3×`);
          if (time === 3250) {
            verify(state.heroCenter && state.projection && state.heroCenter.every((value,index) => Math.abs(value - state.projection[index]) <= 3), `${at}: Tierra no llegó al espacio del hero`);
            if (viewport.width >= 768) verify(state.projection?.[2] <= 230.1, `${at}: planeta del hero demasiado grande`);
          }
          if (time === 3650) verify(!state.intro, `${at}: la intro sigue abierta`);
        }
        report.contexts.push({ label, completed:true });
      } catch (error) {
        report.errors.push({ label, message:error.message });
        report.contexts.push({ label, completed:false });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  report.passed = report.errors.length === 0 && report.failures.length === 0;
  await writeFile(resolve(directory,'review.json'), JSON.stringify(report,null,2));
  await browser.close();
}
console.log(JSON.stringify({ captures:report.captures.length, contexts:report.contexts.length, errors:report.errors.length, failures:report.failures.length }));
if (!report.passed) throw new Error(`La revisión encontró ${report.errors.length} errores y ${report.failures.length} assertions fallidas; ver review.json.`);
