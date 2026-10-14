import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseURL = process.env.HYBRID_BASE_URL || 'http://127.0.0.1:5173/';
const directory = resolve('docs/experiencia-hibrida/captures');
const quick = process.env.HYBRID_REVIEW_SCOPE === 'quick';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const report = { baseURL, recordedAt: new Date().toISOString(), browser: browser.version(), captures: [], journeys: [], pageErrors: [], consoleErrors: [], failedRequests: [] };
async function settle(page, destination) {
  await page.waitForFunction(expected => {
    const host = document.querySelector('[data-universe-host]');
    return host?.getAttribute('data-universe-status') === 'ready' && host.getAttribute('data-universe-destination') === expected
      && host.getAttribute('data-universe-request') === host.getAttribute('data-universe-settled');
  }, destination, { timeout: 20000 });
}
async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  const state = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight, theme: document.documentElement.dataset.theme,
    experience: document.documentElement.dataset.experience, overflow: document.documentElement.scrollWidth > innerWidth,
    host: document.querySelector('[data-universe-host]')?.dataset.universeDestination,
    canvas: document.querySelector('canvas') ? { ...document.querySelector('canvas').dataset } : null,
    fonts: document.fonts.status,
    internals: [...document.querySelectorAll('dialog[open],.registration-modal,.wizard-step-content')].filter(node => node.clientWidth && node.scrollWidth > node.clientWidth + 1).map(node => node.className),
  }));
  const file = `${name}-${state.theme}-${state.width}x${state.height}.png`;
  await page.screenshot({ path: resolve(directory, file), animations: 'disabled' });
  report.captures.push({ file, ...state });
  if (state.overflow || state.internals.length) throw new Error(`Overflow: ${file}`);
  console.log(file);
}
try {
  const viewports = quick ? [{ width:1440, height:900 }] : [{ width:1440, height:900 }, { width:390, height:844 }, { width:320, height:667 }];
  for (const viewport of viewports) for (const theme of quick ? ['dark'] : ['dark', 'light']) {
    const context = await browser.newContext({ viewport, reducedMotion:'no-preference', locale:'es-AR', timezoneId:'America/Montevideo' });
    await context.addInitScript(theme => {
      localStorage.setItem('supernova-theme-v1', JSON.stringify(theme));
      localStorage.setItem('supernova-universe-motion-v1', 'false');
      localStorage.setItem('supernova-favorites-v1', '["supernova-sessions"]');
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
    await page.goto(new URL('hibrida/', baseURL).href);
    await page.getByRole('heading', { name:/Salí de la rutina/ }).waitFor();
    await page.waitForFunction(() => document.querySelector('.app-shell') && !document.querySelector('.intro-playing'));
    await page.getByRole('dialog', { name:'Bienvenido a Supernova Eventos' }).waitFor({ state:'detached' });
    await settle(page, 'section:explore');
    await capture(page, '01-hero');
    if (quick) { await context.close(); continue; }
    const canvas = await page.locator('canvas').elementHandle();
    await page.getByRole('button', { name:/^Mis eventos/ }).click();
    await settle(page, 'section:registrations');
    await capture(page, '02-mis-eventos');
    await page.getByRole('button', { name:/^Favoritos/ }).click();
    await settle(page, 'section:favorites');
    await capture(page, '03-favoritos');
    await page.getByRole('button', { name:'Ver Supernova Sessions', exact:true }).click();
    await settle(page, 'event:supernova-sessions');
    await capture(page, '04-evento');
    const dialog = page.getByRole('dialog', { name:'Supernova Sessions', exact:true });
    await dialog.getByRole('checkbox', { name:'Acepto los términos y condiciones del evento.' }).check();
    await dialog.getByRole('button', { name:'Confirmar mi lugar', exact:true }).click();
    await page.getByRole('heading', { name:'Ya sos parte.', exact:true }).waitFor();
    await settle(page, 'event:supernova-sessions');
    await capture(page, '05-pase');
    await page.keyboard.press('Escape');
    await settle(page, 'section:favorites');
    await page.getByRole('button', { name:'Administrar', exact:true }).click();
    await settle(page, 'section:admin');
    await capture(page, '06-nave');
    await page.getByRole('button', { name:'Crear experiencia', exact:true }).click();
    await settle(page, 'studio');
    await capture(page, '07-cabina');
    await page.getByLabel('Nombre del evento').fill('Una nueva órbita');
    await capture(page, '08-cabina-editando');
    const persistent = await page.locator('canvas').evaluate((node, before) => node === before, canvas);
    if (!persistent) throw new Error('Canvas replaced during navigation');
    report.journeys.push({ viewport, theme, persistentCanvas: persistent, registrationCount: await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')).length) });
    await context.close();
  }
  if (report.pageErrors.length || report.consoleErrors.length || report.failedRequests.length) throw new Error('Browser errors recorded');
} finally {
  await writeFile(resolve(directory, quick ? 'quick-review.json' : 'review.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
