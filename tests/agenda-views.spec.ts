import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Mis eventos and Favoritos are the same views in every version; only the background (and,
// in 3D and 2D + 3D, the section planet beside the title) changes. Comercial is covered in
// tests/commercial.spec.ts.
const clockDate = new Date('2026-10-07T15:00:00Z');
const person = { name: 'Alex García', email: 'alex.garcia@demo.personal.test' };
// Stored out of order on purpose: the view sorts upcoming passes by date and finished ones last.
const passes = [
  { id: 'SN-AG-ENDED', eventId: 'shared-orbit', ...person, companions: 1, createdAt: '2026-09-20T15:00:00Z' },
  { id: 'SN-AG-LAB', eventId: 'creative-lab', sessionId: 'creative-lab:main', ...person, companions: 0, createdAt: '2026-10-06T15:00:00Z' },
  { id: 'SN-AG-NEXT', eventId: 'next-frontier', sessionId: 'next-frontier:main', ...person, companions: 0, createdAt: '2026-10-06T15:00:00Z' },
];
const versions = [
  { path: '/original/', name: 'Original', spatial: false },
  { path: '/3d/', name: '3D', spatial: true },
  { path: '/hibrida/', name: '2D + 3D', spatial: true },
] as const;

async function seed(page: Page, registrations: unknown[], favorites: string[], theme: 'dark' | 'light' = 'dark') {
  await page.addInitScript(({ registrations, favorites, theme }) => {
    localStorage.setItem('supernova-registrations-v1', JSON.stringify(registrations));
    localStorage.setItem('supernova-favorites-v1', JSON.stringify(favorites));
    localStorage.setItem('supernova-theme-v1', JSON.stringify(theme));
  }, { registrations, favorites, theme });
}

// A fixed clock is only set for single-load tests: with Playwright's fake Date, a second
// document load in the same page leaves Motion's page exit pending.
async function open(page: Page, path: string, fixedClock = true) {
  if (fixedClock) await page.clock.setFixedTime(clockDate);
  await page.goto(path);
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/intro-playing/);
}

async function goTo(page: Page, label: 'Mis eventos' | 'Favoritos') {
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).first().click();
  await expect(page.getByRole('heading', { name: label, level: 1, exact: true })).toBeVisible();
}

/** The back button, the title and the action sit on one line, centred on the same axis. */
async function expectOneLineHeader(page: Page, section: string) {
  const head = page.locator(`${section} .agenda-head`);
  const centre = async (selector: string) => {
    const box = await head.locator(selector).first().boundingBox();
    return box!.y + box!.height / 2;
  };
  const title = await centre('.agenda-title');
  expect(Math.abs(await centre('.back-button') - title)).toBeLessThanOrEqual(2);
  expect(Math.abs(await centre('.agenda-action') - title)).toBeLessThanOrEqual(2);
}

