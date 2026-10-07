import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const clockDate = new Date('2026-10-07T15:00:00Z');

async function openDemo(page: Page) {
  await page.clock.setFixedTime(clockDate);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
}

async function capture(page: Page, testInfo: TestInfo, name: string, fullPage = false) {
  const path = testInfo.outputPath(name);
  if (fullPage) {
    const initialScroll = await page.evaluate(() => window.scrollY);
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < scrollHeight; y += 650) {
      await page.evaluate((offset) => window.scrollTo({ top: offset, behavior: 'instant' }), y);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    }
    await page.evaluate((offset) => window.scrollTo({ top: offset, behavior: 'instant' }), initialScroll);
  }
  await page.screenshot({ path, fullPage, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

async function createWizard(page: Page, title: string) {
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await page.getByLabel('Nombre del evento').fill(title);
  await page.getByLabel('Una frase para inspirar').fill('Una experiencia para descubrir nuevas conexiones.');
  await page.getByLabel('Ubicación del evento').fill('Campus de demostración · Montevideo');
  await page.getByLabel('Fecha y hora de inicio', { exact: true }).fill('2026-11-25T18:00');
  await page.getByLabel('Fecha y hora de fin', { exact: true }).fill('2026-11-25T20:00');
  await page.getByLabel('Cupo total').fill('50');
  await page.getByLabel('Acerca de la experiencia').fill('Un encuentro de demostración para compartir ideas, aprender y conectar con otros equipos.');
}

test('la intro aparece en cada refresh, termina sola y libera navegación y foco', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Saltar intro/ })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toHaveCount(0);
  await expect(page.locator('#root')).not.toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => page.evaluate(() => document.getElementById('root')?.contains(document.activeElement))).toBe(true);
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toHaveCount(0);
  await page.getByRole('button', { name: /Mis eventos/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu próximo momento está esperando.' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a vivir el inicio' }).click();
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Volver a vivir el inicio' })).toBeFocused();
});

