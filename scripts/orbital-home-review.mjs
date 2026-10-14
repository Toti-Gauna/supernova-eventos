import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseURL = process.env.ORBITAL_BASE_URL || 'http://127.0.0.1:5173/';
const directory = resolve('docs/cambios-eventos/captures-orbital');
await mkdir(directory, { recursive:true });
const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const report = { baseURL, recordedAt:new Date().toISOString(), browser:browser.version(), checks:[], captures:[], errors:[], failedRequests:[] };

async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  const state = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom } : null;
    };
    return {
      width:innerWidth,height:innerHeight,theme:document.documentElement.dataset.theme,
      experience:document.documentElement.dataset.experience,
      overflow:document.documentElement.scrollWidth > innerWidth,
      hero:box('.hero'),search:box('.hero .search-field'),preview:box('.orbit-preview-list'),planet:box('.cosmos-planet-slot'),catalog:box('#experiencias'),
      previews:[...document.querySelectorAll('.orbit-event-preview')].map(node => ({ state:node.dataset.eventState,title:node.querySelector('.orbit-event-title').textContent })),
      canvas:document.querySelector('canvas') ? { ...document.querySelector('canvas').dataset } : null,
      badImages:[...document.querySelectorAll('.orbit-event-preview img,.event-card img')].filter(node => node.complete && !node.naturalWidth).map(node => node.src),
    };
  });
  const file = `${state.experience}-${state.theme}-${state.width}-${name}.png`;
  await page.screenshot({ path:resolve(directory,file),animations:'disabled' });
  report.captures.push({ file,...state });
  if (state.overflow || state.badImages.length) throw new Error(`Layout/images failed: ${file}`);
  return state;
}

try {
  const cases = [];
  for (const version of ['3d','hibrida']) {
    for (const width of [1440,390,320]) for (const theme of ['dark','light']) cases.push({ version,width,theme });
    cases.push({ version,width:1920,theme:'dark' });
  }
  for (const width of [1440,320]) for (const theme of ['dark','light']) cases.push({ version:'original',width,theme });
  for (const { version,width,theme } of cases) {
    const context = await browser.newContext({ viewport:{ width,height:width === 320 ? 667 : width === 390 ? 844 : 900 },reducedMotion:'reduce',locale:'es-AR',timezoneId:'America/Montevideo' });
    await context.addInitScript(theme => localStorage.setItem('supernova-theme-v1',JSON.stringify(theme)),theme);
    const page = await context.newPage();
    page.on('pageerror',error => report.errors.push(error.message));
    page.on('console',message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('requestfailed',request => report.failedRequests.push({ url:request.url(),error:request.failure()?.errorText }));
    page.on('response',response => { if (response.status() >= 400) report.errors.push(`HTTP ${response.status()} ${response.url()}`); });
    await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
    await page.goto(new URL(`${version}/`,baseURL).href);
    await expect(page.getByRole('heading',{ name:/Salí de la rutina/ })).toBeVisible();
    await expect(page.getByRole('dialog',{ name:'Bienvenido a Supernova Eventos' })).toHaveCount(0);
    if (version !== 'original') {
      await page.waitForFunction(() => {
        const host = document.querySelector('[data-universe-host]');
        return host?.dataset.universeStatus === 'ready' && host.dataset.universeRequest === host.dataset.universeSettled;
      });
      await expect(page.locator('.orbit-event-preview[data-event-state="upcoming"]')).toHaveCount(2);
      await expect(page.locator('.orbit-event-preview[data-event-state="ended"]')).toHaveCount(1);
      await expect(page.locator('.hero').getByRole('textbox',{ name:'Buscar experiencias',exact:true })).toBeVisible();
    } else {
      await expect(page.locator('.hero-classic')).toBeVisible();
      await expect(page.locator('canvas,.orbit-event-preview')).toHaveCount(0);
    }
    await expect(page.getByRole('textbox',{ name:'Buscar experiencias',exact:true })).toHaveCount(1);
    await expect(page.getByRole('button',{ name:'Ver eventos',exact:true })).toBeInViewport();
    if (version !== 'original' && width <= 390) {
      const action = await page.getByRole('button',{ name:'Ver eventos',exact:true }).boundingBox();
      const navigation = await page.locator('.site-header .main-nav').boundingBox();
      if (action.y + action.height > navigation.y) throw new Error('Catalog action covered by mobile navigation');
    }
    const initial = await capture(page,'hero');
    if (initial.preview && width > 700 && (initial.preview.right >= initial.planet.x || initial.planet.height < 300)) throw new Error('Planet and agenda geometry failed');
    if (initial.preview && initial.search.bottom > initial.preview.y) throw new Error('Search must precede event list');
    const canvas = version === 'original' ? null : await page.locator('canvas').elementHandle();
    await page.getByRole('button',{ name:'Ver eventos',exact:true }).click();
    await expect(page.locator('#experiencias')).toBeFocused();
    await expect(page.locator('.site-header')).toHaveClass(/header-floating/);
    await expect(page.locator('#catalog-result-list .event-card')).toHaveCount(3);
    await capture(page,'catalogo');
    let additionalTitles = null;
    if (version !== 'original' && width === 1440 && theme === 'dark') {
      await page.getByRole('button',{ name:'Página siguiente de eventos',exact:true }).click();
      additionalTitles = await page.locator('#catalog-result-list .event-card-title').allTextContents();
      if (!additionalTitles.includes('Conexiones que importan')) throw new Error('Missing additional events');
      await capture(page,'mas-eventos');
    }
    const persistentCanvas = !canvas || await page.locator('canvas').evaluate((node,original) => node === original,canvas);
    if (!persistentCanvas) throw new Error('Canvas replaced on catalog navigation');
    report.checks.push({ version,width,theme,initial,persistentCanvas,catalogFocus:true,floatingHeader:true,additionalTitles });
    await context.close();
  }
  if (report.errors.length || report.failedRequests.length) throw new Error('Browser errors recorded');
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(directory,'orbital-review.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ checks:report.checks.length,captures:report.captures.length,errors:report.errors,failedRequests:report.failedRequests,failure:report.failure ?? null }));
}
