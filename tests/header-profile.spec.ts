import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Lotes 3 y 4: header liviano con cápsula, navegación inferior, menú de ajustes,
// popovers de perfil y notificaciones, y Mi perfil como tarjeta de cuenta.
const clockDate = new Date('2026-10-07T15:00:00Z');
const pass = { id: 'SN-HEADER01', eventId: 'next-frontier', sessionId: 'next-frontier:main', name: 'Alex García', email: 'alex.garcia@demo.personal.test', companions: 0, createdAt: '2026-10-06T15:00:00Z' };

async function openCommercial(page: Page, { withPass = false, theme = 'light' }: { withPass?: boolean; theme?: 'light' | 'dark' } = {}) {
  await page.addInitScript(([registration, mode]) => {
    if (registration) localStorage.setItem('supernova-registrations-v1', JSON.stringify([JSON.parse(registration)]));
    localStorage.setItem('orbita-commercial-theme-v1', JSON.stringify(mode));
  }, [withPass ? JSON.stringify(pass) : '', theme] as const);
  await page.clock.setFixedTime(clockDate);
  await page.goto('/comercial/');
  await expect(page.getByRole('region', { name: 'Experiencias destacadas' })).toBeVisible();
}

const box = async (page: Page, selector: string) => (await page.locator(selector).first().boundingBox())!;

