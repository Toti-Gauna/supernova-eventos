import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseURL = process.env.NAVIGATION_BASE_URL || 'http://127.0.0.1:5173/';
const directory = resolve('docs/cambios-eventos/captures-navigation');
await mkdir(directory, { recursive:true });
const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const report = { baseURL, recordedAt:new Date().toISOString(), browser:browser.version(), checks:[], errors:[], failedRequests:[] };

async function bounds(page) {
  return page.evaluate(() => {
    const box = selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return { x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom }; };
    return { hero:box('.hero'),catalog:box('#experiencias'),header:box('.header-inner'),actions:box('.header-actions'),switcher:box('.version-switcher-button'),overflow:document.documentElement.scrollWidth > innerWidth };
  });
}

try {
  for (const width of [1440,390,320]) for (const version of ['original','3d','hibrida']) {
    const context = await browser.newContext({ viewport:{ width,height:width === 320 ? 667 : 900 }, reducedMotion:'reduce',locale:'es-AR',timezoneId:'America/Montevideo' });
    await context.addInitScript(() => localStorage.setItem('supernova-theme-v1', JSON.stringify('dark')));
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('requestfailed', request => report.failedRequests.push({ url:request.url(),error:request.failure()?.errorText }));
    await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
    await page.goto(`${baseURL}${version}/`);
    await page.waitForFunction(() => !document.querySelector('.intro-playing,[data-cinematic-intro]'));
    await page.getByRole('heading', { name:/Salí de la rutina/ }).waitFor();
    if (version !== 'original') await page.waitForFunction(() => document.querySelector('[data-universe-host]')?.dataset.universeStatus === 'ready');
    await page.evaluate(() => document.fonts.ready);
    const initial = await bounds(page);
    if (initial.overflow || initial.actions.right > width || initial.actions.x < initial.header.x || initial.switcher.x < 0 || initial.switcher.right > width) throw new Error(`Overflow ${version}/${width}: ${JSON.stringify(initial)}`);
    await expect(page.getByRole('button', { name:'Ver eventos',exact:true })).toBeInViewport();
    await page.screenshot({ path:resolve(directory,`${version}-${width}-hero.png`),animations:'disabled' });
    const trigger = page.getByRole('button', { name:'Cambiar versión',exact:true });
    await trigger.click();
    const menu = page.locator('.version-switcher-popover:popover-open');
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    const links = await menu.locator('nav>a').evaluateAll(nodes => nodes.map(node => ({ label:node.querySelector('strong').textContent,href:node.getAttribute('href'),current:node.getAttribute('aria-current') })));
    if (links.length !== 3 || links.filter(link => link.current === 'page').length !== 1) throw new Error('Invalid version links');
    await menu.locator('nav>a').first().focus();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded','false');
    await page.getByRole('button', { name:'Ver eventos',exact:true }).click();
    await expect(page.locator('#experiencias')).toBeFocused();
    await expect(page.locator('.site-header')).toHaveClass(/header-floating/);
    await trigger.click();
    await expect(menu).toBeVisible();
    const floating = await bounds(page);
    const menuBox = await menu.boundingBox();
    if (!menuBox || menuBox.x < 0 || menuBox.x + menuBox.width > width) throw new Error('Floating menu overflow');
    await page.screenshot({ path:resolve(directory,`${version}-${width}-versiones.png`),animations:'disabled' });
    await menu.getByRole('button', { name:'Cerrar versiones',exact:true }).click();
    await expect(trigger).toBeFocused();
    report.checks.push({ version,width,initial,floating,menuBox,links,escapeFocus:true,closeFocus:true,catalogFocus:true,floatingHeader:true });
    await context.close();
  }
  if (report.errors.length || report.failedRequests.length) throw new Error('Browser errors occurred');
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(directory,'navigation-review.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ checks:report.checks.length,errors:report.errors,failedRequests:report.failedRequests,failure:report.failure ?? null }));
}
