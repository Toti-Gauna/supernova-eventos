import { expect, test, type Locator, type Page } from '@playwright/test';
import jsQR from 'jsqr';

const clockDate = new Date('2026-10-07T15:00:00Z');
const access = { kind: 'internal', name: 'Alex García', email: 'alex.garcia@demo.personal.test', organization: 'Personal' };

async function openCommercial(page: Page, theme: 'light' | 'dark' = 'light') {
  await page.addInitScript(([value, mode]) => {
    localStorage.setItem('orbita-access-v1', value);
    localStorage.setItem('orbita-commercial-theme-v1', JSON.stringify(mode));
  }, [JSON.stringify(access), theme] as const);
  await page.clock.setFixedTime(clockDate);
  await page.goto('/comercial/');
  await expect(page.getByRole('region', { name: 'Experiencias destacadas' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function openFest(page: Page) {
  const trigger = page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Órbita Fest', exact: true });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

async function confirmFest(page: Page) {
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Agregar acompañante' }).click();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
}

const scrollState = (page: Page) => page.locator('.registration-modal').evaluate(element => ({
  vertical: element.scrollHeight > element.clientHeight + 1,
  horizontal: element.scrollWidth > element.clientWidth + 1,
}));

/** Decode the QR from the pixels actually painted on screen (an element screenshot), with an independent reader. */
async function decode(image: Locator): Promise<string> {
  await expect(image).toBeVisible();
  await image.evaluate(element => (element as HTMLImageElement).decode());
  const png = (await image.screenshot({ animations: 'disabled' })).toString('base64');
  const raster = await image.page().evaluate(async source => {
    const img = new Image();
    img.src = `data:image/png;base64,${source}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(img, 0, 0);
    return { pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data), width: canvas.width, height: canvas.height };
  }, png);
  const code = jsQR(new Uint8ClampedArray(raster.pixels), raster.width, raster.height);
  expect(code, 'QR legible desde los píxeles en pantalla').not.toBeNull();
  return code!.data;
}

async function openAdminEventQR(page: Page, title: string) {
  await page.getByRole('button', { name: 'Administrar', exact: true }).first().click();
  const trigger = page.getByRole('button', { name: new RegExp(`^(QR de|Más acciones para) ${title}$`) }).first();
  await expect(trigger).toBeVisible();
  // The admin may offer the QR directly or inside the row's action menu.
  if ((await trigger.getAttribute('aria-haspopup')) === 'menu') {
    await trigger.click();
    await page.getByRole('menuitem', { name: /QR/ }).click();
  } else await trigger.click();
}

test('la inscripción Comercial entra en una pantalla, con funciones como tarjetas y el resumen con el CTA', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCommercial(page);
  const { trigger, dialog } = await openFest(page);
  await expect(dialog.getByText(/Este momento|TU PRÓXIMA CONEXIÓN|TU PRÓXIMO GRAN MOMENTO/)).toHaveCount(0);
  const functions = dialog.getByRole('group', { name: 'Elegí tu función' });
  await expect(functions.getByRole('radio')).toHaveCount(2);
  await expect(functions.getByRole('radio', { name: /Viernes.*23 de octubre.*19:00/ })).toBeChecked();
  const summary = dialog.getByRole('complementary', { name: 'Tu inscripción' });
  await expect(summary.getByText('54 lugares disponibles', { exact: true })).toBeVisible();
  await expect(summary).toContainText('Vie 23 oct · 19:00 h');

  for (const [width, height] of [[1440, 900], [1920, 840]]) {
    await page.setViewportSize({ width, height });
    expect(await scrollState(page), `${width}x${height}`).toEqual({ vertical: false, horizontal: false });
    await expect(dialog.getByRole('button', { name: 'Confirmar mi lugar', exact: true })).toBeInViewport({ ratio: 1 });
    await expect(dialog.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' })).toBeInViewport();
  }

  await functions.getByRole('radio', { name: /Sábado.*24 de octubre.*21:00/ }).check();
  await expect(summary).toContainText('Sáb 24 oct · 21:00 h');
  await expect(summary.getByText('240 lugares disponibles', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Agregar acompañante' }).click();
  await expect(summary).toContainText('2 lugares');

  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Aceptá los términos del evento para continuar.');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('el pase Comercial es una entrada con QR legible, sin scroll y con foco y Escape como siempre', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCommercial(page);
  const { trigger } = await openFest(page);
  await confirmFest(page);
  await expect(page.getByRole('button', { name: 'Cerrar inscripción' })).toBeFocused();
  // Reduced motion: no celebration at all.
  await expect(page.locator('.cx-celebration')).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!)[0]);
  const ticket = page.getByRole('article', { name: 'Tu pase' });
  await expect(ticket).toContainText(stored.id);
  await expect(ticket).toContainText('Vos + 1 acompañante');
  await expect(ticket).toContainText('Terraza Personal · Buenos Aires');
  await expect(ticket).toContainText('Puertas 18:00 h');
  const payload = JSON.parse(await decode(ticket.getByRole('img', { name: 'QR de tu pase' })));
  expect(payload).toEqual({ type: 'supernova-demo-pass', version: 1, passId: stored.id, eventId: 'supernova-sessions', sessionId: 'supernova-sessions:main' });

  for (const [width, height] of [[1440, 900], [1920, 840], [390, 844]]) {
    await page.setViewportSize({ width, height });
    expect(await scrollState(page), `${width}x${height}`).toEqual({ vertical: false, horizontal: false });
    for (const name of ['Agregar a mi calendario', 'Descargar pase', 'Compartir evento', 'Ver mi QR', 'No voy a poder asistir']) {
      await expect(page.getByRole('button', { name, exact: true }), `${name} en ${width}x${height}`).toBeInViewport({ ratio: 1 });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  const calendar = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Agregar a mi calendario', exact: true }).click();
  expect((await calendar).suggestedFilename()).toMatch(/\.ics$/);
  const ticketFile = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar pase', exact: true }).click();
  expect((await ticketFile).suggestedFilename()).toBe(`orbita-pase-supernova-sessions-${stored.id}.svg`);

  const qrTrigger = page.getByRole('button', { name: 'Ver mi QR', exact: true });
  await qrTrigger.click();
  const qr = page.getByRole('dialog', { name: 'Mi QR de acceso', exact: true });
  expect(JSON.parse(await decode(qr.locator('.qr-image')))).toEqual(payload);
  await expect(qr.locator('.qr-pass-code code')).toHaveText(stored.id);
  expect(await qr.evaluate(element => element.scrollHeight > element.clientHeight + 1)).toBe(false);
  await page.keyboard.press('Escape');
  await expect(qr).toHaveCount(0);
  await expect(qrTrigger).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'No voy a poder asistir', exact: true }).click();
  await expect(page.getByRole('alertdialog', { name: 'Cancelar inscripción' })).toBeVisible();
  await page.getByRole('button', { name: 'Conservar mi lugar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'No voy a poder asistir', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('compartir copia el link del evento si no hay Web Share y no promete un envío', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:5173' });
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: undefined });
    Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: undefined });
  });
  await openCommercial(page);
  await openFest(page);
  await confirmFest(page);
  const share = page.getByRole('button', { name: 'Compartir evento', exact: true });
  await share.click();
  await expect(page.getByRole('status').filter({ hasText: 'Copiamos el link del evento.' })).toBeVisible();
  await expect(page.getByText(/enviad|enviamos/i)).toHaveCount(0);
  const copied = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(copied.pathname).toBe('/comercial/');
  expect(copied.searchParams.get('evento')).toBe('supernova-sessions');
  expect(copied.searchParams.get('funcion')).toBe('supernova-sessions:main');
  await expect(share).toBeFocused();
});

test('con Web Share disponible abre la hoja del sistema con el link del evento', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: async (data: ShareData) => { (window as unknown as { shared: ShareData }).shared = data; } });
  });
  await openCommercial(page);
  await openFest(page);
  await confirmFest(page);
  await page.getByRole('button', { name: 'Compartir evento', exact: true }).click();
  const shared = await page.waitForFunction(() => (window as unknown as { shared?: ShareData }).shared).then(handle => handle.jsonValue()) as ShareData;
  expect(shared.title).toBe('Órbita Fest');
  expect(new URL(shared.url!).searchParams.get('funcion')).toBe('supernova-sessions:main');
  await expect(page.getByRole('status').filter({ hasText: 'Copiamos' })).toHaveCount(0);
});

test('en el teléfono el CTA queda siempre a mano y el pase entra en la pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCommercial(page);
  await openFest(page);
  const confirm = page.getByRole('button', { name: 'Confirmar mi lugar', exact: true });
  await expect(confirm).toBeInViewport({ ratio: 1 });
  expect(await scrollState(page)).toMatchObject({ horizontal: false });
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).scrollIntoViewIfNeeded();
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await expect(confirm).toBeInViewport({ ratio: 1 });
  await confirm.click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeInViewport();
  expect(await scrollState(page)).toEqual({ vertical: false, horizontal: false });
  await expect(page.getByRole('img', { name: 'QR de tu pase' })).toBeInViewport({ ratio: 1 });
});

test('en modo oscuro el pase y su QR conservan superficie navy y QR sobre blanco', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCommercial(page, 'dark');
  await openFest(page);
  const summaryColor = await page.locator('.cx-summary').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(summaryColor).toBe('rgb(11, 23, 48)');
  await confirmFest(page);
  expect(await scrollState(page)).toEqual({ vertical: false, horizontal: false });
  const ticket = page.getByRole('article', { name: 'Tu pase' });
  expect(await ticket.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(11, 23, 48)');
  expect(await ticket.locator('.cx-ticket-qr').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
  await decode(ticket.getByRole('img', { name: 'QR de tu pase' }));
  await page.getByRole('button', { name: 'Ver mi QR', exact: true }).click();
  const qr = page.getByRole('dialog', { name: 'Mi QR de acceso', exact: true });
  expect(await qr.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(11, 23, 48)');
  await decode(qr.locator('.qr-image'));
});

test('el QR de evento del admin en Comercial abre la versión Comercial', async ({ page }) => {
  await openCommercial(page);
  await openAdminEventQR(page, 'Órbita Fest');
  const dialog = page.getByRole('dialog', { name: 'QR de Órbita Fest', exact: true });
  const link = new URL(await decode(dialog.locator('.qr-image')));
  expect(link.pathname).toBe('/comercial/');
  await expect(dialog.getByRole('textbox', { name: 'Enlace al evento', exact: true })).toHaveValue(link.href);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
