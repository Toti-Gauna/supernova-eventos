import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const clockDate = new Date('2026-10-07T15:00:00Z');
const gateHeading = (page: Page) => page.getByRole('heading', { name: '¿Cómo entrás hoy?' });

async function openGate(page: Page, path = '/') {
  await page.clock.setFixedTime(clockDate);
  await page.goto(path);
  await expect(gateHeading(page)).toBeVisible();
}

async function enterAsGuest(page: Page) {
  await page.getByRole('button', { name: 'Personal externo', exact: true }).click();
  await page.getByLabel('Nombre y apellido').fill('Dana Prueba');
  await page.getByLabel('Email', { exact: true }).fill('dana@proveedor.test');
  await page.getByLabel('Organización').fill('Proveedor QA');
  await page.getByLabel('Código de invitación').fill('orbita-2026');
  await page.getByRole('button', { name: 'Ingresar como invitado' }).click();
  await expect(page.getByRole('button', { name: 'Abrir perfil de Dana Prueba' })).toBeVisible();
}

async function searchCatalog(page: Page, query: string) {
  await page.getByRole('textbox', { name: 'Buscar experiencias', exact: true }).fill(query);
}

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('la primera visita ofrece acceso interno y externo, y valida la invitación', async ({ page }) => {
    await openGate(page);
    await expect(page.getByRole('button', { name: 'Personal interno', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Soy parte del equipo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vengo con una invitación' })).toBeHidden();
    await expect(page.locator('.site-header')).toHaveCount(0);
    await page.getByRole('button', { name: 'Personal externo', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Vengo con una invitación' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Soy parte del equipo' })).toBeHidden();

    await page.getByRole('button', { name: 'Ingresar como invitado' }).click();
    await expect(page.getByText('Completá tu nombre y apellido.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Nombre y apellido')).toBeFocused();
    await expect(page.getByLabel('Nombre y apellido')).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel('Nombre y apellido').fill('Dana Prueba');
    await page.getByLabel('Email', { exact: true }).fill('dana@proveedor.test');
    await page.getByLabel('Código de invitación').fill('OTRO-CODIGO');
    await page.getByRole('button', { name: 'Ingresar como invitado' }).click();
    await expect(page.getByText('El código no coincide con una invitación vigente.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Código de invitación')).toBeFocused();

    await page.getByLabel('Código de invitación').fill('orbita-2026');
    await page.getByRole('button', { name: 'Ingresar como invitado' }).click();
    await expect(page.getByRole('button', { name: 'Abrir perfil de Dana Prueba' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Administrar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Todo el universo/ })).toContainText('3');
    await searchCatalog(page, 'Un respiro');
    await expect(page.locator('.event-grid article')).toHaveCount(0);
    await searchCatalog(page, 'Órbita Fest');
    await expect(page.locator('.event-grid article')).toHaveCount(1);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Abrir perfil de Dana Prueba' })).toBeVisible();
    await page.getByRole('button', { name: 'Abrir perfil de Dana Prueba' }).click();
    await expect(page.locator('#header-profile')).toContainText('Personal externo · Invitación externa');
  });

  test('el personal externo se inscribe con sus datos y no abre eventos internos por enlace', async ({ page }) => {
    await openGate(page, '/?evento=reset-mind');
    await enterAsGuest(page);
    await expect(page.getByText('Este evento es solo para personal interno.', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Órbita Fest', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Tu nombre')).toHaveValue('Dana Prueba');
    await expect(dialog.getByLabel('Email', { exact: true })).toHaveValue('dana@proveedor.test');
  });

  test('cada versión muestra el acceso antes de entrar', async ({ page }) => {
    for (const path of ['/original/', '/hibrida/', '/comercial/']) {
      await openGate(page, path);
      await page.getByRole('button', { name: 'Ingresar con cuenta corporativa' }).click();
      await expect(page.getByRole('button', { name: 'Abrir perfil de Alex García' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Administrar', exact: true })).toBeVisible();
      await page.evaluate(() => localStorage.removeItem('orbita-access-v1'));
    }
  });
});

test.describe('acceso en una sola pantalla', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const fitsViewport = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight);

  test('en laptop entra completo y alterna las dos puertas sin mover la pantalla', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await openGate(page, '/comercial/');
    await expect(page.getByRole('heading', { name: 'Soy parte del equipo' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Ingresar con cuenta corporativa' })).toBeInViewport();
    expect(await fitsViewport(page)).toBe(true);
    const heading = await gateHeading(page).boundingBox();
    await page.getByRole('button', { name: 'Personal externo', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ingresar como invitado' })).toBeInViewport();
    expect(await fitsViewport(page)).toBe(true);
    expect((await gateHeading(page).boundingBox())?.y).toBe(heading?.y);
  });

  test('en teléfono un selector alterna las tarjetas sin scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openGate(page, '/comercial/');
    const internal = page.getByRole('button', { name: 'Personal interno', exact: true });
    const external = page.getByRole('button', { name: 'Personal externo', exact: true });
    await expect(internal).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Vengo con una invitación' })).toBeHidden();
    expect(await fitsViewport(page)).toBe(true);
    await external.click();
    await expect(external).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Soy parte del equipo' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Ingresar como invitado' })).toBeInViewport();
    expect(await fitsViewport(page)).toBe(true);
  });
});

test('el personal interno ve todo y define quién descubre cada evento', async ({ page }) => {
  await page.clock.setFixedTime(clockDate);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Todo el universo/ })).toContainText('7');
  await expect(page.locator('.event-access-chip', { hasText: 'Abierto a invitados' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Órbita Fest', level: 2 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quiero ir a Órbita Fest' })).toBeVisible();

  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await page.getByLabel('Nombre del evento').fill('Encuentro con proveedores');
  await page.getByLabel('Ubicación del evento').fill('Campus de demostración');
  await page.getByLabel('Fecha y hora de inicio', { exact: true }).fill('2026-11-25T18:00');
  await page.getByLabel('Fecha y hora de fin', { exact: true }).fill('2026-11-25T20:00');
  await page.getByLabel('Acerca de la experiencia').fill('Un encuentro sintético para verificar que solo el personal externo lo descubra.');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('radio', { name: /^Personal interno/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: /^Personal externo/ }).click();
  await expect(page.getByRole('radio', { name: /Tabla de nómina/ })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /Todos los invitados/ })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText(/Personal externo · /)).toBeVisible();
  await page.getByRole('button', { name: 'Publicar evento', exact: true }).click();
  await expect(page.locator('.admin-event-table tbody tr', { hasText: 'Encuentro con proveedores' })).toContainText('Personal externo');

  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  await searchCatalog(page, 'Encuentro con proveedores');
  await expect(page.locator('.event-grid article')).toHaveCount(0);

  await page.getByRole('button', { name: 'Abrir perfil de Alex García' }).click();
  await page.locator('#header-profile').getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(gateHeading(page)).toBeFocused();
  await enterAsGuest(page);
  await searchCatalog(page, 'Encuentro con proveedores');
  await expect(page.locator('.event-grid article')).toHaveCount(1);
});
