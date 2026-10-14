import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { INITIAL_EVENTS } from '../src/data/events';
import type { Registration } from '../src/types';

const featured = INITIAL_EVENTS.find(event => event.id === 'supernova-sessions')!;
const friday = featured.sessions![0];
const saturday = featured.sessions![1];
const pass: Registration = {
  id:'SN-ORBIT-QA', eventId:featured.id, sessionId:friday.id, sessionSnapshot:friday,
  name:'Alex García', email:'alex.garcia@demo.telefonica.test', companions:0, createdAt:'2026-10-09T15:00:00Z',
};

async function seedPass(page: Page) {
  await page.addInitScript(registration => localStorage.setItem('supernova-registrations-v1', JSON.stringify([registration])), pass);
}

async function openHome(page: Page, version = 'hibrida') {
  await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
  await page.goto(`/${version}/`);
  const heading = page.getByRole('heading', { name:/Salí de la rutina/ });
  await expect(heading).toBeVisible();
  await expect(page.getByRole('dialog', { name:'Bienvenido a Supernova Eventos' })).toHaveCount(0);
  if (version !== 'original') await page.waitForFunction(() => {
    const host = document.querySelector<HTMLElement>('[data-universe-host]');
    return host?.dataset.universeStatus === 'ready' && host.dataset.universeRequest === host.dataset.universeSettled;
  });
  await expect.poll(() => heading.evaluate(element => getComputedStyle(element.closest('#main-content > div') || element).opacity)).toBe('1');
}

