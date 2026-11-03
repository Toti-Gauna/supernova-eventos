import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ARCHIVED_EVENT, DEMO_ARCHIVE_MIGRATION_KEY, INITIAL_EVENTS } from '../src/data/events';
import type { EventItem } from '../src/types';

const storageKey = 'supernova-events-v1';
const businessDate = new Date('2026-10-09T15:00:00Z');
const oldSeed = INITIAL_EVENTS.filter(event => event.id !== ARCHIVED_EVENT.id).map(event => {
  const { sessions, ...legacy } = event;
  return sessions?.length ? { ...legacy, capacity: sessions[0].capacity, registered: sessions[0].registered, endDate: sessions[0].endDate } : legacy;
});

async function seedOnce(page: Page, events: EventItem[]) {
  await page.addInitScript(({ events, storageKey, migrationKey }) => {
    if (localStorage.getItem(storageKey) !== null) return;
    localStorage.setItem(storageKey, JSON.stringify(events));
    localStorage.removeItem(migrationKey);
  }, { events, storageKey, migrationKey: DEMO_ARCHIVE_MIGRATION_KEY });
}

async function openDemo(page: Page, path: string) {
  await page.clock.setFixedTime(businessDate);
  await page.goto(path);
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.locator('.hero')).toBeVisible();
}

async function storedEvents(page: Page): Promise<EventItem[]> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]') as EventItem[], storageKey);
}

for (const version of ['original', '3d', 'hibrida']) {
  test(`${version}: agrega el archivo al seed antiguo una vez y conserva todas las ediciones`, async ({ page }) => {
    const edited = { ...oldSeed[0], title: 'Sessions editadas localmente', description: 'Esta descripción personalizada debe conservarse cuando se amplíe el archivo de la demo.', registered: 190 };
    const fixture = [edited, ...oldSeed.slice(1)];
    await seedOnce(page, fixture);
    await openDemo(page, `/${version}/`);
    await expect.poll(async () => (await storedEvents(page)).length).toBe(7);
    const migrated = await storedEvents(page);
    expect(migrated.filter(event => event.id === ARCHIVED_EVENT.id)).toHaveLength(1);
    expect(migrated.find(event => event.id === edited.id)).toEqual(edited);
    expect(migrated.filter(event => event.id !== ARCHIVED_EVENT.id)).toEqual(fixture);
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'false'), DEMO_ARCHIVE_MIGRATION_KEY)).toBe(true);
    await page.getByRole('textbox', { name: 'Buscar experiencias', exact: true }).fill(ARCHIVED_EVENT.title);
    await expect(page.getByRole('button', { name: `Ver ${ARCHIVED_EVENT.title}`, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
    const afterReload = await storedEvents(page);
    expect(afterReload.filter(event => event.id === ARCHIVED_EVENT.id)).toHaveLength(1);
    expect(afterReload.find(event => event.id === edited.id)).toEqual(edited);
    expect(afterReload).toHaveLength(7);
  });
}

test('el archivo eliminado del estado persistido no reaparece al recargar o cambiar versión', async ({ page }) => {
  await seedOnce(page, oldSeed);
  await openDemo(page, '/3d/');
  await expect.poll(async () => (await storedEvents(page)).length).toBe(7);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'false'), DEMO_ARCHIVE_MIGRATION_KEY)).toBe(true);
  await page.evaluate(({ storageKey, archiveId }) => {
    const events = JSON.parse(localStorage.getItem(storageKey)!) as EventItem[];
    localStorage.setItem(storageKey, JSON.stringify(events.filter(event => event.id !== archiveId)));
  }, { storageKey, archiveId: ARCHIVED_EVENT.id });
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.locator('.hero')).toBeVisible();
  expect(await storedEvents(page)).toEqual(oldSeed);
  await page.goto('/original/');
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.locator('.hero')).toBeVisible();
  expect(await storedEvents(page)).toEqual(oldSeed);
  await expect(page.getByRole('button', { name: `Ver ${ARCHIVED_EVENT.title}`, exact: true })).toHaveCount(0);
});

test('un catálogo personalizado se conserva sin agregar experiencias de muestra', async ({ page }) => {
  const custom: EventItem = { ...oldSeed[0], id: 'custom-program', title: 'Mi programa personalizado', registered: 0, featured: true };
  await seedOnce(page, [custom]);
  await openDemo(page, '/hibrida/');
  await expect(page.getByRole('button', { name: 'Ver Mi programa personalizado', exact: true })).toBeVisible();
  expect(await storedEvents(page)).toEqual([custom]);
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.locator('.hero')).toBeVisible();
  expect(await storedEvents(page)).toEqual([custom]);
  await expect(page.getByRole('button', { name: `Ver ${ARCHIVED_EVENT.title}`, exact: true })).toHaveCount(0);
});

test('el archivo también se agrega cuando el seed tiene eventos propios adicionales', async ({ page }) => {
  const edited = { ...oldSeed[0], title:'Sessions editadas', description:'Una descripción propia que se conserva.' };
  const own: EventItem = { ...oldSeed[1], id:'own-program', title:'Mi evento agregado', date:'2026-11-27T18:00:00-03:00', endDate:'2026-11-27T20:00:00-03:00', registered:0 };
  const fixture = [edited,...oldSeed.slice(1),own];
  await seedOnce(page,fixture);
  await openDemo(page,'/hibrida/');
  await expect.poll(async () => (await storedEvents(page)).length).toBe(8);
  const migrated = await storedEvents(page);
  expect(migrated.filter(event => event.id !== ARCHIVED_EVENT.id)).toEqual(fixture);
  expect(migrated.filter(event => event.id === ARCHIVED_EVENT.id)).toHaveLength(1);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'false'),DEMO_ARCHIVE_MIGRATION_KEY)).toBe(true);
  await page.reload();
  await expect(page.getByRole('dialog', { name:'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.locator('.hero')).toBeVisible();
  const restored = await storedEvents(page);
  expect(restored).toHaveLength(8);
  expect(restored.filter(event => event.id !== ARCHIVED_EVENT.id)).toEqual(fixture);
  expect(restored.filter(event => event.id === ARCHIVED_EVENT.id)).toHaveLength(1);
});
