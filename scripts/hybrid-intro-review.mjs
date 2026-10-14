import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const directory = resolve('docs/experiencia-hibrida/captures/intro');
await mkdir(directory, { recursive:true });
const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const report = { recordedAt:new Date().toISOString(), clock:'Reloj Playwright pausado y avanzado para capturar poses reproducibles; no son mediciones de rendimiento.', captures:[], errors:[] };
try {
  for (const viewport of [{ width:1440, height:900 }, { width:390, height:844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion:'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/hibrida/');
    await page.waitForFunction(() => document.querySelector('[data-universe-host]')?.getAttribute('data-universe-status') === 'ready' && !document.querySelector('.intro-playing'));
    await page.emulateMedia({ reducedMotion:'no-preference' });
    const clock = new Date('2026-10-09T15:00:00Z');
    await page.clock.install({ time:clock });
    await page.clock.pauseAt(new Date(clock.getTime() + 1000));
    // Replay the warmed opening from the hero without scrolling to the footer.
    await page.evaluate(() => {
      scrollTo({ top:0, behavior:'instant' });
      document.querySelector('.footer-main>button')?.click();
    });
    await page.getByRole('dialog', { name:'Bienvenido a Supernova Eventos' }).waitFor();
    let previous = 0;
    for (const time of [100, 1000, 1400, 1800, 2150, 2500, 2850, 3250, 3650]) {
      await page.clock.runFor(time - previous); previous = time;
      const state = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const map = document.querySelector('.intro-orbital-map')?.getBoundingClientRect();
        const scale = map ? Math.min(map.width / 480, map.height / 380) : null;
        const projection = canvas?.dataset.hybridHero?.split(',').map(Number);
        return { canvas:{ ...canvas?.dataset }, intro:!!document.querySelector('[data-cinematic-intro]'),
          loaderPlanet:map ? [map.left + map.width / 2 + 60 * scale, map.top + map.height / 2 - 33 * scale, 28 * scale] : null,
          projection, camera:canvas?.dataset.hybridCamera };
      });
      const file = `carga-${viewport.width}-${String(time).padStart(4,'0')}ms.png`;
      await page.screenshot({ path:resolve(directory,file), animations:'allow' });
      report.captures.push({ file, viewport, time, ...state });
      console.log(file);
      if (time === 1400 && state.loaderPlanet && state.projection && state.loaderPlanet.some((value,index) => Math.abs(value - state.projection[index]) > 2)) throw new Error(`Loader and camera are misaligned: ${viewport.width}`);
    }
    await context.close();
  }
} finally {
  await writeFile(resolve(directory,'review.json'), JSON.stringify(report,null,2));
  await browser.close();
}
