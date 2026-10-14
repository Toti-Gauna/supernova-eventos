import { expect, test, type Locator, type Page } from '@playwright/test';
import jsQR from 'jsqr';

async function open(page: Page, version: string) {
  await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
  await page.goto(`/${version}/`);
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true })).toBeVisible();
}

/** Decode the actual SVG image after browser rasterization with an independent QR reader. */
async function decode(image: Locator, actualSize = false): Promise<string> {
  await expect(image).toBeVisible();
  const raster = await image.evaluate(async (element, actual) => {
    const img = element as HTMLImageElement;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = actual ? Math.round(img.getBoundingClientRect().width) : 512; canvas.height = canvas.width;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas unavailable');
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data), width: canvas.width, height: canvas.height };
  }, actualSize);
  const code = jsQR(new Uint8ClampedArray(raster.pixels), raster.width, raster.height);
  expect(code, 'QR escaneable en la imagen SVG mostrada').not.toBeNull();
  return code!.data;
}

for (const version of ['original', '3d', 'hibrida']) {
  test(`QR de usuario en ${version}: reserva y función sin datos personales, descarga y foco`, async ({ page }) => {
    await open(page, version);
    await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
    await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
    const trigger = page.getByRole('button', { name: 'Ver mi QR', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Mi QR de acceso', exact: true });
    const payload = JSON.parse(await decode(dialog.locator('.qr-image')));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!)[0]);
    expect(payload).toEqual({ type: 'supernova-demo-pass', version: 1, passId: stored.id, eventId: stored.eventId, sessionId: stored.sessionId });
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('email');
    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('link', { name: 'Descargar QR', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^supernova-pase-.+-qr\.svg$/);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
  });
}

test('QR admin selecciona la función, genera un enlace de la versión y abre el evento elegido', async ({ page }) => {
  await open(page, 'hibrida');
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'QR de Supernova Sessions', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'QR de Supernova Sessions', exact: true });
  const first = new URL(await decode(dialog.locator('.qr-image')));
  expect(first.pathname).toBe('/hibrida/');
  expect(first.searchParams.get('evento')).toBe('supernova-sessions');
  const selector = dialog.getByRole('combobox', { name: 'Función del QR', exact: true });
  const ids = await selector.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
  expect(ids.length).toBeGreaterThan(1);
  await selector.selectOption(ids[1]);
  await expect(dialog.locator('.qr-image')).toBeVisible();
  const second = new URL(await decode(dialog.locator('.qr-image')));
  expect(second.searchParams.get('funcion')).toBe(ids[1]);
  expect(second.href).not.toBe(first.href);
  await expect(dialog.getByRole('textbox', { name: 'Enlace al evento', exact: true })).toHaveValue(second.href);
  await expect(dialog).toContainText('No valida ingresos');
  await dialog.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto(second.href);
  await expect(page.getByRole('dialog', { name: 'Supernova Sessions', exact: true })).toBeVisible();
  await expect(page.locator('.event-session-selector').getByRole('radio').nth(1)).toBeChecked();
});

test('QR usuario y admin en 320 px mantienen acciones y navegación con teclado', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 667 });
  await open(page, 'original');
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mi QR', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Mi QR de acceso', exact: true });
  await expect(dialog.locator('.qr-image')).toBeVisible();
  const overflow = await dialog.evaluate(element => element.scrollWidth > element.clientWidth + 1);
  expect(overflow).toBe(false);
  await expect(dialog.getByRole('link', { name: 'Descargar QR', exact: true })).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Volver', exact: true })).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Ver mi QR', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'QR de Supernova Sessions', exact: true }).click();
  const admin = page.getByRole('dialog', { name: 'QR de Supernova Sessions', exact: true });
  const decoded = new URL(await decode(admin.locator('.qr-image'), true));
  expect(decoded.pathname).toBe('/original/');
  const actions = await admin.locator('.qr-dialog-actions .button').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    const dialog = element.closest('dialog')!.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight && box.top >= dialog.top && box.bottom <= dialog.bottom;
  }));
  expect(actions).toEqual([true, true]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'QR de Supernova Sessions', exact: true })).toBeFocused();
});

test('si falla el generador, el pase conserva su código, Escape y foco', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/node_modules/.vite/deps/qrcode*', route => route.abort());
  await open(page, 'original');
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Ver mi QR', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Mi QR de acceso', exact: true });
  await expect(dialog.getByRole('status')).toContainText('No pudimos generar el QR');
  await expect(dialog.locator('.qr-pass-code code')).not.toBeEmpty();
  await expect(dialog.getByRole('link', { name: 'Descargar QR', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
