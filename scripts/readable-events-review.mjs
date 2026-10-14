import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseURL = process.env.READABLE_BASE_URL || 'http://127.0.0.1:4173/supernova-eventos/';
const directory = resolve('docs/cambios-eventos/captures-readability');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const report = { baseURL, recordedAt: new Date().toISOString(), browser: browser.version(), checks: [], captures: [], errors: [], failedRequests: [] };

async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const content = document.querySelector('#main-content > div');
    return !content || Number(getComputedStyle(content).opacity) >= .99;
  });
  const card = page.locator('#catalog-result-list .event-card,.favorites-grid .event-card').first();
  if (await card.count()) {
    const bounds = await card.boundingBox();
    if (bounds && bounds.y < page.viewportSize().height) await expect.poll(() => card.evaluate(element => Number(getComputedStyle(element.parentElement).opacity))).toBeGreaterThanOrEqual(.99);
  }
  await page.waitForTimeout(150);
  const state = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom } : null;
    };
    return {
      width: innerWidth, height: innerHeight, theme: document.documentElement.dataset.theme,
      experience: document.documentElement.dataset.experience, overflow: document.documentElement.scrollWidth > innerWidth,
      hero: box('.hero'), heading: box('.compact-section-heading'), planet: box('[data-universe-surface]'),
      firstEvent: box('#catalog-result-list .event-card'), myEvent: box('.my-event'),
      backdrop: document.querySelector('#tour-nebula-backdrop')?.dataset.motion,
      starCount: document.querySelector('.tour-nebula-stars')?.querySelectorAll('circle').length,
      solar: document.querySelector('canvas') ? { ...document.querySelector('canvas').dataset } : null,
      modal: document.querySelector('.registration-success') ? {
        scrollHeight:document.querySelector('.registration-success').scrollHeight,
        clientHeight:document.querySelector('.registration-success').clientHeight,
        actions:box('.success-actions'),back:box('.registration-back'),links:box('.pass-footer-links'),qr:box('.ticket-inline-qr'),
      } : null,
      badImages: [...document.images].filter(node => node.complete && !node.naturalWidth).map(node => node.src),
    };
  });
  const file = `${state.experience}-${state.theme}-${state.width}x${state.height}-${name}.png`;
  await page.screenshot({ path: resolve(directory, file), animations: 'disabled' });
  report.captures.push({ file, ...state });
  if (state.overflow || state.badImages.length) throw new Error(`Layout/images failed: ${file}`);
  return state;
}

async function arrived(page, destination) {
  const selectors = { 'section:registrations': '.my-events h1', 'section:favorites': '.favorites-heading h1', 'section:admin': '.dashboard-heading h1', 'section:profile': '.profile-page-heading h1' };
  if (selectors[destination]) await expect(page.locator(selectors[destination])).toBeVisible();
  const host = page.locator('[data-universe-host]');
  await expect(host).toHaveAttribute('data-universe-status', 'ready', { timeout: 20_000 });
  await expect(host).toHaveAttribute('data-universe-destination', destination);
  await expect.poll(async () => (await host.getAttribute('data-universe-request')) === (await host.getAttribute('data-universe-settled'))).toBe(true);
}

try {
  const cases = [];
  for (const version of ['hibrida', '3d']) {
    for (const [width, height, theme] of [[1920, 814, 'dark'], [1280, 600, 'dark'], [1440, 900, 'light'], [390, 844, 'dark'], [320, 667, 'light']]) cases.push({ version, width, height, theme });
  }
  for (const width of [1440, 320]) cases.push({ version: 'original', width, height: width === 320 ? 667 : 900, theme: 'dark' });
  for (const { version, width, height, theme } of cases) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', locale: 'es-AR', timezoneId: 'America/Montevideo' });
    await context.addInitScript(theme => {
      localStorage.setItem('supernova-theme-v1', JSON.stringify(theme));
      localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions', 'reset-mind']));
      localStorage.setItem('supernova-registrations-v1', JSON.stringify([{ id: 'SN-SOLAR-DEMO', eventId: 'supernova-sessions', sessionId: 'supernova-sessions:main', name: 'Alex García', email: 'alex@example.test', companions: 0, createdAt: '2026-10-08T12:00:00Z' }]));
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (response.status() >= 400) report.errors.push(`HTTP ${response.status()} ${response.url()}`); });
    await page.clock.setFixedTime(new Date('2026-10-13T15:00:00Z'));
    await page.goto(new URL(`${version}/`, baseURL).href);
    await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
    await expect(page.locator('.app-shell')).not.toHaveClass(/intro-playing/);
    if (version === 'original') {
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(page.locator('#tour-nebula-backdrop')).toBeHidden();
      await capture(page, 'original');
      report.checks.push({ version, width, height, theme, original: true });
      await context.close();
      continue;
    }
    await arrived(page, 'section:explore');
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('canvas')).toHaveAttribute('data-solar-body', 'earth');
    const backdrop = await page.locator('#tour-nebula-backdrop').elementHandle();
    const home = await capture(page, 'explorar');
    if (width > 700 && (home.hero.height > 510)) throw new Error(`Content below fold: ${version} ${width} ${JSON.stringify(home)}`);
    await page.getByRole('button', { name: /^Mis eventos/ }).click();
    await arrived(page, 'section:registrations');
    await expect(page.locator('canvas')).toHaveAttribute('data-solar-body', 'jupiter');
    await capture(page, 'mis-eventos');
    await page.getByRole('button', { name: 'Ver mi pase', exact: true }).click();
    await expect(page.getByRole('img', { name: 'QR de tu pase', exact: true })).toBeVisible();
    await capture(page, 'pase-con-qr');
    await page.keyboard.press('Escape');
    await arrived(page, 'section:registrations');
    await page.getByRole('button', { name: /^Favoritos/ }).click();
    await arrived(page, 'section:favorites');
    await expect(page.locator('canvas')).toHaveAttribute('data-solar-body', 'saturn');
    await capture(page, 'favoritos');
    await page.getByRole('button', { name: 'Administrar', exact: true }).click();
    await arrived(page, 'section:admin');
    await capture(page, 'admin');
    await page.getByRole('button', { name: 'Registrar pase', exact: true }).click();
    const validation = page.getByRole('dialog', { name: 'Registrar pase', exact: true });
    await expect(validation).toBeVisible();
    await validation.getByRole('textbox').fill('SN-SOLAR-DEMO');
    await validation.getByRole('button', { name: 'Validar pase', exact: true }).click();
    await expect(validation.getByRole('heading', { name: 'Pase v' + String.fromCharCode(225) + 'lido', exact: true })).toBeVisible();
    await capture(page, 'registrar-pase');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Abrir perfil de Alex García', exact: true }).click();
    await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
    await arrived(page, 'section:profile');
    await expect(page.locator('canvas')).toHaveAttribute('data-solar-body', 'neptune');
    await capture(page, 'perfil');
    const sameBackdrop = await page.locator('#tour-nebula-backdrop').evaluate((node, original) => node === original, backdrop);
    if (!sameBackdrop) throw new Error('Backdrop replaced during navigation');
    report.checks.push({ version, width, height, theme, sameBackdrop, home });
    await context.close();
  }
  if (report.errors.length || report.failedRequests.length) throw new Error('Browser errors recorded');
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(directory, 'readable-review.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, errors: report.errors, failedRequests: report.failedRequests, failure: report.failure ?? null }));
}