test('el header no salta entre arriba y la cápsula, y la sección activa queda marcada', async ({ page }) => {
  await openCommercial(page);
  for (const [width, height] of [[1440, 900], [1920, 840], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator('.site-header')).not.toHaveClass(/header-floating/);
    const top = await Promise.all(['.header-inner', '.brand-button', '.main-nav', '.header-actions'].map(selector => box(page, selector)));
    await page.evaluate(() => scrollTo(0, 700));
    await expect(page.locator('.site-header')).toHaveClass(/header-floating/);
    const scrolled = await Promise.all(['.header-inner', '.brand-button', '.main-nav', '.header-actions'].map(selector => box(page, selector)));
    expect(scrolled, `${width}x${height}`).toEqual(top);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('button', { name: 'Explorar', exact: true })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(nav.getByRole('button', { name: /^Favoritos/ })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('button', { name: 'Explorar', exact: true })).not.toHaveAttribute('aria-current', 'page');
});

test('la navegación inferior móvil muestra indicador y contadores sin superponerse a 320 px', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions', 'reset-mind'])));
  await openCommercial(page, { withPass: true });
  for (const [width, height] of [[390, 844], [320, 640]]) {
    await page.setViewportSize({ width, height });
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    const bounds = (await nav.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await expect(nav.getByRole('button', { name: 'Mis eventos (1 pase)', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Favoritos (2 guardados)', exact: true })).toBeVisible();
    await expect(nav.locator('.nav-count')).toHaveText(['1', '2']);
    await expect(nav.locator('.nav-active-surface')).toBeVisible();
    const controls = [...await nav.getByRole('button').all(), ...await page.locator('.header-actions').getByRole('button').all()];
    const boxes = [];
    for (const control of controls) {
      if (!await control.isVisible()) continue;
      const rect = (await control.boundingBox())!;
      expect(Math.min(rect.width, rect.height), `objetivo táctil en ${width}`).toBeGreaterThanOrEqual(44);
      boxes.push(rect);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const overlap = a.x < b.x + b.width - .5 && b.x < a.x + a.width - .5 && a.y < b.y + b.height - .5 && b.y < a.y + a.height - .5;
      expect(overlap, `controles superpuestos en ${width}`).toBe(false);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});

test('Ajustes reúne tema y versión, cierra con Escape y devuelve el foco', async ({ page }) => {
  await openCommercial(page);
  const trigger = page.getByRole('button', { name: 'Ajustes', exact: true });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const theme = page.getByRole('switch', { name: 'Modo oscuro' });
  await expect(theme).not.toBeChecked();
  const versions = page.getByRole('navigation', { name: 'Versiones de Órbita' });
  await expect(versions.getByRole('link')).toHaveCount(4);
  await expect(versions.getByRole('link', { name: /^Comercial / })).toHaveAttribute('aria-current', 'page');
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(theme).toBeChecked();
  await expect(theme).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(versions).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  // Keyboard only: open with Enter, move in with Tab, close with the close button.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cerrar ajustes' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(versions).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('las notificaciones llevan directo al próximo pase y devuelven el foco al cerrar', async ({ page }) => {
  await openCommercial(page, { withPass: true });
  const trigger = page.getByRole('button', { name: 'Notificaciones', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const popover = page.locator('#header-notifications');
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('heading', { name: 'Notificaciones' })).toBeVisible();
  await expect(popover.getByRole('article', { name: 'El futuro empieza acá' })).toContainText('Tu próximo pase');
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await popover.getByRole('button', { name: 'Ver mi pase' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('SN-HEADER01');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Notificaciones', exact: true })).toBeFocused();

  await page.getByRole('button', { name: 'Notificaciones', exact: true }).click();
  await popover.getByRole('button', { name: /^Ver mis eventos/ }).click();
  await expect(popover).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Mis eventos', level: 1 })).toBeVisible();
});

test('sin pases, las notificaciones invitan a explorar', async ({ page }) => {
  await openCommercial(page);
  await page.getByRole('button', { name: 'Notificaciones', exact: true }).click();
  const popover = page.locator('#header-notifications');
  await expect(popover).toContainText('Todo al día');
  await expect(popover.getByRole('button', { name: 'Ver mi pase' })).toHaveCount(0);
  await expect(popover.getByRole('button', { name: 'Explorar experiencias' })).toBeVisible();
});

test('el menú de perfil muestra la cuenta, se navega con teclado y cierra la sesión', async ({ page }) => {
  await openCommercial(page);
  const trigger = page.getByRole('button', { name: 'Abrir perfil de Alex García' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.locator('#header-profile');
  await expect(menu).toContainText('Alex García');
  await expect(menu).toContainText('alex.garcia@demo.personal.test');
  await expect(menu).toContainText('Personal interno · Personal');
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('button', { name: 'Cerrar menú de perfil' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('button', { name: 'Ver mi perfil' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: '¿Cómo entrás hoy?' })).toBeFocused();
});

for (const [width, height] of [[1440, 900], [390, 844]]) {
  test(`Mi perfil es una tarjeta de cuenta que entra en una pantalla (${width}x${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions', 'reset-mind'])));
    await openCommercial(page, { withPass: true });
    await page.getByRole('button', { name: 'Abrir perfil de Alex García' }).click();
    await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible();
    const card = page.getByRole('article', { name: 'Alex García' });
    await expect(card).toContainText('Personal interno');
    await expect(card).toContainText('alex.garcia@demo.personal.test');
    const logout = page.getByRole('button', { name: 'Cerrar sesión', exact: true });
    const novelties = page.getByRole('switch', { name: 'Recibir novedades de experiencias' });
    for (const target of [card, novelties, logout, page.getByRole('button', { name: '1 pase', exact: true })]) await expect(target).toBeInViewport({ ratio: 1 });
    if (width < 700) {
      const nav = (await page.getByRole('navigation', { name: 'Navegación principal' }).boundingBox())!;
      expect((await logout.boundingBox())!.y + 46).toBeLessThanOrEqual(nav.y);
    }
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await novelties.check();
    await expect(novelties).toBeChecked();
    await page.getByRole('button', { name: '2 favoritos', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Favoritos', level: 1 })).toBeVisible();
  });
}

test('el personal externo ve su organización y no tiene administración', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('orbita-access-v1', JSON.stringify({ kind: 'external', name: 'Dana Prueba', email: 'dana@estudionorte.test', organization: 'Estudio Norte' })));
  await openCommercial(page);
  await expect(page.getByRole('button', { name: 'Administrar' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir perfil de Dana Prueba' }).click();
  await expect(page.locator('#header-profile')).toContainText('Personal externo · Estudio Norte');
  await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
  const card = page.getByRole('article', { name: 'Dana Prueba' });
  await expect(card).toContainText('Personal externo');
  await expect(card).toContainText('Estudio Norte');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button')).toHaveCount(3);
});

test('Original usa la misma tarjeta de cuenta y el mismo menú de ajustes', async ({ page }) => {
  await page.clock.setFixedTime(clockDate);
  await page.goto('/original/');
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Modo oscuro' })).toBeChecked();
  await expect(page.getByRole('navigation', { name: 'Versiones de Órbita' }).getByRole('link', { name: /^Original / })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Abrir perfil de Alex García' }).click();
  await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Alex García' })).toBeInViewport();
  await page.getByRole('button', { name: '0 pases', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: /^Mis eventos/ })).toHaveAttribute('aria-current', 'page');
});