for (const version of versions) {
  test(`${version.name}: Mis eventos muestra los pases como tickets y solo el próximo es «Tu próximo»`, async ({ page }) => {
    await seed(page, passes, []);
    await open(page, version.path);
    await goTo(page, 'Mis eventos');
    const view = page.locator('.my-events');
    await expect(view.locator('.agenda-count')).toHaveText('3 pases');
    await expect(view.getByText('2 por vivir', { exact: true })).toBeVisible();
    await expect(view.getByRole('button', { name: 'Volver a eventos', exact: true })).toHaveClass(/icon-only/);
    await expectOneLineHeader(page, '.my-events');
    await expect(view.locator('[data-universe-surface]')).toHaveCount(version.spatial ? 1 : 0);
    if (version.spatial) await expect(view.locator('.agenda-head [data-universe-surface]')).toHaveAttribute('data-universe-side', 'left');

    const tickets = view.getByRole('article');
    await expect(tickets.locator('h2')).toHaveText(['El futuro empieza acá', 'Laboratorio de ideas', 'Bajo la misma órbita']);
    await expect(view.getByText('Tu próximo', { exact: true })).toHaveCount(1);
    await expect(tickets.nth(0)).toContainText('Tu próximo');
    await expect(tickets.nth(1)).toContainText('Confirmado');
    await expect(tickets.nth(2)).toContainText('Finalizado');
    await expect(tickets.nth(0).locator('time')).toHaveAttribute('datetime', '2026-11-05T15:00:00-03:00');
    await expect(tickets.nth(0).getByRole('button', { name: 'Agregar El futuro empieza acá al calendario', exact: true })).toBeVisible();
    await expect(tickets.nth(2).getByRole('button', { name: /al calendario$/ })).toHaveCount(0);
    // The notches are real cut-outs, so they match any background behind the ticket.
    expect(await tickets.first().evaluate(element => getComputedStyle(element).maskImage)).toContain('radial-gradient');

    const viewPass = tickets.nth(0).getByRole('button', { name: 'Ver mi pase', exact: true });
    await viewPass.click();
    await expect(page.getByRole('dialog')).toContainText('SN-AG-NEXT');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(viewPass).toBeFocused();
  });

  test(`${version.name}: Mis eventos vacío ofrece una sola acción`, async ({ page }) => {
    await seed(page, [], []);
    await open(page, version.path);
    await goTo(page, 'Mis eventos');
    await expect(page.getByRole('heading', { name: 'Tu agenda está libre.' })).toBeVisible();
    await expect(page.locator('.my-events .agenda-count')).toHaveText('0 pases');
    const explore = page.getByRole('button', { name: 'Explorar experiencias', exact: true });
    await expect(explore).toHaveCount(1);
    await explore.click();
    await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  });

  test(`${version.name}: Favoritos busca desde el encabezado y sugiere planes si está vacío`, async ({ page }) => {
    await seed(page, [], ['reset-mind', 'supernova-sessions']);
    await open(page, version.path);
    await goTo(page, 'Favoritos');
    const view = page.locator('.favorites-page');
    await expect(view.locator('.agenda-count')).toHaveText('2 guardados');
    await expectOneLineHeader(page, '.favorites-page');
    if (version.spatial) await expect(view.locator('.agenda-head [data-universe-surface]')).toHaveAttribute('data-universe-side', 'right');
    const grid = view.locator('.favorites-grid article');
    await expect(grid).toHaveCount(2);

    const search = view.getByRole('textbox', { name: 'Buscar en favoritos' });
    await expect(view.locator('.agenda-head')).toContainText('Favoritos');
    await search.fill('respiro');
    await expect(grid).toHaveCount(1);
    await view.getByRole('button', { name: 'Limpiar búsqueda de favoritos', exact: true }).click();
    await expect(grid).toHaveCount(2);
    await expect(search).toBeFocused();
    await search.fill('sin coincidencias');
    await expect(page.getByRole('heading', { name: 'No encontramos ese plan.' })).toBeVisible();
    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(grid).toHaveCount(2);

    await view.getByRole('button', { name: 'Quitar Órbita Fest de favoritos', exact: true }).click();
    await view.getByRole('button', { name: 'Quitar Un respiro para vos de favoritos', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Guardá lo que te interesa.' })).toBeVisible();
    await expect(search).toHaveCount(0);
    const suggestions = page.getByRole('region', { name: 'Para empezar' });
    await expect(suggestions.locator('article')).toHaveCount(3);
    await suggestions.getByRole('button', { name: 'Guardar Órbita Fest', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Para empezar' })).toHaveCount(0);
    await expect(grid).toHaveCount(1);
    await expect(view.locator('.agenda-count')).toHaveText('1 guardado');
  });
}

for (const theme of ['dark', 'light'] as const) {
  for (const version of versions) {
    test(`${version.name}: las vistas compartidas no tienen errores graves de accesibilidad ni desbordes · tema ${theme === 'dark' ? 'oscuro' : 'claro'}`, async ({ page }) => {
      await seed(page, passes, ['reset-mind', 'supernova-sessions'], theme);
      await open(page, version.path, false);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        for (const [label, section] of [['Mis eventos', '.my-events'], ['Favoritos', '.favorites-page']] as const) {
          await goTo(page, label);
          await expect.poll(() => page.locator(section).evaluate(element => getComputedStyle(element.closest('#main-content > div') || element).opacity)).toBe('1');
          expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${label} ${viewport.width}`).toBe(false);
          // The category badge on the photo belongs to EventCard (outside these views) and is
          // reported separately: white text on the brighter category colours of 3D and 2D + 3D.
          const result = await new AxeBuilder({ page }).include(section).exclude('.event-card .category-badge').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
          const blocking = result.violations.filter(violation => violation.impact === 'critical' || violation.impact === 'serious');
          expect(blocking.map(violation => `${label} ${viewport.width} · ${violation.id}: ${violation.nodes.slice(0, 3).map(node => node.target.join(' ')).join(' | ')}`)).toEqual([]);
        }
      }
    });
  }
}
