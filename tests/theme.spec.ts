import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function openDemo(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-07T15:00:00Z'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
}

async function expectLightSurface(locator: Locator) {
  const color = await locator.evaluate(element => {
    const styles = getComputedStyle(element);
    return styles.backgroundColor === 'rgba(0, 0, 0, 0)' ? styles.backgroundImage.match(/rgba?\([^)]+\)/)?.[0] ?? styles.backgroundColor : styles.backgroundColor;
  });
  const channels = color.match(/[\d.]+/g)?.map(Number) ?? [];
  expect(channels.length, `Fondo visible: ${color}`).toBeGreaterThanOrEqual(3);
  expect(Math.min(...channels.slice(0, 3)), `Superficie clara: ${color}`).toBeGreaterThan(230);
}

test('la escena orbital está en el HTML inicial incluso antes de descargar React', async ({ page }) => {
  await page.route('**/src/main.tsx*', route => route.abort());
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const bootstrap = page.locator('#intro-bootstrap');
  await expect(bootstrap).toBeVisible();
  await expect(bootstrap.locator('svg')).toBeVisible();
  await expect(page.locator('#root')).toBeEmpty();
  await expect(bootstrap).not.toContainText(/UN PUNTO DE ENCUENTRO|SUPERNOVA \/ EXPERIENCIAS|HECHO PARA CONECTAR|ESTAMOS MÁS CERCA/);
});

test('la intro pendiente mantiene animación, aislamiento y Escape mientras llega el chunk', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/src/features/intro/CinematicIntro.tsx*', async route => { await pending; await route.continue(); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const intro = page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' });
  await expect(intro).toBeVisible();
  await expect(intro).toHaveClass(/intro-pending/);
  await expect(intro.locator('.intro-orbital-map')).toBeVisible();
  await expect(page.locator('.intro-loading,#intro-bootstrap')).toHaveCount(0);
  expect(await page.locator('#root').evaluate(element => element.inert)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(intro).toHaveCount(0);
  release();
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  expect(await page.locator('#root').evaluate(element => element.inert)).toBe(false);
  await expect(page.locator('#main-content')).toBeFocused();
});

test('oscuro inicial ignora el tema del sistema y el usuario conserva su elección al refrescar', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await openDemo(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const toggle = page.getByRole('button', { name: 'Activar modo claro' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Activar modo oscuro' })).toBeFocused();
  await expectLightSurface(page.locator('.event-card').first());
  await page.reload();
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.locator('html').evaluate(element => getComputedStyle(element).colorScheme)).toBe('light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f8f7fc');
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Activar modo claro' })).toBeVisible();
});

test('tema claro cubre popovers, perfil, favoritos, admin y los controles del estudio', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Activar modo claro' }).click();
  await page.getByRole('button', { name: 'Notificaciones', exact: true }).click();
  await expectLightSurface(page.locator('#header-notifications'));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Guardar Supernova Sessions', exact: true }).click();
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expectLightSurface(page.locator('.event-card').first());
  await page.getByRole('button', { name: 'Abrir perfil de Alex García' }).click();
  await expectLightSurface(page.locator('#header-profile'));
  await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
  await expectLightSurface(page.locator('.profile-details-card'));
  await page.getByRole('switch', { name: 'Recibir novedades de experiencias' }).check();
  await expectLightSurface(page.locator('.supernova-toast'));
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await expectLightSurface(page.locator('.dashboard-table-section'));
  await expectLightSurface(page.locator('.dashboard-metric').first());
  await page.getByRole('combobox', { name: 'Estado', exact: true }).click();
  await expectLightSurface(page.getByRole('listbox', { name: 'Estado', exact: true }));
  await page.getByRole('option', { name: 'Publicados', exact: true }).click();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /Ver filtros aplicados: Estado/ }).click();
  await expectLightSurface(page.getByRole('dialog', { name: 'Filtros aplicados', exact: true }));
  await page.getByRole('button', { name: 'Cerrar filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await expectLightSurface(page.locator('.wizard-main-panel'));
  await page.getByRole('combobox', { name: 'Categoría', exact: true }).click();
  await expectLightSurface(page.getByRole('listbox', { name: 'Categoría', exact: true }));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Abrir calendario de fecha y hora de inicio' }).click();
  await expectLightSurface(page.getByRole('dialog', { name: 'Calendario de fecha y hora de inicio', exact: true }));
  await page.keyboard.press('Escape');
  await expect(page.getByRole('switch', { name: 'Activar términos y condiciones' })).not.toBeChecked();
});

test('inscripción y pase conservan contraste, acciones y calendario completos en modo claro', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Activar modo claro' }).click();
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await expectLightSurface(page.locator('.registration-form-panel'));
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Aceptá los términos');
  await expectLightSurface(page.getByRole('alert'));
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
  await expectLightSurface(page.locator('.event-calendar'));
  for (const [width, height] of [[1440, 818], [1280, 550], [390, 667], [320, 667]]) {
    await page.setViewportSize({ width, height });
    const overflow = await page.locator('.registration-modal').evaluate(element => ({ horizontal: element.scrollWidth > element.clientWidth + 1, vertical: element.scrollHeight > element.clientHeight + 1 }));
    expect(overflow, `${width}x${height}`).toEqual({ horizontal: false, vertical: false });
    await expect(page.getByRole('button', { name: 'Descargar pase' })).toBeInViewport();
    await expect(page.locator('.calendar-event-day')).toBeInViewport();
  }
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Mis eventos/ }).click();
  await expectLightSurface(page.locator('.my-event').first());
});

test('selector y scrollbars custom mantienen la geometría del header en todas las anchuras', async ({ page }) => {
  await openDemo(page);
  for (const width of [320, 390, 701, 768, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    const header = page.locator('.header-inner');
    const logo = page.getByRole('button', { name: 'Supernova, ir a inicio' });
    const theme = page.getByRole('button', { name: /Activar modo/ });
    const first = await logo.boundingBox();
    const action = await theme.boundingBox();
    expect(first!.x + first!.width, `logo sin solapamiento en ${width}`).toBeLessThan(action!.x);
    await page.evaluate(() => scrollTo(0, 250));
    await expect(page.locator('.header-floating')).toBeVisible();
    const second = await logo.boundingBox();
    expect(second!.x).toBeCloseTo(first!.x, 0);
    expect(second!.y).toBeCloseTo(first!.y, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (width > 700) {
      const nav = await page.getByRole('navigation', { name: 'Navegación principal' }).boundingBox();
      const bounds = await header.boundingBox();
      expect(nav!.x + nav!.width / 2).toBeCloseTo(bounds!.x + bounds!.width / 2, 0);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await themeClick(page);
  await expectLightSurface(page.getByRole('navigation', { name: 'Navegación principal' }));
  const scrollbar = await page.locator('html').evaluate(element => ({ width: getComputedStyle(element, '::-webkit-scrollbar').width, button: getComputedStyle(element, '::-webkit-scrollbar-button').display, thumb: getComputedStyle(element, '::-webkit-scrollbar-thumb').borderRadius }));
  expect(scrollbar).toEqual({ width: '10px', button: 'none', thumb: '20px' });
});

async function themeClick(page: Page) { await page.getByRole('button', { name: 'Activar modo claro' }).click(); }
