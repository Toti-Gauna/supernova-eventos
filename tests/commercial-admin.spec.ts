import { expect, test, type Page } from '@playwright/test';

const clockDate = new Date('2026-10-07T15:00:00Z');

async function openAdmin(page: Page) {
  await page.clock.setFixedTime(clockDate);
  await page.goto('/comercial/');
  await page.getByRole('button', { name: 'Administrar', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Administrar experiencias', exact: true })).toBeVisible();
}

test('Comercial: acciones del encabezado en píldoras iguales, KPIs y menú por fila con foco', async ({ page }) => {
  await openAdmin(page);
  const heights = await Promise.all(['Registrar pase', 'Exportar inscripciones', 'Crear experiencia'].map(async name => (await page.getByRole('button', { name, exact: true }).first().boundingBox())!.height));
  expect(new Set(heights.map(Math.round)).size).toBe(1);
  await expect(page.getByRole('list', { name: 'Resumen de los resultados' }).getByRole('listitem')).toHaveCount(4);

  // One quick action per row; the rest live in the menu.
  const row = page.locator('.admin-event-table tbody tr', { hasText: 'Órbita Fest' });
  await expect(row.getByRole('button', { name: 'Editar Órbita Fest', exact: true })).toBeVisible();
  const more = row.getByRole('button', { name: 'Más acciones para Órbita Fest', exact: true });
  await more.click();
  const menu = page.getByRole('menu', { name: 'Acciones de Órbita Fest' });
  await expect(menu.getByRole('menuitem')).toHaveText(['Vista previa', 'Compartir QR', 'Duplicar como borrador', 'Exportar inscripciones']);
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Compartir QR' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(more).toBeFocused();

  // A dialog opened from the menu gives the focus back to the menu button.
  await more.click();
  await page.getByRole('menuitem', { name: 'Compartir QR' }).click();
  await expect(page.getByRole('dialog', { name: 'QR de Órbita Fest', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(more).toBeFocused();
});

test('Comercial: en el teléfono la tabla pasa a cards sin desbordar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAdmin(page);
  const rows = page.locator('.admin-event-table tbody tr');
  await expect(rows.first()).toBeVisible();
  expect(await rows.first().evaluate(row => getComputedStyle(row).display)).toBe('grid');
  expect(await page.locator('.admin-event-table thead').evaluate(head => head.getBoundingClientRect().height)).toBeLessThanOrEqual(1);
  const first = await rows.nth(0).boundingBox();
  const second = await rows.nth(1).boundingBox();
  expect(second!.y).toBeGreaterThan(first!.y + first!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await expect(rows.first().getByRole('button', { name: /^Editar / })).toBeVisible();
});

test('Comercial: el creador muestra el acceso en el primer paso y el banner real de la home', async ({ page }) => {
  await openAdmin(page);
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).first().click();
  const access = page.getByRole('radiogroup', { name: '¿Quiénes pueden verlo?' });
  await expect(access).toBeVisible();
  await expect(access.getByRole('radio', { name: /^Personal interno/ })).toHaveAttribute('aria-checked', 'true');

  // The preview is the same FeaturedBanner as the home, inert inside the creator.
  const preview = page.getByRole('complementary', { name: 'Vista previa del evento' });
  await expect(preview.locator('.wizard-banner-preview[inert] .featured-banner')).toBeVisible();
  await page.getByLabel('Nombre del evento').fill('Noche de jazz QA');
  await page.getByLabel('Una frase para inspirar').fill('Música en vivo para cerrar la semana.');
  await expect(preview.locator('.featured-banner h2')).toHaveText('Noche de jazz QA');
  await expect(preview.locator('.featured-banner')).toContainText('Música en vivo para cerrar la semana.');

  await access.getByRole('radio', { name: /^Interno y externo/ }).click();
  await expect(preview.locator('.featured-banner')).toContainText('Abierto a invitados');
  await page.keyboard.press('ArrowRight');
  await expect(access.getByRole('radio', { name: /^Personal externo/ })).toHaveAttribute('aria-checked', 'true');
  await expect(access.getByRole('radio', { name: /^Personal externo/ })).toBeFocused();

  await page.getByLabel('Ubicación del evento').fill('Terraza de demostración · Buenos Aires');
  await page.getByLabel('Fecha y hora de inicio', { exact: true }).fill('2026-11-25T19:00');
  await page.getByLabel('Fecha y hora de fin', { exact: true }).fill('2026-11-25T22:00');
  await page.getByLabel('Acerca de la experiencia').fill('Un cierre de semana ficticio con música en vivo para probar el creador.');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿A quiénes vamos a invitar?' })).toBeFocused();
  await expect(page.locator('.access-mode-summary')).toContainText('Personal externo');
  await expect(page.getByRole('radio', { name: /Tabla de nómina/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cambiar quiénes pueden verlo', exact: true }).click();
  await expect(page.getByRole('radio', { name: /^Personal externo/ })).toBeFocused();

  await page.getByRole('button', { name: /Revisar y publicar/ }).click();
  await expect(page.getByText(/Personal externo · /)).toBeVisible();
  await page.getByRole('button', { name: 'Publicar evento', exact: true }).click();
  await expect(page.locator('.admin-event-table tbody tr', { hasText: 'Noche de jazz QA' })).toContainText('Personal externo');
});

test('Comercial: crear un evento lleva menos scroll en 1440 × 900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAdmin(page);
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).first().click();
  await expect(page.getByLabel('Nombre del evento')).toBeVisible();
  // Before Lote 5 the first step measured 2233 px; now it fits in about 1500 px.
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(1700);
  const preview = await page.locator('.wizard-banner-preview').boundingBox();
  expect(preview!.y + preview!.height).toBeLessThanOrEqual(900);
});

test('Comercial: Registrar pase ocupa toda la pantalla del teléfono y conserva Escape y foco', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openAdmin(page);
  const trigger = page.getByRole('button', { name: 'Registrar pase', exact: true }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Registrar pase', exact: true });
  const box = await dialog.boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 360, height: 740 });
  await expect(dialog.getByRole('tab', { name: 'Cámara', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByRole('button', { name: 'Abrir cámara', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Validar pase', exact: true })).toBeInViewport();
  expect(await dialog.locator('.pass-check-body').evaluate(body => body.scrollHeight - body.clientHeight)).toBeLessThanOrEqual(1);
  await dialog.getByRole('tab', { name: 'Cámara', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('tab', { name: 'Imagen', exact: true })).toBeFocused();
  await expect(dialog.getByText('Leer QR de una imagen')).toBeVisible();
  await page.keyboard.press('End');
  await expect(dialog.getByRole('textbox', { name: 'QR o código del pase', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
