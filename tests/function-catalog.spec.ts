import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { INITIAL_EVENTS } from '../src/data/events';
import type { EventItem, Registration } from '../src/types';

const businessDate = new Date('2026-10-09T15:00:00Z');
const featured = INITIAL_EVENTS.find(event => event.id === 'supernova-sessions')!;
const saturday = featured.sessions![1];

async function openDemo(page: Page) {
  await page.clock.setFixedTime(businessDate);
  await page.goto('/original/');
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.getByRole('dialog', { name:'Te damos la bienvenida a Órbita' })).toHaveCount(0);
}

function sessionsCard(page: Page) {
  return page.locator('#catalog-result-list .event-card').filter({ has:page.getByRole('heading', { name:'Órbita Fest',exact:true }) });
}

test('el filtro desde una segunda función muestra su fecha y abre ese horario', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name:'Filtros',exact:true }).click();
  await page.getByLabel('Filtrar por fecha', { exact:true }).fill('2026-10-24');
  const card = sessionsCard(page);
  await expect(card).toHaveCount(1);
  await expect(card.locator('.date-badge strong')).toHaveText('24');
  await expect(card.locator('.event-meta time')).toHaveText('21:00 h');
  await expect(card.locator('.category-badge')).toContainText('2 funciones');
  await card.getByRole('button', { name:'Ver Órbita Fest',exact:true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('radio', { name:/Sábado.*24 de octubre.*21:00/ })).toBeChecked();
  await expect(modal.getByRole('radio', { name:/Viernes.*23 de octubre.*19:00/ })).toBeVisible();
});

test('el catálogo cambia de función al terminar la primera sin recargar', async ({ page }) => {
  await page.clock.install({ time:new Date('2026-10-24T01:58:00Z') });
  await page.clock.pauseAt(new Date('2026-10-24T01:58:00Z'));
  await page.addInitScript(event => localStorage.setItem('supernova-events-v1',JSON.stringify([event])), featured);
  await page.goto('/original/');
  // React's lazy host also schedules retries on this paused clock.
  await expect.poll(async () => { await page.clock.runFor(50); return page.locator('.hero').count(); }).toBe(1);
  await page.clock.pauseAt(new Date('2026-10-24T01:59:00Z'));
  await expect(page.getByRole('dialog', { name:'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  const card = sessionsCard(page);
  await expect(card.locator('.date-badge strong')).toHaveText('23');
  await expect(page.locator('.event-phase-group h3')).toHaveText('Eventos activos');
  await page.clock.runFor(60_000);
  await expect(card.locator('.date-badge strong')).toHaveText('24');
  await expect(card.locator('.event-meta time')).toHaveAttribute('datetime',saturday.date);
  await expect(card.locator('.event-meta time')).toHaveText('21:00 h');
  await expect(page.locator('.event-phase-group h3')).toHaveText('Eventos próximos');
  await expect(card.locator('.attendees')).toHaveText('Sé el primero');
});

test('el rango exacto de administración contempla una segunda función', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name:'Administrar',exact:true }).click();
  await page.getByRole('button', { name:'Más filtros',exact:true }).click();
  await page.getByLabel('Fecha desde', { exact:true }).fill('2026-10-24');
  await page.getByLabel('Fecha hasta', { exact:true }).fill('2026-10-24');
  await page.getByRole('button', { name:'Buscar',exact:true }).click();
  await expect(page.locator('.admin-event-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.admin-event-table tbody tr')).toContainText('Órbita Fest');
});

test('una card completa conserva las alternativas y no promete el pase de otra función', async ({ page }) => {
  const event: EventItem = { ...featured,registered:240,sessions:featured.sessions!.map((session,index) => ({ ...session,registered:index === 0 ? session.capacity : 0 })) };
  await page.addInitScript(value => localStorage.setItem('supernova-events-v1',JSON.stringify([value])),event);
  await openDemo(page);
  const card = sessionsCard(page);
  await expect(card.locator('.scarcity')).toHaveText('Hay otras funciones disponibles');
  await card.getByRole('button', { name:'Ver Órbita Fest',exact:true }).click();
  await expect(page.getByRole('dialog').getByRole('radio', { name:/Viernes.*19:00/ })).toBeChecked();
  await page.keyboard.press('Escape');
  const pass: Registration = { id:'qa-saturday-pass',eventId:featured.id,sessionId:saturday.id,sessionSnapshot:{ ...saturday,registered:1 },name:'Alex García',email:'alex.garcia@demo.personal.test',companions:0,createdAt:businessDate.toISOString() };
  await page.evaluate(value => localStorage.setItem('supernova-registrations-v1',JSON.stringify([value])),pass);
  await page.reload();
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.getByRole('dialog', { name:'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(card.getByRole('button', { name:'Ver funciones',exact:true })).toBeVisible();
  await expect(card.getByRole('button', { name:'Mi pase',exact:true })).toHaveCount(0);
});
