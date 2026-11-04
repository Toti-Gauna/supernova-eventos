import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated WCAG 2.1 A/AA audit of the Comercial views in both themes. Critical and serious
// violations fail the test; the report lists the rule, the impact and the first offending nodes.
const themes = ['light', 'dark'] as const;

async function audit(page: Page, label: string) {
  await page.evaluate(() => document.fonts.ready);
  // Contrast is only meaningful once view transitions end: one view in <main>, fully opaque,
  // and no finite opacity animation still running (dialogs, toasts, cards).
  await page.waitForFunction(() => {
    const views = document.querySelectorAll('#main-content > div');
    const settledView = views.length <= 1 && [...views].every(view => getComputedStyle(view).opacity === '1');
    const fading = document.getAnimations().some(animation => animation.playState === 'running' && animation.effect?.getTiming().iterations !== Infinity && (animation.effect as KeyframeEffect | null)?.getKeyframes().some(frame => 'opacity' in frame));
    // Motion animates some fades with inline styles; inside the app, any opacity strictly between
    // 0 and 1 is mid-fade (the twinkling stars of the backdrop live outside .app-shell).
    const inlineFade = [...document.querySelectorAll<HTMLElement>('.app-shell [style*="opacity"]')].some(element => { const value = parseFloat(element.style.opacity); return value > 0 && value < 1; });
    return settledView && !fading && !inlineFade;
  });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const blocking = result.violations.filter(violation => violation.impact === 'critical' || violation.impact === 'serious');
  const summary = blocking.map(violation => `${label} · ${violation.id} (${violation.impact}): ${violation.nodes.slice(0, 4).map(node => `${node.target.join(' ')} [${(node.any[0]?.message ?? '').split('. Expected')[0]}]`).join(' | ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
}

for (const theme of themes) {
  test.describe(`Comercial sin errores de accesibilidad graves · tema ${theme === 'light' ? 'claro' : 'oscuro'}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(value => window.localStorage.setItem('orbita-commercial-theme-v1', JSON.stringify(value)), theme);
    });

    test('home, inscripción, pase, mis eventos, favoritos, perfil y administración', async ({ page }) => {
      await page.goto('/comercial/');
      await expect(page.getByRole('region', { name: 'Experiencias destacadas' })).toBeVisible();
      await audit(page, 'home');

      await page.locator('.event-card').first().locator('.card-cta').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await audit(page, 'inscripción');
      const confirm = page.getByRole('button', { name: /Confirmar mi lugar/ });
      if (await confirm.count()) {
        const terms = page.getByRole('checkbox', { name: /Acepto/ });
        if (await terms.count()) await terms.check();
        await confirm.click();
        await expect(page.getByRole('heading', { name: /Ya sos parte|Tu lugar|confirmad/i }).first()).toBeVisible();
        await audit(page, 'pase');
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);

      await page.getByRole('button', { name: /^Mis eventos/ }).first().click();
      await expect(page.getByRole('heading', { level: 1, name: 'Mis eventos' })).toBeVisible();
      await audit(page, 'mis eventos');

      await page.getByRole('button', { name: /^Favoritos/ }).first().click();
      await expect(page.getByRole('heading', { level: 1, name: 'Favoritos' })).toBeVisible();
      await audit(page, 'favoritos');

      await page.getByRole('button', { name: /Abrir perfil/ }).click();
      await page.getByRole('button', { name: /Ver mi perfil/ }).click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await audit(page, 'perfil');

      await page.getByRole('button', { name: 'Administrar' }).first().click();
      await expect(page.getByRole('heading', { level: 1, name: /Administrar experiencias/ })).toBeVisible();
      await audit(page, 'administración');
    });

    test.describe('acceso', () => {
      test.use({ storageState: { cookies: [], origins: [] } });
      test('pantalla de ingreso', async ({ page }) => {
        await page.goto('/comercial/');
        await expect(page.getByRole('heading', { name: '¿Cómo entrás hoy?' })).toBeVisible();
        await audit(page, 'acceso');
      });
    });
  });
}
