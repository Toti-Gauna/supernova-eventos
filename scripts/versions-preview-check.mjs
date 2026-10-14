import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const baseURL = 'http://127.0.0.1:4173/supernova-eventos/';
const directory = resolve('docs/experiencia-hibrida/captures/preview');
await mkdir(directory, { recursive:true });
const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const report = { baseURL, recordedAt:new Date().toISOString(), browser:browser.version(), checks:[], errors:[], failedRequests:[] };
try {
  for (const width of [1440,390,320]) for (const theme of ['dark','light']) for (const version of ['original','3d','hibrida']) {
    const context = await browser.newContext({ viewport:{ width,height:width === 320 ? 667 : 900 }, reducedMotion:'reduce', locale:'es-AR', timezoneId:'America/Montevideo' });
    await context.addInitScript(theme => localStorage.setItem('supernova-theme-v1',JSON.stringify(theme)), theme);
    const page = await context.newPage();
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('requestfailed', request => report.failedRequests.push(request.url()));
    await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
    const response = await page.goto(`${baseURL}${version}/`);
    await page.getByRole('heading',{ name:/Salí de la rutina/ }).waitFor();
    await page.waitForFunction(() => !document.querySelector('.intro-playing,[data-cinematic-intro]'));
    if (version !== 'original') await page.waitForFunction(() => document.querySelector('[data-universe-host]')?.getAttribute('data-universe-status') === 'ready');
    await page.evaluate(() => document.fonts.ready);
    const state = await page.evaluate(() => ({
      version:document.documentElement.dataset.experience, canvas:document.querySelectorAll('canvas').length,
      overflow:document.documentElement.scrollWidth > innerWidth,
      body:getComputedStyle(document.body).backgroundColor,
      theme:document.documentElement.dataset.theme,
      fonts:document.fonts.status,
      images:[...document.querySelectorAll('img')].map(image => image.src),
    }));
    if (response.status() !== 200 || state.overflow || state.canvas !== (version === 'original' ? 0 : 1) || state.fonts !== 'loaded') throw new Error(`Invalid ${version}/${theme}/${width}`);
    if (requests.some(url => url.startsWith('http://127.0.0.1:4173/') && !url.startsWith(baseURL))) throw new Error('Asset escaped production prefix');
    if (state.images.some(url => !url.startsWith(`${baseURL}images/`) && !url.startsWith('data:'))) throw new Error('Invalid image prefix');
    if (version === 'original' && requests.some(url => /UniverseExperience|HybridExperience|TravelParticles/.test(url))) throw new Error('Original downloaded Three engine');
    const file = `${version}-${theme}-${width}.png`;
    await page.screenshot({ path:resolve(directory,file), animations:'disabled' });
    const result = { version,theme,width,file,...state,assetCount:requests.length,registration:false };
    if (version === 'original') {
      await page.getByRole('button',{ name:'Ver Supernova Sessions',exact:true }).click();
      const dialog = page.getByRole('dialog',{ name:'Supernova Sessions',exact:true });
      await dialog.getByRole('checkbox',{ name:'Acepto los términos y condiciones del evento.' }).check();
      await dialog.getByRole('button',{ name:'Confirmar mi lugar',exact:true }).click();
      await page.getByRole('heading',{ name:'Ya sos parte.',exact:true }).waitFor();
      await page.screenshot({ path:resolve(directory,`pase-${file}`), animations:'disabled' });
      result.registration = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')).length === 1);
      if (!result.registration) throw new Error('Original registration failed');
      await page.keyboard.press('Escape');
    }
    report.checks.push(result);
    console.log(`${version}/${theme}/${width}: OK`);
    await context.close();
  }
  if (report.errors.length || report.failedRequests.length) throw new Error('Browser errors recorded');
} finally {
  await writeFile(resolve(directory,'review.json'),JSON.stringify(report,null,2));
  await browser.close();
}
