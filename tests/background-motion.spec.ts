import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function openSpatialBackground(page: Page, version: 'hibrida' | '3d') {
  await page.clock.setFixedTime(new Date('2026-10-13T15:00:00Z'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/${version}/`);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-cinematic-intro]')).toHaveCount(0);
  await expect(page.locator('[data-universe-host]')).toHaveAttribute('data-universe-status', 'ready', { timeout: 20_000 });
  const background = page.locator('#tour-nebula-backdrop');
  await expect(background).toHaveAttribute('data-motion', 'running');
  await expect(background.locator('.tour-nebula-stars > circle')).toHaveCount(60);
  return background;
}

async function sampleLayers(background: Locator) {
  return background.evaluate(element => [element, ...element.querySelectorAll<HTMLElement>(
    '.tour-nebula-layers, .tour-nebula-parallax, .tour-nebula-image, .tour-nebula-glow, .tour-nebula-particle',
  )].map(layer => {
    const style = getComputedStyle(layer);
    return {
      transform: style.transform,
      shiftX: style.getPropertyValue('--tour-nebula-shift-x'),
      shiftY: style.getPropertyValue('--tour-nebula-shift-y'),
    };
  }));
}

async function expectFramesAdvance(background: Locator) {
  const frame = Number(await background.getAttribute('data-frame'));
  await expect.poll(async () => Number(await background.getAttribute('data-frame'))).toBeGreaterThan(frame);
}

async function expectBackgroundFrozen(background: Locator) {
  const frame = await background.getAttribute('data-frame');
  const styles = await background.evaluate(element => [...element.querySelectorAll(
    '.tour-nebula-layers, .tour-nebula-image, .tour-nebula-glow, .tour-nebula-particle',
  )].map(layer => getComputedStyle(layer).animationPlayState));
  expect(styles.every(state => state === 'paused')).toBe(true);
  // Cross two publication intervals to distinguish a pause from one still frame.
  await background.page().waitForTimeout(700);
  await expect(background).toHaveAttribute('data-frame', frame!);
}

for (const version of ['hibrida', '3d'] as const) {
  test(`${version}: mover el mouse no desplaza el fondo y las estrellas siguen activas`, async ({ page }) => {
    const background = await openSpatialBackground(page, version);
    // Hold autonomous CSS motion only; the controller remains in normal motion.
    await background.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => animation.pause()));
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    const before = await sampleLayers(background);
    expect(before.every(layer => layer.shiftX === '' && layer.shiftY === '')).toBe(true);
    const viewport = page.viewportSize()!;
    await page.mouse.move(12, 12);
    await page.mouse.move(viewport.width - 12, viewport.height - 12);
    await expectFramesAdvance(background);
    // Cover the removed pointer transition's complete duration.
    await page.waitForTimeout(400);
    expect(await sampleLayers(background)).toEqual(before);
    await expect(background).toHaveAttribute('data-motion', 'running');
  });
}

test('el fondo conserva pausa manual, movimiento reducido y pausa por pestaña oculta', async ({ page }) => {
  const background = await openSpatialBackground(page, 'hibrida');
  await expectFramesAdvance(background);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('supernova:background-motion', { detail: { paused: true } })));
  await expect(background).toHaveAttribute('data-motion', 'paused');
  await expectBackgroundFrozen(background);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('supernova:background-motion', { detail: { paused: false } })));
  await expect(background).toHaveAttribute('data-motion', 'running');
  await expectFramesAdvance(background);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(background).toHaveAttribute('data-motion', 'reduced');
  await expectBackgroundFrozen(background);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(background).toHaveAttribute('data-motion', 'running');
  await expectFramesAdvance(background);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(background).toHaveAttribute('data-motion', 'paused');
  await expectBackgroundFrozen(background);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(background).toHaveAttribute('data-motion', 'running');
  await expectFramesAdvance(background);
});
