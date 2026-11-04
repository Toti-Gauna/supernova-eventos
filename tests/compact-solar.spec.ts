import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { INITIAL_EVENTS } from '../src/data/events';
import type { Registration } from '../src/types';

const businessDate = new Date('2026-10-09T15:00:00Z');
const featured = INITIAL_EVENTS.find(event => event.id === 'supernova-sessions')!;
const firstSession = featured.sessions![0];
const pass: Registration = {
  id: 'SN-COMPACT-QA', eventId: featured.id, sessionId: firstSession.id,
  sessionSnapshot: firstSession, name: 'Alex García', email: 'alex.garcia@demo.personal.test',
  companions: 0, createdAt: businessDate.toISOString(),
};

async function seedPersonalPlans(page: Page) {
  await page.addInitScript(registration => {
    localStorage.setItem('supernova-registrations-v1', JSON.stringify([registration]));
    localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions']));
  }, pass);
}

async function expectSettled(host: Locator, destination: string) {
  await expect(host).toHaveAttribute('data-universe-status', 'ready', { timeout: 20_000 });
  await expect(host).toHaveAttribute('data-universe-destination', destination);
  const request = await host.getAttribute('data-universe-request');
  expect(request).not.toBeNull();
  await expect(host).toHaveAttribute('data-universe-settled', request!, { timeout: 15_000 });
  await expect(host).toHaveAttribute('data-universe-travelling', 'false');
  const viewSelectors: Record<string, string> = {
    'section:explore': '.hero-orbital', 'section:registrations': '.my-events',
    'section:favorites': '.favorites-page .agenda-head', 'section:profile': '.profile-page-heading',
    'section:admin': '.dashboard-heading',
  };
  const selector = viewSelectors[destination];
  if (selector) {
    const view = host.page().locator(selector);
    await expect(view).toBeVisible();
    // The request can settle before AnimatePresence mounts and reveals the next page.
    await expect.poll(() => view.evaluate(element => getComputedStyle(element.closest('#main-content > div') || element).opacity)).toBe('1');
  }
  // Allow the measured DOM slot to reach the camera after its Resize/MutationObserver.
  await host.page().evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

async function openHome(page: Page, version: 'hibrida' | '3d', motion: 'reduce' | 'no-preference' = 'reduce') {
  await page.clock.setFixedTime(businessDate);
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto(`/${version}/`);
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  const host = page.locator('[data-universe-host]');
  await expectSettled(host, 'section:explore');
  return host;
}

async function openProfile(page: Page, host: Locator) {
  await page.getByRole('button', { name: 'Abrir perfil de Alex García', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
  await expectSettled(host, 'section:profile');
}

async function expectArtSide(page: Page, headingSelector: string, side: 'left' | 'right', contentSelector: string) {
  const heading = page.locator(headingSelector);
  const surface = heading.locator('[data-universe-surface]');
  await expect(surface).toHaveAttribute('data-universe-side', side);
  await expect(surface).toHaveAttribute('data-universe-composition', 'section-compact');
  const art = await surface.boundingBox();
  const content = await heading.locator(contentSelector).boundingBox();
  const header = await heading.boundingBox();
  expect(art).not.toBeNull();
  expect(content).not.toBeNull();
  expect(header!.height).toBeGreaterThanOrEqual(110);
  expect(header!.height).toBeLessThanOrEqual(140);
  expect(art!.width).toBe(150);
  if (side === 'left') expect(art!.x + art!.width).toBeLessThanOrEqual(content!.x);
  else expect(content!.x + content!.width).toBeLessThanOrEqual(art!.x);
}

async function motionSample(background: Locator, canvas: Locator) {
  return {
    frame: Number(await background.getAttribute('data-frame')),
    phase: Number(await canvas.getAttribute('data-solar-animation-phase')),
  };
}

async function expectFrozen(background: Locator, canvas: Locator) {
  await expect(canvas).toHaveAttribute('data-solar-animation-running', 'false');
  const frozen = await motionSample(background, canvas);
  // Cover multiple publication intervals, rather than a single still frame.
  await background.page().waitForTimeout(900);
  expect(await motionSample(background, canvas)).toEqual(frozen);
}

for (const version of ['hibrida', '3d'] as const) {
  test(`${version}: la nave se encuadra en el encabezado de Admin al entrar y redimensionar`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    const host = await openHome(page, version);
    await page.getByRole('button', { name: 'Administrar', exact: true }).click();
    await expectSettled(host, 'section:admin');
    for (const viewport of [{ width: 1280, height: 600 }, { width: 320, height: 667 }]) {
      await page.setViewportSize(viewport);
      const surface = page.locator('.dashboard-heading [data-universe-surface]');
      await expect(surface).toHaveAttribute('data-universe-side', 'left');
      // Read the actual Three projection, not just the DOM placeholder. A camera tilt
      // used to place the ship over the filters despite the correctly measured slot.
      await expect.poll(async () => {
        const bounds = await surface.boundingBox();
        const projected = await host.locator('canvas').getAttribute('data-universe-body-screen');
        if (!bounds || !projected) return Infinity;
        const [x, y] = projected.split(',').map(Number);
        return Math.hypot(x - (bounds.x + bounds.width * .51), y - (bounds.y + bounds.height * .46));
      }).toBeLessThan(2);
      await expect(page.getByRole('button', { name: 'Registrar pase', exact: true })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });

  test(`${version}: hero legible en 1280×600 y planetas alternados en encabezados compactos`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await seedPersonalPlans(page);
    const host = await openHome(page, version);
    const canvas = host.locator('canvas');
    const hero = await page.locator('.hero-orbital').boundingBox();
    expect(hero).not.toBeNull();
    expect(hero!.height).toBeGreaterThanOrEqual(440);
    expect(hero!.height).toBeLessThanOrEqual(490);
    await expect(page.locator('.cosmos-planet-slot')).toHaveAttribute('data-universe-side', 'right');
    await expect(canvas).toHaveAttribute('data-solar-body', 'earth');
    await expect(canvas).toHaveAttribute('data-solar-label', 'Tierra');
    await expect(page.locator('.orbit-event-preview')).toHaveCount(3);
    await expect(page.locator('.orbit-event-preview[data-preview-kind="available"]')).toHaveCount(2);
    await expect(page.locator('.orbit-event-preview[data-preview-kind="registered"]')).toHaveCount(1);
    await expect(page.locator('.hero .cosmos-ticket')).toBeHidden();
    for (const row of await page.locator('.orbit-event-preview').all()) {
      const bounds = await row.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(90);
      expect(bounds!.height).toBeLessThanOrEqual(104);
      await expect(row).toBeInViewport();
      const image = await row.locator('img').boundingBox();
      expect(image!.width).toBeGreaterThanOrEqual(64);
      expect(image!.width).toBeLessThanOrEqual(80);
      expect(await row.locator('.orbit-event-title').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(17);
      expect(await row.locator('.orbit-event-meta').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(13);
      for (const button of await row.getByRole('button').all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page.getByRole('button', { name: 'Ver eventos', exact: true }).click();
    await expect(page.locator('#experiencias')).toBeFocused();
    await expect(page.locator('#experiencias .event-card').first()).toBeInViewport();
    await page.getByRole('button', { name: /^Mis eventos/ }).click();
    await expect(page.getByRole('heading', { name: 'Mis eventos', exact: true })).toBeVisible();
    await expectSettled(host, 'section:registrations');
    await expect(canvas).toHaveAttribute('data-solar-body', 'jupiter');
    await expect(canvas).toHaveAttribute('data-solar-label', 'Júpiter');
    await expect(canvas).toHaveAttribute('data-solar-moon-count', '4');
    await expectArtSide(page, '.my-events .agenda-head', 'left', '.agenda-title');
    await expect(page.getByRole('button', { name: 'Ver mi pase', exact: true })).toBeInViewport();
    await page.getByRole('button', { name: /^Favoritos/ }).click();
    await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
    await expectSettled(host, 'section:favorites');
    await expect(canvas).toHaveAttribute('data-solar-body', 'saturn');
    await expect(canvas).toHaveAttribute('data-solar-label', 'Saturno');
    await expectArtSide(page, '.favorites-page .agenda-head', 'right', '.agenda-tools');
    await expect(page.locator('.favorites-grid .event-card').first()).toBeInViewport();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test('el fondo Tour del primer HTML conserva el mismo nodo durante intro, secciones, evento y scroll', async ({ page }) => {
  await page.clock.setFixedTime(businessDate);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await seedPersonalPlans(page);
  const htmlResponse = await page.request.get('/hibrida/');
  expect(await htmlResponse.text()).toContain('id="tour-nebula-backdrop"');
  await page.addInitScript(() => {
    const state = window as Window & { __qaFirstTourBackground?: Element; __qaIntroSharesTour?: boolean };
    const remember = () => {
      const background = document.getElementById('tour-nebula-backdrop');
      if (background && !state.__qaFirstTourBackground) {
        state.__qaFirstTourBackground = background;
      }
      if (document.querySelector('#intro-bootstrap, [data-cinematic-intro][role="dialog"]')) {
        state.__qaIntroSharesTour = !!background && background === state.__qaFirstTourBackground;
        observer.disconnect();
      }
    };
    const observer = new MutationObserver(remember);
    observer.observe(document, { childList: true, subtree: true });
    remember();
  });
  await page.goto('/hibrida/', { waitUntil: 'domcontentloaded' });
  const background = page.locator('#tour-nebula-backdrop');
  await expect(background).toHaveCount(1);
  await expect(background).toHaveAttribute('data-star-count', '60');
  await expect(background.locator('svg.tour-nebula-stars > circle')).toHaveCount(60);
  await expect(background.locator('.tour-nebula-particles > span.tour-nebula-particle')).toHaveCount(7);
  expect(await background.evaluate(element => !element.closest('#root'))).toBe(true);
  const sameFirstNode = () => background.evaluate(element => element === (window as Window & { __qaFirstTourBackground?: Element }).__qaFirstTourBackground);
  // Observe the first loading frame in-page. On a cold dev build its deadline can
  // elapse before React mounts, but the static bootstrap must share the same sky.
  await expect.poll(() => page.evaluate(() => (window as Window & { __qaIntroSharesTour?: boolean }).__qaIntroSharesTour)).toBe(true);
  expect(await sameFirstNode()).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  const host = page.locator('[data-universe-host]');
  await expectSettled(host, 'section:explore');
  const canvas = await host.locator('canvas').elementHandle();
  expect(canvas).not.toBeNull();
  for (const destination of [
    { label: /^Mis eventos/, value: 'section:registrations' },
    { label: /^Favoritos/, value: 'section:favorites' },
  ]) {
    await page.getByRole('button', { name: destination.label }).click();
    await expectSettled(host, destination.value);
    expect(await sameFirstNode()).toBe(true);
  }
  await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
  const ticketDialog = page.getByRole('dialog', { name: 'Ya sos parte.', exact: true });
  await expect(ticketDialog).toBeVisible();
  await expect(ticketDialog.getByText(pass.id, { exact: true })).toBeVisible();
  await expectSettled(host, 'event:supernova-sessions');
  expect(await sameFirstNode()).toBe(true);
  await page.keyboard.press('Escape');
  await expectSettled(host, 'section:favorites');
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  expect(await sameFirstNode()).toBe(true);
  await expect(page.locator('#tour-nebula-backdrop')).toHaveCount(1);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
});

for (const version of ['hibrida', '3d'] as const) {
  test(`${version}: fondo y planeta avanzan, respetan pausa y reduced, y el fondo sigue al bajar`, async ({ page }) => {
    const host = await openHome(page, version, 'no-preference');
    const canvas = host.locator('canvas');
    const background = page.locator('#tour-nebula-backdrop');
    await expect(background).toHaveAttribute('data-motion', 'running');
    await expect(background).toHaveAttribute('data-frame', /^\d+$/);
    await expect(canvas).toHaveAttribute('data-solar-animation-running', 'true');
    const initial = await motionSample(background, canvas);
    await expect.poll(async () => Number(await background.getAttribute('data-frame'))).toBeGreaterThan(initial.frame);
    await expect.poll(async () => Number(await canvas.getAttribute('data-solar-animation-phase'))).toBeGreaterThan(initial.phase);
    await openProfile(page, host);
    await page.getByRole('button', { name: 'Pausar movimiento', exact: true }).click();
    await expect(background).toHaveAttribute('data-motion', 'paused');
    await expectFrozen(background, canvas);
    await page.getByRole('button', { name: 'Reanudar movimiento', exact: true }).click();
    await expect(background).toHaveAttribute('data-motion', 'running');
    await page.getByRole('button', { name: 'Explorar', exact: true }).click();
    await expectSettled(host, 'section:explore');
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(host).toHaveAttribute('data-universe-paused', 'true');
    await expect(canvas).toHaveAttribute('data-solar-animation-running', 'false');
    await expect(background).toHaveAttribute('data-motion', 'running');
    const offscreen = await motionSample(background, canvas);
    await expect.poll(async () => Number(await background.getAttribute('data-frame'))).toBeGreaterThan(offscreen.frame);
    expect(Number(await canvas.getAttribute('data-solar-animation-phase'))).toBe(offscreen.phase);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(host).toHaveAttribute('data-universe-paused', 'false');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(background).toHaveAttribute('data-motion', 'reduced');
    await expectFrozen(background, canvas);
  });
}
