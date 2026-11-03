import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const clockDate = new Date('2026-10-07T15:00:00Z');

async function openCommercial(page: Page, motion: 'reduce' | 'no-preference' = 'reduce') {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.clock.setFixedTime(clockDate);
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto('/comercial/');
  await expect(page.getByRole('region', { name: 'Experiencias destacadas' })).toBeVisible();
  return requests;
}

test('Comercial no carga espacio, planetas ni intro y arranca en tema claro', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const requests = await openCommercial(page);
  await expect(page.locator('html')).toHaveAttribute('data-experience', 'commercial');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#tour-nebula-backdrop')).toBeHidden();
  await expect(page.locator('[data-cinematic-intro],#intro-bootstrap')).toHaveCount(0);
  await expect(page.locator('canvas,[data-universe-host],.ambient-stars,.cosmos-art')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Volver a vivir el inicio/ })).toHaveCount(0);
  expect(requests.filter(url => /UniverseExperience|HybridExperience|@react-three|three\.js|CinematicIntro/.test(url))).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Órbita, eventos que nos conectan', level: 1 })).toBeAttached();
  expect(errors).toEqual([]);

  // Its theme is its own: switching it does not change the shared preference of the other versions.
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('supernova-theme-v1'))).toBeNull();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('el carrusel destacado cambia con pestañas y flechas y abre la inscripción', async ({ page }) => {
  await openCommercial(page);
  const hero = page.getByRole('region', { name: 'Experiencias destacadas' });
  const tabs = hero.getByRole('group', { name: 'Elegir experiencia destacada' }).getByRole('button');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.first()).toHaveAttribute('aria-current', 'true');
  await expect(hero.getByRole('heading', { name: 'Órbita Fest', level: 2 })).toBeVisible();
  await expect(hero.getByText('DESTACADO · MÚSICA')).toBeVisible();

  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute('aria-current', 'true');
  const third = (await tabs.nth(2).textContent())!.trim();
  await expect(hero.getByRole('heading', { name: third, level: 2 })).toBeVisible();
  await hero.getByRole('button', { name: 'Experiencia destacada anterior' }).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'true');
  await hero.getByRole('button', { name: 'Experiencia destacada siguiente' }).click();
  await hero.getByRole('button', { name: 'Experiencia destacada siguiente' }).click();
  await hero.getByRole('button', { name: 'Experiencia destacada siguiente' }).click();
  await expect(tabs.first()).toHaveAttribute('aria-current', 'true');

  await hero.getByRole('button', { name: 'Quiero ir a Órbita Fest' }).click();
  await expect(page.getByRole('dialog', { name: 'Órbita Fest', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await hero.getByRole('button', { name: 'Ver todas las experiencias' }).click();
  await expect(page.locator('#experiencias')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Experiencias', level: 2 })).toBeInViewport();
  await expect(page.getByText('Buenos momentos. Mejor compañía.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Todas/ })).toHaveAttribute('aria-pressed', 'true');
});

test('con un pase vigente, el atajo «Tu próximo pase» lo abre en un toque', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supernova-registrations-v1', JSON.stringify([{
    id: 'SN-NEXTPASS', eventId: 'next-frontier', sessionId: 'next-frontier:main', name: 'Alex García', email: 'alex.garcia@demo.personal.test', companions: 0, createdAt: '2026-10-06T15:00:00Z',
  }])));
  await openCommercial(page);
  const hero = page.getByRole('region', { name: 'Experiencias destacadas' });
  await expect(hero.getByRole('button', { name: 'Ver todas las experiencias' })).toHaveCount(0);
  const shortcut = hero.getByRole('button', { name: /^Tu próximo pase El futuro empieza acá/ });
  await expect(shortcut).toBeVisible();
  await shortcut.click();
  const dialog = page.getByRole('dialog', { name: /Ya sos parte|El futuro empieza acá/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('SN-NEXTPASS');
  await page.keyboard.press('Escape');
  await expect(shortcut).toBeFocused();
});

test('con movimiento permitido rota sola y se puede pausar', async ({ page }) => {
  await openCommercial(page, 'no-preference');
  const hero = page.getByRole('region', { name: 'Experiencias destacadas' });
  const tabs = hero.getByRole('group', { name: 'Elegir experiencia destacada' }).getByRole('button');
  await page.mouse.move(5, 5);
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 12_000 });
  await hero.getByRole('button', { name: 'Pausar rotación de destacados' }).click();
  await page.mouse.move(5, 5);
  await page.locator('body').focus();
  await page.waitForTimeout(8_000);
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(hero.getByRole('button', { name: 'Reanudar rotación de destacados' })).toHaveAttribute('aria-pressed', 'true');
});

test('el selector de versiones lleva a Comercial y conserva la sesión y los favoritos', async ({ page }) => {
  await page.clock.setFixedTime(clockDate);
  await page.goto('/original/');
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar Órbita Fest', exact: true }).click();
  await page.getByRole('button', { name: 'Cambiar versión', exact: true }).click();
  await page.getByRole('navigation', { name: 'Versiones de Órbita' }).getByRole('link', { name: /^Comercial / }).click();
  await expect(page).toHaveURL(/\/comercial\/$/);
  await expect(page.getByRole('button', { name: 'Cambiar versión', exact: true })).toContainText('Comercial');
  await expect(page.getByRole('button', { name: 'Abrir perfil de Alex García' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitar Órbita Fest de favoritos', exact: true })).toBeVisible();
});