test('el hero ofrece dos funciones disponibles y una reserva real con Mi pase, con búsqueda compartida', async ({ page }) => {
  await seedPass(page);
  await openHome(page);
  const previews = page.locator('.orbit-preview-list');
  const available = previews.locator('[data-preview-kind="available"]');
  const registered = previews.locator('[data-preview-kind="registered"]');
  await expect(previews.locator('.orbit-event-preview')).toHaveCount(3);
  await expect(available).toHaveCount(2);
  await expect(registered).toHaveCount(1);
  await expect(previews.locator('[data-event-state="ended"]')).toHaveCount(0);
  await expect(registered).toHaveAttribute('data-session-id', friday.id);
  await expect(previews.locator(`[data-preview-kind="available"][data-session-id="${friday.id}"]`)).toHaveCount(0);
  const list = await previews.boundingBox();
  const planet = await page.locator('.cosmos-planet-slot').boundingBox();
  const scene = await page.locator('.hero-orbital-universe .cosmic-scene').boundingBox();
  expect(list).not.toBeNull();
  expect(planet).not.toBeNull();
  expect(list!.x + list!.width).toBeLessThan(planet!.x);
  expect(list!.width).toBeGreaterThan(planet!.width * 2);
  expect(scene!.height).toBeGreaterThanOrEqual(180);
  expect(scene!.height).toBeLessThanOrEqual(230);
  expect(planet!.height).toBeGreaterThanOrEqual(180);
  expect(planet!.height).toBeLessThanOrEqual(230);
  await expect(page.getByRole('textbox', { name:'Buscar experiencias',exact:true })).toHaveCount(1);
  const search = page.locator('.hero').getByRole('textbox', { name:'Buscar experiencias',exact:true });
  await search.fill('Supernova Sessions');
  await expect(available).toHaveCount(1);
  await expect(available).toHaveAttribute('data-session-id', saturday.id);
  await expect(registered).toHaveCount(1);
  await expect(page.locator('#catalog-result-list .event-card')).toHaveCount(1);
  const reserve = available.getByRole('button', { name:/^Anotarme:/ });
  await reserve.click();
  const modal = page.getByRole('dialog', { name:'Supernova Sessions',exact:true });
  await expect(modal.getByRole('radio', { name:/Sábado.*21:00/ })).toBeChecked();
  await expect(modal.getByRole('button', { name:'Confirmar mi lugar',exact:true })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(reserve).toBeFocused();
  await registered.getByRole('button', { name:/^Mi pase:/ }).click();
  const ticketDialog = page.getByRole('dialog', { name:'Ya sos parte.',exact:true });
  await expect(ticketDialog.getByRole('heading', { name:'Ya sos parte.',exact:true })).toBeVisible();
  const registrations = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1') || '[]'));
  expect(registrations).toHaveLength(1);
  expect(registrations[0]).toMatchObject({ id:pass.id, sessionId:friday.id });
});

test('sin reserva el hero lo indica y el archivo sigue consultable en el catálogo con inscripción cerrada', async ({ page }) => {
  await openHome(page,'3d');
  await expect(page.locator('.orbit-event-preview[data-preview-kind="available"]')).toHaveCount(2);
  await expect(page.locator('.orbit-event-preview[data-preview-kind="registered"]')).toHaveCount(0);
  await expect(page.getByText('Todavía no tenés una próxima función reservada.', { exact:true })).toBeVisible();
  await page.getByRole('textbox', { name:'Buscar experiencias',exact:true }).fill('Bajo la misma órbita');
  await expect(page.locator('.orbit-event-preview')).toHaveCount(0);
  await expect(page.getByText('No hay funciones disponibles con estos filtros.', { exact:true })).toBeVisible();
  const expired = page.getByRole('button', { name:'Ver Bajo la misma órbita',exact:true });
  await expired.click();
  const modal = page.getByRole('dialog', { name:'Bajo la misma órbita',exact:true });
  await expect(modal).toBeVisible();
  await expect(modal.getByText(/La inscripción .* cerrada/)).toBeVisible();
  await expect(modal.getByRole('button', { name:'Confirmar mi lugar',exact:true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(expired).toBeFocused();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1') || '[]'))).toEqual([]);
});

test('las funciones completas o terminadas no ocupan las recomendaciones disponibles', async ({ page }) => {
  const events = INITIAL_EVENTS.map(event => event.id === featured.id ? {
    ...event, sessions:event.sessions!.map(session => session.id === friday.id
      ? { ...session, registered:session.capacity }
      : { ...session, date:'2026-10-07T19:00:00-03:00', endDate:'2026-10-07T23:00:00-03:00' }),
  } : event.id === 'reset-mind' ? { ...event, registered:event.capacity } : event);
  await page.addInitScript(value => localStorage.setItem('supernova-events-v1', JSON.stringify(value)), events);
  await openHome(page);
  const available = page.locator('.orbit-event-preview[data-preview-kind="available"]');
  await expect(available).toHaveCount(2);
  expect(await available.evaluateAll(rows => rows.map(row => row.getAttribute('data-event-id')))).toEqual(['next-frontier','connection-day']);
  await page.getByRole('textbox', { name:'Buscar experiencias',exact:true }).fill(featured.title);
  await expect(available).toHaveCount(0);
  await expect(page.getByText('No hay funciones disponibles con estos filtros.', { exact:true })).toBeVisible();
  await expect(page.locator('.orbit-event-preview[data-preview-kind="registered"]')).toHaveCount(0);
});

test('las filas legibles funcionan a 320px y Original conserva su composición clásica', async ({ page }) => {
  await page.setViewportSize({ width:320,height:667 });
  await seedPass(page);
  await openHome(page);
  await expect(page.locator('.hero-orbital')).toBeVisible();
  await expect(page.locator('.orbit-event-preview')).toHaveCount(3);
  await expect(page.getByRole('button', { name:'Ver eventos',exact:true })).toBeInViewport();
  const action = await page.getByRole('button', { name:'Ver eventos',exact:true }).boundingBox();
  const navigation = await page.locator('.site-header .main-nav').boundingBox();
  expect(action!.y + action!.height).toBeLessThan(navigation!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  for (const row of await page.locator('.orbit-event-preview').all()) {
    const box = await row.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    expect(box!.height).toBeGreaterThanOrEqual(88);
    expect(box!.height).toBeLessThanOrEqual(96);
    await expect(row.locator('img')).toBeVisible();
    expect(await row.locator('.orbit-event-title').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(17);
    await expect(row.locator('.orbit-event-title')).toHaveAttribute('title', /.+/);
  }
  await page.getByRole('heading', { name:/Salí de la rutina/ }).click();
  await page.keyboard.press('/');
  await expect(page.getByRole('textbox', { name:'Buscar experiencias',exact:true })).toBeFocused();
  await page.getByRole('button', { name:'Ver eventos',exact:true }).click();
  await expect(page.locator('#experiencias')).toBeFocused();
  await openHome(page,'original');
  await expect(page.locator('.hero-classic')).toBeVisible();
  await expect(page.locator('.orbit-event-preview')).toHaveCount(0);
  await expect(page.locator('.hero .search-field')).toHaveCount(0);
  await expect(page.locator('#experiencias').getByRole('textbox', { name:'Buscar experiencias',exact:true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});
