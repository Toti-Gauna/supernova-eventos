import { expect, test, type Page } from '@playwright/test';
import jsQR from 'jsqr';
import { readFile } from 'node:fs/promises';
import { INITIAL_EVENTS } from '../src/data/events';
import type { Registration } from '../src/types';

const event = INITIAL_EVENTS.find(item => item.id === 'supernova-sessions')!;
const pass: Registration = { id: 'SN-CHECKIN-TEST', eventId: event.id, sessionId: event.sessions![0].id, sessionSnapshot: event.sessions![0], name: 'Alex García', email: 'alex@example.test', companions: 1, createdAt: '2026-10-12T15:00:00Z' };
const payload = JSON.stringify({ type: 'supernova-demo-pass', version: 1, passId: pass.id, eventId: pass.eventId, sessionId: pass.sessionId });

async function open(page: Page, version = 'hibrida') {
  await page.clock.setFixedTime(new Date('2026-10-13T15:00:00Z'));
  await page.addInitScript(registration => localStorage.setItem('supernova-registrations-v1', JSON.stringify([registration])), pass);
  await page.goto(`/${version}/`);
  await expect(page.locator('.app-shell')).not.toHaveClass(/intro-playing/);
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
}
async function admin(page: Page) {
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Registrar pase', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Registrar pase', exact: true });
  await dialog.getByRole('combobox', { name: 'Evento', exact: true }).selectOption(event.id);
  await dialog.getByRole('combobox', { name: 'Función', exact: true }).selectOption(pass.sessionId!);
  return { dialog, trigger };
}

async function readQR(page: Page, source: string, width: number, height = width) {
  const raster = await page.evaluate(async ({ source, width, height }) => {
    const image = new Image(); image.src = source; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    let binary = '';
    for (let offset = 0; offset < pixels.length; offset += 32768) binary += String.fromCharCode(...pixels.subarray(offset, offset + 32768));
    return btoa(binary);
  }, { source, width, height });
  const bytes = Buffer.from(raster, 'base64');
  const qr = jsQR(new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.byteLength), width, height);
  expect(qr, 'QR leído por un decoder independiente').not.toBeNull();
  return qr!.data;
}

for (const version of ['original', '3d', 'hibrida']) {
  test(`${version}: QR embebido en pase y descarga, ingreso único y foco al cerrar`, async ({ page }) => {
    await open(page, version);
    await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
    const image = page.getByRole('img', { name: 'QR de tu pase', exact: true });
    await expect(image).toBeVisible();
    const source = await image.getAttribute('src');
    const size = await image.boundingBox();
    expect(await readQR(page, source!, Math.round(size!.width))).toBe(payload);
    const pendingDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar pase', exact: true }).click();
    const download = await pendingDownload;
    expect(download.suggestedFilename()).toMatch(/^orbita-pase-supernova-sessions-SN-CHECKIN-TEST\.svg$/);
    const svg = await readFile((await download.path())!, 'utf8');
    expect(svg).toContain('Alex García');
    expect(await readQR(page, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, 1200, 720)).toBe(payload);
    await page.setViewportSize({ width:320, height:667 });
    const mobileSize = await image.boundingBox();
    expect(mobileSize!.width).toBeGreaterThanOrEqual(112);
    expect(await readQR(page, source!, Math.round(mobileSize!.width))).toBe(payload);
    await expect(page.getByRole('button', { name:'Descargar pase',exact:true })).toBeInViewport();
    await page.setViewportSize({ width:1440,height:1000 });
    await page.keyboard.press('Escape');
    const { dialog, trigger } = await admin(page);
    await dialog.getByRole('textbox', { name: 'QR o código del pase', exact: true }).fill(payload);
    await dialog.getByRole('button', { name: 'Validar pase', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Pase válido', exact: true })).toBeVisible();
    await expect(dialog).toContainText('2 lugares');
    await dialog.getByRole('button', { name: 'Registrar ingreso', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Ingreso registrado', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Validar pase', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Este pase ya tiene un ingreso registrado.', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Registrar ingreso', exact: true })).toHaveCount(0);
    const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-pass-check-ins-v1')!));
    expect(entries).toHaveLength(1); expect(entries[0].people).toBe(2); expect(entries[0].sessionId).toBe(pass.sessionId);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
  });
}

test('admin rechaza QR adulterado, pase inexistente y función incorrecta sin registrar ingresos', async ({ page }) => {
  await open(page);
  const { dialog } = await admin(page);
  const input = dialog.getByRole('textbox', { name: 'QR o código del pase', exact: true });
  for (const value of ['SN-NO-EXISTE', JSON.stringify({ ...JSON.parse(payload), version: 2 }), JSON.stringify({ ...JSON.parse(payload), sessionId: event.sessions![1].id })]) {
    await input.fill(value); await dialog.getByRole('button', { name: 'Validar pase', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Pase no válido', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Registrar ingreso', exact: true })).toHaveCount(0);
  }
  await dialog.getByRole('combobox', { name: 'Función', exact: true }).selectOption(event.sessions![1].id);
  await input.fill(pass.id); await dialog.getByRole('button', { name: 'Validar pase', exact: true }).click();
  await expect(dialog).toContainText('otra función');
  expect(await page.evaluate(() => localStorage.getItem('supernova-pass-check-ins-v1'))).toBeNull();
});

test('el registro vuelve a validar una reserva cancelada y una función vencida', async ({ page }) => {
  await open(page);
  const { dialog } = await admin(page);
  await dialog.getByRole('textbox', { name: 'QR o código del pase', exact: true }).fill(payload);
  await dialog.getByRole('button', { name: 'Validar pase', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Pase válido', exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('supernova-registrations-v1', '[]'));
  await dialog.getByRole('button', { name: 'Registrar ingreso', exact: true }).click();
  await expect(dialog).toContainText('no existe una reserva vigente');
  expect(await page.evaluate(() => localStorage.getItem('supernova-pass-check-ins-v1'))).toBeNull();
  await page.evaluate(pass => {
    localStorage.setItem('supernova-registrations-v1', JSON.stringify([pass]));
  }, pass);
  await dialog.getByRole('button', { name: 'Validar pase', exact: true }).click();
  await page.clock.setFixedTime(new Date('2026-10-25T15:00:00Z'));
  await dialog.getByRole('button', { name: 'Registrar ingreso', exact: true }).click();
  await expect(dialog).toContainText('la función terminó');
  expect(await page.evaluate(() => localStorage.getItem('supernova-pass-check-ins-v1'))).toBeNull();
});

test('admin lee el QR de un pase SVG descargado y permite registrar su ingreso', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
  const pendingDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar pase', exact: true }).click();
  const file = await pendingDownload;
  await page.keyboard.press('Escape');
  const { dialog } = await admin(page);
  await dialog.locator('input[type="file"]').setInputFiles({ name: file.suggestedFilename(), mimeType: 'image/svg+xml', buffer: await readFile((await file.path())!) });
  await expect(dialog.getByRole('heading', { name: 'Pase válido', exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(dialog.getByRole('textbox', { name: 'QR o código del pase', exact: true })).toHaveValue(payload);
  await dialog.getByRole('button', { name: 'Registrar ingreso', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Ingreso registrado', exact: true })).toBeVisible();
});
