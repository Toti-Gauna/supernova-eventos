import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { EventItem } from '../src/types';

const clockDate = new Date('2026-10-07T15:00:00Z');
const eventStorage = 'supernova-events-v1';
const favoritesStorage = 'supernova-favorites-v1';

function eventFixture(id: string, title: string, date: string, endDate: string, overrides: Partial<EventItem> = {}): EventItem {
  return {
    id, title, date, endDate,
    subtitle: 'Una experiencia de catálogo QA.',
    category: 'Comunidad',
    image: '/images/concert.jpg',
    location: 'Campus de demostración · Montevideo',
    mode: 'Presencial',
    capacity: 100,
    registered: 10,
    description: 'Una experiencia ficticia para verificar el catálogo, sus filtros y la navegación entre páginas.',
    host: 'Equipo de demostración',
    featured: false,
    isPrivate: false,
    status: 'published',
    companions: 0,
    terms: '',
    ...overrides,
  };
}

// El orden almacenado, los nombres y las fechas contradicen la prioridad de las fases.
const catalogEvents: EventItem[] = [
  eventFixture('ended-manual', 'Aarón finalizado', '2026-11-10T15:00:00Z', '2026-11-10T17:00:00Z', { status: 'ended', registered: 15 }),
  eventFixture('future-alpha', 'Alfa futura', '2026-10-09T15:00:00Z', '2026-10-09T17:00:00Z', { category: 'Tecnología', registered: 20 }),
  eventFixture('ended-past', 'Delta cerrada', '2026-10-06T15:00:00Z', '2026-10-06T17:00:00Z', { registered: 0 }),
  eventFixture('active-start', 'Ypsilon en vivo', '2026-10-07T15:00:00Z', '2026-10-07T16:00:00Z', {
    category: 'Música', registered: 60, isPrivate: true,
    audience: { mode: 'payroll', people: [{ id: 'demo-alex', name: 'Alex García', email: 'ALEX.GARCIA@DEMO.TELEFONICA.TEST', department: 'Tecnología' }] },
  }),
  eventFixture('future-gamma', 'Gamma futura', '2026-10-10T15:00:00Z', '2026-10-10T17:00:00Z', { category: 'Aprendizaje', mode: 'Online', registered: 30 }),
  eventFixture('ended-boundary', 'Épsilon al cierre', '2026-10-07T14:00:00Z', '2026-10-07T15:00:00Z', { category: 'Bienestar', registered: 80 }),
  eventFixture('future-beta', 'Beta futura', '2026-10-08T15:00:00Z', '2026-10-08T17:00:00Z', { category: 'Tecnología', mode: 'Online', registered: 0 }),
  eventFixture('active-past', 'Zeta en vivo', '2026-10-07T14:00:00Z', '2026-10-07T17:00:00Z', { category: 'Música' }),
  eventFixture('hidden-draft', 'Oculto borrador', '2026-10-07T14:00:00Z', '2026-10-07T17:00:00Z', { status: 'draft' }),
  eventFixture('hidden-private', 'Oculto privado', '2026-10-08T15:00:00Z', '2026-10-08T17:00:00Z', {
    isPrivate: true,
    audience: { mode: 'payroll', people: [{ id: 'demo-other', name: 'Otra Persona', email: 'otra@demo.telefonica.test', department: 'Personas' }] },
  }),
];
const visibleIds = catalogEvents.filter(event => !event.id.startsWith('hidden-')).map(event => event.id);