test('reduced motion omite la secuencia y la home muestra tres experiencias por página', async ({ page }, testInfo) => {
  await openDemo(page);
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toHaveCount(0);
  await expect(page.locator('.event-grid article')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Página siguiente de eventos', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true })).toBeVisible();
  await capture(page, testInfo, 'desktop-home.png', true);
  await page.getByRole('button', { name: 'Encontrá tu experiencia' }).click();
  await expect(page.locator('header')).toHaveClass(/header-floating/);
  const radius = await page.locator('.header-surface').evaluate((element) => Number.parseFloat(getComputedStyle(element).borderRadius));
  expect(radius).toBeGreaterThan(20);
  await capture(page, testInfo, 'desktop-catalog.png');
});

test('búsqueda, categorías, favoritos y novedades se guardan', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('textbox', { name: 'Buscar experiencias', exact: true }).fill('no-hay-un-evento-con-este-nombre');
  await expect(page.getByRole('heading', { name: 'Todavía no hay una órbita por acá.' })).toBeVisible();
  await expect(page.locator('.event-grid article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver todas las experiencias' }).click();
  await page.getByRole('button', { name: 'Bienestar', exact: true }).click();
  await expect(page.locator('.event-grid article')).toHaveCount(2);
  await page.getByRole('button', { name: /Todo el universo/ }).click();
  await page.getByRole('button', { name: 'Guardar Supernova Sessions', exact: true }).click();
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Mis favoritos', exact: true }).click();
  await expect(page.locator('.event-grid article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Quitar Supernova Sessions de favoritos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Quiero estar en órbita' }).click();
  await expect(page.getByRole('button', { name: 'Novedades activadas' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Novedades activadas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitar Supernova Sessions de favoritos', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('inscripción con términos y acompañante persiste, descarga calendario y libera plazas al cancelar', async ({ page }, testInfo) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByText('54 lugares disponibles', { exact: true })).toBeVisible();
  await modal.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(modal.getByRole('alert')).toHaveText('Aceptá los términos del evento para continuar.');
  await modal.getByRole('button', { name: 'Agregar acompañante' }).click();
  await modal.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await modal.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(modal.getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Cerrar inscripción' })).toBeFocused();
  await expect(modal.getByText('Vos + 1 acompañante', { exact: true })).toBeVisible();
  await capture(page, testInfo, 'registration-ticket.png');
  const calendar = page.waitForEvent('download');
  await modal.getByRole('button', { name: 'Agregar a mi calendario' }).click();
  const calendarDownload = await calendar;
  expect(calendarDownload.suggestedFilename()).toMatch(/\.ics$/);
  const calendarText = await readFile((await calendarDownload.path())!, 'utf8');
  expect(calendarText).toContain('DTSTART:20261023T220000Z');
  expect(calendarText).toContain('DTEND:20261024T020000Z');
  await modal.getByRole('button', { name: 'Cerrar inscripción' }).click();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Vista previa de Supernova Sessions', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Supernova Sessions', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Confirmar mi lugar' })).toHaveCount(0);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'No voy a poder asistir' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar inscripción' }).click();
  await page.getByRole('button', { name: /Mis eventos/ }).click();
  await expect(page.getByRole('heading', { name: 'Supernova Sessions', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Mis eventos/ }).click();
  await page.getByRole('button', { name: 'Ver mi pase' }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
  await page.getByRole('button', { name: 'No voy a poder asistir' }).click();
  await page.getByRole('button', { name: 'Sí, cancelar inscripción' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Tu próximo momento está esperando.' })).toBeVisible();
  await page.getByRole('button', { name: 'Explorar experiencias', exact: true }).click();
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('54 lugares disponibles', { exact: true })).toBeVisible();
});

test('wizard valida, publica audiencia privada con email y permite abrirla a la compañía', async ({ page }, testInfo) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await capture(page, testInfo, 'admin-dashboard.png');
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByLabel('Nombre del evento')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Dale un nombre de al menos 3 caracteres.', { exact: true })).toBeVisible();
  await page.getByLabel('Nombre del evento').fill('Conexión QA');
  await page.getByLabel('Ubicación del evento').fill('Campus de demostración · Montevideo');
  await page.getByLabel('Fecha y hora de inicio', { exact: true }).fill('2026-11-25T18:00');
  await page.getByLabel('Fecha y hora de fin', { exact: true }).fill('2026-11-25T20:00');
  await page.getByLabel('Acerca de la experiencia').fill('Un encuentro sintético para verificar el flujo completo de publicación de una experiencia.');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('radio', { name: /Tabla de nómina/ }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Seleccioná o importá al menos una persona para continuar.', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: /Sofía Martínez/ }).check();
  await page.getByRole('checkbox', { name: /Lucas Fernández/ }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Asunto del email').fill('{{nombre}}, nos vemos en {{evento}}');
  await page.getByLabel('Mensaje', { exact: false }).fill('Hola {{nombre}}, te esperamos en {{evento}} el {{fecha}}, en {{ubicacion}}.');
  await page.getByRole('combobox', { name: 'Personalizar para' }).click();
  await page.getByRole('option', { name: 'Lucas Fernández', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Vista previa del email' })).toContainText('Hola Lucas');
  await capture(page, testInfo, 'admin-email-step.png');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Evento privado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publicar evento', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Editar Conexión QA', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar experiencias', exact: true }).fill('Conexión QA');
  await expect(page.locator('.event-grid article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Conexión QA', exact: true }).click();
  await page.getByRole('button', { name: /Audiencia.*Las personas/ }).click();
  await page.getByRole('radio', { name: /Toda la compañía/ }).click();
  await page.getByRole('button', { name: /Revisar y publicar/ }).click();
  await page.getByRole('button', { name: 'Publicar cambios', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar experiencias', exact: true }).fill('Conexión QA');
  await expect(page.locator('.event-grid article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ver Conexión QA', exact: true })).toBeVisible();
});

test('importar Excel y CSV revisa emails, deduplica y muestra filas rechazadas', async ({ page }) => {
  await openDemo(page);
  await createWizard(page, 'Importación QA');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('radio', { name: /Importar invitados/ }).click();
  const sampleDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar modelo' }).click();
  const downloaded = await sampleDownload;
  expect(downloaded.suggestedFilename()).toMatch(/\.csv$/);
  const samplePath = await downloaded.path();
  expect(samplePath).toBeTruthy();
  await page.getByLabel('Importar lista de invitados').setInputFiles({ name: downloaded.suggestedFilename(), mimeType: 'text/csv', buffer: await readFile(samplePath!) });
  await expect(page.getByText('2 personas listas para invitar', { exact: true })).toBeVisible();
  await expect(page.getByText(/0 duplicados omitidos · 0 filas inválidas/)).toBeVisible();
  await page.getByLabel('Importar lista de invitados').setInputFiles(resolve('tests/fixtures/invitados.xlsx'));
  await expect(page.getByText('Sofía Fixture', { exact: true })).toBeVisible();
  await expect(page.getByText('Lucas Fixture', { exact: true })).toBeVisible();
  await expect(page.getByText('2 personas listas para invitar', { exact: true })).toBeVisible();
  const csv = [
    'nombre,email,area',
    'Alex García,alex.garcia@demo.telefonica.test,Tecnología',
    'Sofía Prueba,sofia@example.com,Tecnología',
    'Duplicado,SOFIA@EXAMPLE.COM,Personas',
    ',invalid@example.com,Personas',
  ].join('\n');
  await page.getByLabel('Importar lista de invitados').setInputFiles({ name: 'invitados-ficticios.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByText('2 personas listas para invitar', { exact: true })).toBeVisible();
  await expect(page.getByText(/1 duplicados omitidos · 1 filas inválidas/)).toBeVisible();
  await page.getByText('Revisar 1 filas omitidas', { exact: true }).click();
  await expect(page.getByText('Fila 5: Falta el nombre', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByLabel('Asunto del email')).toBeVisible();
});

test('a 390px la navegación y el modal funcionan sin desbordamiento horizontal', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);
  const horizontalOverflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(await horizontalOverflow()).toBe(false);
  await capture(page, testInfo, 'mobile-home.png', true);
  await page.getByRole('button', { name: /Mis eventos/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu próximo momento está esperando.' })).toBeVisible();
  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await horizontalOverflow()).toBe(false);
  await expect(page.getByRole('dialog').getByLabel('Tu nombre')).toBeVisible();
  await capture(page, testInfo, 'mobile-registration.png');
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.' })).toBeInViewport();
  expect(await page.locator('.registration-modal').evaluate(element => element.scrollTop)).toBe(0);
  await page.getByRole('button', { name: 'Cerrar inscripción' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await expect(page.getByLabel('Nombre del evento')).toBeVisible();
  expect(await horizontalOverflow()).toBe(false);
});

test('el filtro por día respeta la fecha local cuando el inicio cruza medianoche en UTC', async ({ page }) => {
  await openDemo(page);
  await createWizard(page, 'Órbita nocturna QA');
  await page.getByLabel('Fecha y hora de inicio', { exact: true }).fill('2026-11-25T23:30');
  await page.getByLabel('Fecha y hora de fin', { exact: true }).fill('2026-11-26T01:30');
  await page.getByRole('button', { name: /Revisar y publicar/ }).click();
  await page.getByRole('button', { name: 'Publicar evento', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar experiencias', exact: true }).fill('Órbita nocturna QA');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByLabel('Filtrar por fecha', { exact: true }).fill('2026-11-26');
  await expect(page.locator('.event-grid article')).toHaveCount(0);
  await page.getByLabel('Filtrar por fecha', { exact: true }).fill('2026-11-25');
  await expect(page.locator('.event-grid article')).toHaveCount(1);
});

test('los popovers nativos cierran con Escape, click exterior y navegación', async ({ page }) => {
  await openDemo(page);
  const profile = page.getByRole('button', { name: 'Abrir perfil de Alex García' });
  await profile.click();
  await expect(page.locator('#header-profile:popover-open')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#header-profile')).toBeHidden();
  await expect(profile).toBeFocused();
  await page.getByRole('button', { name: 'Notificaciones', exact: true }).click();
  await expect(page.locator('#header-notifications:popover-open')).toBeVisible();
  await page.getByRole('heading', { name: /Salí de la rutina/ }).click();
  await expect(page.locator('#header-notifications')).toBeHidden();
  await profile.click();
  await page.locator('#header-profile').getByRole('button', { name: 'Ver mi perfil' }).click();
  await expect(page.locator('#header-profile')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
});

test('el diálogo nativo bloquea el fondo y devuelve el foco al cerrar', async ({ page }) => {
  await openDemo(page);
  const trigger = page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true });
  await trigger.click();
  await expect(page.locator('dialog:modal')).toBeVisible();
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('.event-cover')?.focus());
  expect(await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(8, 8);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar inscripción' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('favoritos tiene vista propia, búsqueda y eliminación persistente', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('heading', { name: 'Lo que te gusta, cerca.' })).toBeVisible();
  await page.getByRole('button', { name: 'Descubrir experiencias' }).click();
  await page.getByRole('button', { name: 'Guardar Supernova Sessions', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar Un respiro para vos', exact: true }).click();
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.locator('.favorites-grid article')).toHaveCount(2);
  await page.getByLabel('Buscar en favoritos').fill('respiro');
  await expect(page.locator('.favorites-grid article')).toHaveCount(1);
  await page.getByLabel('Buscar en favoritos').fill('sin coincidencias');
  await expect(page.getByRole('heading', { name: 'No encontramos ese plan.' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todos mis favoritos' }).click();
  await page.getByRole('button', { name: 'Quitar Supernova Sessions de favoritos', exact: true }).click();
  await expect(page.locator('.favorites-grid article')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.locator('.favorites-grid article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Quitar Un respiro para vos de favoritos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lo que te gusta, cerca.' })).toBeVisible();
});

test('header centrado en pantallas grandes y hero compacto en el primer viewport', async ({ page }) => {
  await openDemo(page);
  for (const width of [1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 818 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const header = await page.locator('.header-inner').boundingBox();
    const nav = await page.getByRole('navigation', { name: 'Navegación principal' }).boundingBox();
    const originalBrand = await page.locator('.brand-button').boundingBox();
    expect(Math.abs(header!.x + header!.width / 2 - width / 2)).toBeLessThan(2);
    expect(Math.abs(nav!.x + nav!.width / 2 - width / 2)).toBeLessThan(2);
    await expect(page.getByRole('button', { name: 'Encontrá tu experiencia' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.getByRole('button', { name: 'Encontrá tu experiencia' }).click();
    await expect(page.locator('header')).toHaveClass(/header-floating/);
    const floating = await page.locator('.header-inner').boundingBox();
    expect(Math.abs(floating!.x + floating!.width / 2 - width / 2)).toBeLessThan(2);
    const floatingBrand = await page.locator('.brand-button').boundingBox();
    expect(Math.abs(floatingBrand!.x - originalBrand!.x)).toBeLessThan(1);
    expect(Math.abs(floatingBrand!.y - originalBrand!.y)).toBeLessThan(1);
  }
});

test('estudio sin header principal y pase fullscreen con calendario navegable', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await expect(page.locator('.site-header')).toHaveCount(0);
  await expect(page.locator('.site-footer')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Pasos para crear el evento' })).toBeVisible();
  const studioTop = await page.locator('.studio-header').boundingBox();
  expect(studioTop!.y).toBe(0);
  await page.getByRole('button', { name: 'Volver a eventos' }).click();
  await expect(page.locator('.site-header')).toBeVisible();
  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await expect(page.locator('.site-header')).toHaveCount(0);
  const size = await page.locator('dialog:modal').boundingBox();
  expect(size).toMatchObject({ x: 0, y: 0, width: 1440, height: 1000 });
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.locator('.calendar-event-day time')).toHaveAttribute('datetime', '2026-10-23');
  await expect(page.locator('.calendar-table')).toBeVisible();
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
  await expect(page.locator('#event-calendar-month')).toHaveText('noviembre de 2026');
  await expect(page.locator('.calendar-event-day')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ir a la fecha del evento' }).click();
  await expect(page.locator('.calendar-event-day time')).toHaveAttribute('datetime', '2026-10-23');
  await page.keyboard.press('Escape');
  await expect(page.locator('.site-header')).toBeVisible();
});

test('navegación móvil inferior incluye admin y el perfil permite cerrar la sesión demo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  const bounds = await nav.boundingBox();
  expect(bounds!.y).toBeGreaterThan(740);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  await expect(nav.getByRole('button')).toHaveCount(4);
  await nav.getByRole('button', { name: 'Administrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Crear experiencia', exact: true })).toBeVisible();
  await nav.getByRole('button', { name: 'Explorar', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar Supernova Sessions', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir perfil de Alex García' }).click();
  const menu = page.locator('#header-profile');
  await expect(menu.getByRole('button', { name: 'Ver mis eventos' })).toHaveCount(0);
  await expect(menu.getByRole('button', { name: 'Mis favoritos' })).toHaveCount(0);
  await menu.getByRole('button', { name: 'Ver mi perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
  await page.getByRole('switch', { name: 'Recibir novedades de experiencias' }).check();
  await page.getByRole('button', { name: 'Abrir perfil de Alex García' }).click();
  await page.locator('#header-profile').getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Sesión cerrada.' })).toBeVisible();
  await expect(page.locator('.site-header')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sesión cerrada.' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a entrar' }).click();
  await expect(page.getByRole('button', { name: 'Quitar Supernova Sessions de favoritos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Novedades activadas' })).toBeVisible();
});

test('select y calendario custom funcionan con teclado y los términos del creador son opt-in', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await expect(page.locator('select,input[type="date"],input[type="datetime-local"],input[type="color"]')).toHaveCount(0);
  const terms = page.getByRole('switch', { name: 'Activar términos y condiciones' });
  await expect(terms).not.toBeChecked();
  await expect(page.getByLabel('Condiciones de participación')).toHaveCount(0);
  await terms.check();
  await page.getByLabel('Condiciones de participación').fill('Condiciones de esta experiencia de prueba.');
  await terms.uncheck();
  await expect(page.getByLabel('Condiciones de participación')).toHaveCount(0);
  await terms.check();
  await expect(page.getByLabel('Condiciones de participación')).toHaveValue('Condiciones de esta experiencia de prueba.');
  const category = page.getByRole('combobox', { name: 'Categoría', exact: true });
  await category.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox', { name: 'Categoría', exact: true })).toBeVisible();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(category).toContainText('Aprendizaje');
  await page.getByRole('button', { name: 'Abrir calendario de fecha y hora de inicio' }).click();
  const calendar = page.getByRole('dialog', { name: 'Calendario de fecha y hora de inicio' });
  await expect(calendar).toBeVisible();
  await calendar.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  await calendar.getByRole('button', { name: /25 de noviembre de 2026/ }).click();
  await calendar.getByRole('textbox', { name: 'Hora', exact: true }).fill('18');
  await calendar.getByRole('textbox', { name: 'Minutos', exact: true }).fill('30');
  await calendar.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.getByLabel('Fecha y hora de inicio', { exact: true })).toHaveValue('25/11/2026 · 18:30');
  await page.getByRole('button', { name: 'Abrir calendario de fecha y hora de inicio' }).click();
  await page.keyboard.press('Escape');
  await expect(calendar).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir calendario de fecha y hora de inicio' })).toBeFocused();
});

test('filtros admin aplican por buscar, tags se quitan en modal y paginado limita a diez', async ({ page }) => {
  await openDemo(page);
  await page.evaluate(() => {
    const originals = JSON.parse(localStorage.getItem('supernova-events-v1')!);
    const events = Array.from({ length: 12 }, (_, index) => ({ ...originals[index % originals.length], id: `qa-page-${index}`, title: `Evento QA ${String(index + 1).padStart(2, '0')}`, status: index % 2 === 0 ? 'published' : 'draft', isPrivate: index % 3 === 0 }));
    localStorage.setItem('supernova-events-v1', JSON.stringify(events));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await expect(page.locator('.admin-event-table tbody tr')).toHaveCount(10);
  await expect(page.locator('.admin-events-heading,.admin-events-toolbar')).toHaveCount(0);
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.locator('.admin-event-table tbody tr')).toHaveCount(2);
  await page.getByLabel('Buscar experiencias en administración').fill('Evento QA');
  await page.getByRole('combobox', { name: 'Estado', exact: true }).click();
  await page.getByRole('option', { name: 'Publicados', exact: true }).click();
  await expect(page.locator('.admin-event-table tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: /Más filtros/ }).click();
  await page.getByRole('combobox', { name: 'Audiencia', exact: true }).click();
  await page.getByRole('option', { name: 'Toda la compañía', exact: true }).click();
  await page.getByLabel('Fecha desde', { exact: true }).fill('2026-10-01');
  await page.getByLabel('Fecha hasta', { exact: true }).fill('2026-12-31');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('.admin-event-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.dashboard-applied-filters>button')).toHaveCount(5);
  await page.getByRole('button', { name: /Ver filtros aplicados: Nombre/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Filtros aplicados', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.dashboard-filter-modal-list>div')).toHaveCount(5);
  await dialog.getByRole('button', { name: 'Quitar filtro Nombre', exact: true }).click();
  await expect(page.locator('.dashboard-applied-filters>button')).toHaveCount(4);
  await dialog.getByRole('button', { name: 'Reiniciar todos', exact: true }).click();
  await dialog.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect(page.locator('.admin-event-table tbody tr')).toHaveCount(10);
  await expect(page.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Filas por página', exact: true }).click();
  await page.getByRole('option', { name: '5', exact: true }).click();
  await expect(page.locator('.admin-event-table tbody tr')).toHaveCount(5);
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.locator('.dashboard-page-buttons')).toContainText('2 / 3');
});

test('pase completo sin scroll en desktop y móvil, incluso en meses de seis filas', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
  await page.getByLabel('Email corporativo', { exact: true }).fill('sin-email');
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Completá tu nombre y un email válido.');
  await page.getByLabel('Email corporativo', { exact: true }).fill('alex.garcia@demo.telefonica.test');
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Aceptá los términos');
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
  for (const [width, height] of [[1440, 818], [1920, 818], [1366, 768], [1280, 550], [1024, 600], [390, 844], [390, 667], [320, 667]]) {
    await page.setViewportSize({ width, height });
    for (const selector of ['.registration-modal', '.success-content']) {
      const overflow = await page.locator(selector).evaluate(element => ({ vertical: element.scrollHeight > element.clientHeight + 1, horizontal: element.scrollWidth > element.clientWidth + 1 }));
      expect(overflow, `${selector} en ${width}x${height}`).toEqual({ vertical: false, horizontal: false });
    }
    await expect(page.getByRole('button', { name: 'Descargar pase' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'No voy a poder asistir' })).toBeInViewport();
    await expect(page.locator('.calendar-table')).toBeInViewport();
  }
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
  await expect(page.locator('.calendar-table tbody tr')).toHaveCount(6);
  expect(await page.locator('.registration-modal').evaluate(element => element.scrollHeight > element.clientHeight + 1)).toBe(false);
});
