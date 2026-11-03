import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const date = new Date('2026-10-09T15:00:00Z');
async function open(page: Page, path: string, motion: 'reduce' | 'no-preference' = 'reduce') {
  await page.clock.setFixedTime(date);
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto(path);
  await expect(page.getByRole('dialog', { name:'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name:/Salí de la rutina/ })).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/intro-playing/);
}
async function arrived(page: Page, destination: string) {
  const host = page.locator('[data-universe-host]');
  await expect(host).toHaveAttribute('data-universe-status', 'ready', { timeout:20000 });
  await expect(host).toHaveAttribute('data-universe-destination', destination);
  const id = await host.getAttribute('data-universe-request');
  await expect(host).toHaveAttribute('data-universe-settled', id!);
  await expect(host).toHaveAttribute('data-universe-travelling', 'false');
}

test('el selector del header cambia las tres versiones y conserva pases y favoritos', async ({ page }) => {
  await open(page, '/3d/');
  await page.getByRole('button', { name:'Guardar Órbita Fest', exact:true }).click();
  await page.getByRole('button', { name:'Ver Órbita Fest', exact:true }).click();
  await page.getByRole('checkbox', { name:'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name:'Confirmar mi lugar', exact:true }).click();
  await page.getByRole('button', { name:'Volver', exact:true }).click();
  for (const [name, path, experience] of [['2D + 3D','/hibrida/','hybrid'],['Original','/original/','original'],['3D','/3d/','3d']]) {
    await page.getByRole('button', { name:'Cambiar versión', exact:true }).click();
    await page.getByRole('navigation', { name:'Versiones de Órbita' }).getByRole('link', { name:new RegExp(`^${name.replace(/[+]/g, '\\+')} `) }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('dialog', { name:'Te damos la bienvenida a Órbita' })).toHaveCount(0);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-experience', experience);
    await expect(page.getByRole('button', { name:'Quitar Órbita Fest de favoritos', exact:true })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!).length)).toBe(1);
  }
});

for (const version of ['original','3d','hibrida']) {
  test(`volver recupera eventos y foco desde perfil, admin y detalle en ${version}`, async ({ page }) => {
    await page.setViewportSize({ width:390, height:844 });
    await open(page, `/${version}/`);
    await page.getByRole('button', { name:'Abrir perfil de Alex García', exact:true }).click();
    await page.getByRole('button', { name:'Ver mi perfil', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Mi perfil', exact:true })).toBeVisible();
    await page.getByRole('button', { name:'Volver a eventos', exact:true }).click();
    await expect(page.getByRole('button', { name:'Ver eventos', exact:true })).toBeVisible();
    await page.getByRole('button', { name:'Administrar', exact:true }).click();
    await page.getByRole('button', { name:'Volver a eventos', exact:true }).click();
    const trigger = page.getByRole('button', { name:'Ver Órbita Fest', exact:true });
    await trigger.click();
    await page.getByRole('button', { name:'Volver', exact:true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.getByRole('button', { name:/^Mis eventos/ }).click();
    await page.getByRole('button', { name:'Volver a eventos', exact:true }).click();
    await expect(page.getByRole('button', { name:'Ver eventos', exact:true })).toBeVisible();
  });
}
test('las tres versiones tienen accesos independientes y la original no carga Three', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await open(page, '/original/');
  await expect(page.locator('[data-experience="original"].app-shell')).toBeVisible();
  await expect(page.locator('canvas,[data-universe-host],.universe-section-art')).toHaveCount(0);
  await expect(page.locator('.cosmos-art svg')).toBeVisible();
  expect(requests.filter(url => /UniverseExperience|HybridExperience|@react-three|three\.js/.test(url))).toEqual([]);
  await page.getByRole('button', { name:/^Mis eventos/ }).click();
  await expect(page.getByRole('heading', { name:'Tu próximo momento está esperando.' })).toBeVisible();
  await page.getByRole('link', { name:'Ver versiones', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Elegí tu universo.' })).toBeVisible();
  await expect(page.locator('.versions-grid>a')).toHaveCount(4);
  await page.locator('.version-3d').click();
  await arrived(page, 'section:explore');
  await expect(page.locator('canvas[data-universe-camera]')).toHaveCount(1);
});
test('la híbrida conserva un Canvas y viaja entre ilustraciones sin esferas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, '/hibrida/', 'no-preference');
  await arrived(page, 'section:explore');
  const canvas = await page.locator('canvas').elementHandle();
  const before = await page.locator('canvas').getAttribute('data-hybrid-camera');
  await expect(page.locator('canvas')).toHaveAttribute('data-hybrid-spheres', '0');
  await page.getByRole('button', { name:/^Mis eventos/ }).click();
  await arrived(page, 'section:registrations');
  expect(await page.locator('canvas').getAttribute('data-hybrid-camera')).not.toBe(before);
  await page.getByRole('button', { name:/^Favoritos/ }).click();
  await arrived(page, 'section:favorites');
  expect(await page.locator('canvas').evaluate((node, original) => node === original, canvas!)).toBe(true);
  expect(errors).toEqual([]);
});
test('la híbrida abre un evento, emite un pase y vuelve con Escape y foco', async ({ page }) => {
  await open(page, '/hibrida/');
  const trigger = page.getByRole('button', { name:'Ver Órbita Fest', exact:true });
  await trigger.click();
  await arrived(page, 'event:supernova-sessions');
  const dialog = page.getByRole('dialog', { name:'Órbita Fest', exact:true });
  await dialog.getByRole('checkbox', { name:'Acepto los términos y condiciones del evento.' }).check();
  await dialog.getByRole('button', { name:'Confirmar mi lugar', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Ya sos parte.', exact:true })).toBeVisible();
  await arrived(page, 'event:supernova-sessions');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!).length)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await arrived(page, 'section:explore');
});
test('el admin entra a la cabina híbrida y conserva el borrador al salir', async ({ page }) => {
  await open(page, '/hibrida/');
  const canvas = await page.locator('canvas').elementHandle();
  await page.getByRole('button', { name:'Administrar', exact:true }).click();
  await arrived(page, 'section:admin');
  await page.getByRole('button', { name:'Crear experiencia', exact:true }).click();
  await arrived(page, 'studio');
  await page.getByLabel('Nombre del evento').fill('Encuentro entre órbitas');
  await page.getByRole('button', { name:'Volver a eventos', exact:true }).click();
  await arrived(page, 'section:admin');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova:event-builder:v1')!).event.title)).toBe('Encuentro entre órbitas');
  expect(await page.locator('canvas').evaluate((node, original) => node === original, canvas!)).toBe(true);
});
test('la híbrida reduce movimiento y mantiene los formularios sin WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(contextId: string, ...args: unknown[]) {
      if (contextId === 'webgl' || contextId === 'webgl2') return null;
      return Reflect.apply(getContext, this, [contextId, ...args]);
    } as typeof getContext;
  });
  await open(page, '/hibrida/');
  const host = page.locator('[data-universe-host]');
  await expect(host).toHaveAttribute('data-universe-status', 'fallback');
  await page.getByRole('button', { name:'Ver Órbita Fest', exact:true }).click();
  await expect(page.getByRole('dialog', { name:'Órbita Fest', exact:true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(host).toHaveAttribute('data-universe-travelling', 'false');
});
test('la híbrida pierde y recupera el contexto conservando el destino', async ({ page }) => {
  await open(page, '/hibrida/');
  await arrived(page, 'section:explore');
  const canvas = await page.locator('canvas').elementHandle();
  const supported = await page.locator('canvas').evaluate(element => {
    const gl = (element as HTMLCanvasElement).getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    Object.assign(element, { __restore: () => extension.restoreContext() });
    extension.loseContext(); return true;
  });
  test.skip(!supported, 'WEBGL_lose_context no disponible');
  await expect(page.locator('[data-universe-host]')).toHaveAttribute('data-universe-status', 'context-lost');
  await page.getByRole('button', { name:/^Favoritos/ }).click();
  await page.locator('canvas').evaluate(element => (element as unknown as { __restore: () => void }).__restore());
  await arrived(page, 'section:favorites');
  expect(await page.locator('canvas').evaluate((node, original) => node === original, canvas!)).toBe(true);
});