async function openCatalog(page: Page, withFixtures = true, allFavorites = false) {
  await page.clock.setFixedTime(clockDate);
  if (withFixtures) {
    await page.addInitScript(({ events, favorites, eventKey, favoritesKey }) => {
      localStorage.setItem(eventKey, JSON.stringify(events));
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }, { events: catalogEvents, favorites: allFavorites ? visibleIds : [], eventKey: eventStorage, favoritesKey: favoritesStorage });
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toHaveCount(0);
}

function pageButton(page: Page, number: number) {
  return page.getByRole('button', { name: `Ir a la página ${number} de eventos`, exact: true });
}

async function expectTitles(page: Page, titles: string[]) {
  await expect(page.locator('#catalog-result-list .event-card')).toHaveCount(titles.length);
  await expect(page.locator('#catalog-result-list .event-card-title')).toHaveText(titles);
}

async function expectCurrentPage(page: Page, number: number) {
  await expect(pageButton(page, number)).toHaveAttribute('aria-current', 'page');
}

async function chooseOrder(page: Page, label: string) {
  await page.getByRole('combobox', { name: 'Ordenar experiencias', exact: true }).click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

test('las seis experiencias iniciales se distribuyen en dos páginas de tres', async ({ page }) => {
  await openCatalog(page, false);
  await expectTitles(page, ['Supernova Sessions', 'Un respiro para vos', 'El futuro empieza acá']);
  await expect(page.locator('.event-phase-group h3')).toHaveText(['Eventos próximos']);
  await expect(page.locator('.event-phase-count')).toHaveText(/6/);
  await expectCurrentPage(page, 1);
  await expect(page.getByRole('button', { name: 'Página anterior de eventos', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Página siguiente de eventos', exact: true }).click();
  await expectCurrentPage(page, 2);
  await expectTitles(page, ['Conexiones que importan', 'Laboratorio de ideas', 'Fuera de la rutina']);
  await expect(page.locator('#catalog-result-list')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Página siguiente de eventos', exact: true })).toBeDisabled();
  await expect(pageButton(page, 3)).toHaveCount(0);
});

test('la jerarquía temporal comparte un límite global de tres y conserva los permisos', async ({ page }) => {
  await openCatalog(page);
  const groups = page.locator('.event-phase-group');
  await expectTitles(page, ['Zeta en vivo', 'Ypsilon en vivo', 'Beta futura']);
  await expect(groups.locator('h3')).toHaveText(['Eventos activos', 'Eventos próximos']);
  await expect(groups.locator('.event-phase-count')).toHaveText([/2/, /3/]);
  await pageButton(page, 2).click();
  await expectTitles(page, ['Alfa futura', 'Gamma futura', 'Delta cerrada']);
  await expect(groups.locator('h3')).toHaveText(['Eventos próximos', 'Eventos finalizados']);
  await expect(groups.locator('.event-phase-count')).toHaveText([/3/, /3/]);
  await pageButton(page, 3).click();
  await expectTitles(page, ['Épsilon al cierre', 'Aarón finalizado']);
  await expect(groups.locator('h3')).toHaveText(['Eventos finalizados']);
  await expect(groups.locator('.event-phase-count')).toHaveText(/3/);
  await expect(page.getByRole('button', { name: 'Página siguiente de eventos', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Buscar experiencias', exact: true }).fill('Oculto');
  await expect(page.locator('#catalog-result-list .event-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Todavía no hay una órbita por acá.' })).toBeVisible();
});

test('ordenar por nombre o cupos mantiene la prioridad de las fases y vuelve a la página uno', async ({ page }) => {
  await openCatalog(page);
  await pageButton(page, 2).click();
  await chooseOrder(page, 'Nombre: A a Z');
  await expectCurrentPage(page, 1);
  await expectTitles(page, ['Ypsilon en vivo', 'Zeta en vivo', 'Alfa futura']);
  await pageButton(page, 2).click();
  await expectTitles(page, ['Beta futura', 'Gamma futura', 'Aarón finalizado']);
  await pageButton(page, 3).click();
  await expectTitles(page, ['Delta cerrada', 'Épsilon al cierre']);
  await chooseOrder(page, 'Más lugares disponibles');
  await expectCurrentPage(page, 1);
  await expectTitles(page, ['Zeta en vivo', 'Ypsilon en vivo', 'Beta futura']);
});

test('buscar y cambiar categorías, modalidad, fecha o favoritos reinicia la paginación', async ({ page }) => {
  await openCatalog(page, true, true);
  const query = page.getByRole('textbox', { name: 'Buscar experiencias', exact: true });
  await pageButton(page, 3).click();
  await query.fill('catálogo');
  await expectCurrentPage(page, 1);
  await expectTitles(page, ['Zeta en vivo', 'Ypsilon en vivo', 'Beta futura']);
  await pageButton(page, 2).click();
  await query.fill('futura');
  await expectTitles(page, ['Beta futura', 'Alfa futura', 'Gamma futura']);
  await expect(page.getByRole('button', { name: 'Página siguiente de eventos', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar búsqueda', exact: true }).click();
  await expectCurrentPage(page, 1);
  await pageButton(page, 2).click();
  await page.getByRole('button', { name: 'Música', exact: true }).click();
  await expectTitles(page, ['Zeta en vivo', 'Ypsilon en vivo']);
  await page.getByRole('button', { name: /Todo el universo/ }).click();
  await expectCurrentPage(page, 1);
  await pageButton(page, 2).click();
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('combobox', { name: 'Filtrar por modalidad', exact: true }).click();
  await page.getByRole('option', { name: 'Online', exact: true }).click();
  await expectTitles(page, ['Beta futura', 'Gamma futura']);
  await page.getByRole('combobox', { name: 'Filtrar por modalidad', exact: true }).click();
  await page.getByRole('option', { name: 'Todas las modalidades', exact: true }).click();
  await expectCurrentPage(page, 1);
  await pageButton(page, 2).click();
  await page.getByLabel('Filtrar por fecha', { exact: true }).fill('2026-10-08');
  await expectCurrentPage(page, 1);
  await expectTitles(page, ['Beta futura', 'Alfa futura', 'Gamma futura']);
  await pageButton(page, 2).click();
  await page.getByLabel('Filtrar por fecha', { exact: true }).fill('2026-10-09');
  await expectTitles(page, ['Alfa futura', 'Gamma futura', 'Aarón finalizado']);
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expectCurrentPage(page, 1);
  await pageButton(page, 2).click();
  await page.getByRole('button', { name: 'Mis favoritos', exact: true }).click();
  await expectCurrentPage(page, 1);
  await expectTitles(page, ['Zeta en vivo', 'Ypsilon en vivo', 'Beta futura']);
});

test('quitar los últimos favoritos ajusta la página al reducirse los resultados', async ({ page }) => {
  await openCatalog(page, true, true);
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Mis favoritos', exact: true }).click();
  await pageButton(page, 3).click();
  await expectTitles(page, ['Épsilon al cierre', 'Aarón finalizado']);
  await page.getByRole('button', { name: 'Quitar Épsilon al cierre de favoritos', exact: true }).click();
  await expectCurrentPage(page, 3);
  await expectTitles(page, ['Aarón finalizado']);
  await page.getByRole('button', { name: 'Quitar Aarón finalizado de favoritos', exact: true }).click();
  await expectCurrentPage(page, 2);
  await expectTitles(page, ['Alfa futura', 'Gamma futura', 'Delta cerrada']);
  await expect(pageButton(page, 3)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Página siguiente de eventos', exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).length, favoritesStorage)).toBe(6);
});

test('los finalizados se pueden consultar con inscripción cerrada, incluso al terminar exactamente ahora', async ({ page }) => {
  await openCatalog(page);
  for (const { number, title } of [
    { number: 2, title: 'Delta cerrada' },
    { number: 3, title: 'Épsilon al cierre' },
    { number: 3, title: 'Aarón finalizado' },
  ]) {
    await pageButton(page, number).click();
    const cover = page.getByRole('button', { name: `Ver ${title}`, exact: true });
    await cover.click();
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(modal.getByText('La inscripción para este evento está cerrada.', { exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Confirmar mi lugar', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(cover).toBeFocused();
  }
});

test('un evento pasa de próximo a activo y finalizado al llegar sus horarios, sin refrescar', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-07T14:00:00Z') });
  await page.clock.pauseAt(clockDate);
  const event = eventFixture('time-transition', 'Momento dinámico', '2026-10-07T15:01:00Z', '2026-10-07T15:02:00Z');
  await page.addInitScript(({ event, key }) => localStorage.setItem(key, JSON.stringify([event])), { event, key: eventStorage });
  await page.goto('/');
  await page.clock.runFor(1_000);
  await expectTitles(page, ['Momento dinámico']);
  await expect(page.locator('.event-phase-group h3')).toHaveText(['Eventos próximos']);
  await page.clock.runFor(59_000);
  await expect(page.locator('.event-phase-group h3')).toHaveText(['Eventos activos']);
  await expectTitles(page, ['Momento dinámico']);
  await page.clock.runFor(60_000);
  await expect(page.locator('.event-phase-group h3')).toHaveText(['Eventos finalizados']);
  await expectTitles(page, ['Momento dinámico']);
  await expect(page.locator('.event-card').getByRole('button', { name: 'Ver detalles', exact: true })).toBeVisible();
  await expect(page.locator('.event-card').getByText(/lugares disponibles/)).toHaveCount(0);
});

for (const theme of ['dark', 'light'] as const) {
  test(`el paginado móvil funciona con teclado, conserva foco y evita desbordamiento en modo ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCatalog(page, false);
    if (theme === 'light') await page.getByRole('button', { name: 'Activar modo claro', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 667 }]) {
      await page.setViewportSize(viewport);
      const next = page.getByRole('button', { name: 'Página siguiente de eventos', exact: true });
      await next.focus();
      await page.keyboard.press('Enter');
      await expectCurrentPage(page, 2);
      await expect(page.locator('#catalog-result-list')).toBeFocused();
      await expect(page.locator('.event-card-title').first()).toBeInViewport();
      const results = await page.locator('#catalog-result-list').boundingBox();
      const header = await page.locator('.header-surface').boundingBox();
      expect(results!.y, `resultados visibles debajo del header a ${viewport.width}px`).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const previous = page.getByRole('button', { name: 'Página anterior de eventos', exact: true });
      await previous.focus();
      await page.keyboard.press('Space');
      await expectCurrentPage(page, 1);
      await expect(page.locator('#catalog-result-list')).toBeFocused();
      await expectTitles(page, ['Supernova Sessions', 'Un respiro para vos', 'El futuro empieza acá']);
    }
  });
}
