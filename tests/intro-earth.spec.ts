import { expect, test } from '@playwright/test';

for (const version of ['hibrida', '3d']) {
  for (const viewport of [{ width:1440,height:1000 }, { width:320,height:667 }]) {
    test(`${version}: Tierra coincide con la carga, se acerca y aterriza a la derecha en ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const date = new Date('2026-10-13T15:00:00Z');
      // Install before GSAP imports so its captured Date.now and camera timing agree.
      await page.clock.install({ time:date });
      await page.goto(`/${version}/`);
      const host = page.locator('[data-universe-host]');
      await expect(host).toHaveAttribute('data-universe-status', 'ready', { timeout:20_000 });
      await expect(page.locator('.intro-playing')).toHaveCount(0);
      const originalCanvas = await host.locator('canvas').elementHandle();
      const originalSky = await page.locator('#tour-nebula-backdrop').elementHandle();
      await page.emulateMedia({ reducedMotion:'no-preference' });
      const now = await page.evaluate(() => Date.now());
      await page.clock.pauseAt(new Date(now + 100));
      await page.evaluate(() => {
        scrollTo({ top:0,behavior:'instant' });
        document.querySelector<HTMLButtonElement>('.footer-main > button')!.click();
      });
      await expect(page.getByRole('dialog', { name:'Bienvenido a Supernova Eventos' })).toBeVisible();
      await page.clock.runFor(900);
      const opening = await page.evaluate(() => {
        const bounds = document.querySelector('.intro-orbital-map')!.getBoundingClientRect();
        const scale = Math.min(bounds.width / 480,bounds.height / 380);
        const canvas = document.querySelector('canvas')!;
        return { expected:[bounds.left + bounds.width / 2 + 60 * scale,bounds.top + bounds.height / 2 - 33 * scale,28 * scale],
          actual:canvas.dataset.universeEarthScreen!.split(',').map(Number),
          far:Number(canvas.dataset.universeCameraFar),depth:Number(canvas.dataset.universeEarthDepth),
          fallback:getComputedStyle(document.querySelector('.universe-fallback')!).visibility };
      });
      for (let index = 0; index < 3; index++) expect(Math.abs(opening.actual[index] - opening.expected[index])).toBeLessThan(2);
      expect(opening.far).toBeGreaterThan(opening.depth + 3);
      expect(opening.fallback).toBe('hidden');
      await page.clock.runFor(900);
      const approach = (await host.locator('canvas').getAttribute('data-universe-earth-screen'))!.split(',').map(Number);
      expect(approach[2]).toBeGreaterThan(opening.actual[2] * 1.8);
      expect(Math.hypot(approach[0] - opening.actual[0],approach[1] - opening.actual[1])).toBeLessThan(2);
      await page.clock.runFor(600);
      const closest = (await host.locator('canvas').getAttribute('data-universe-earth-screen'))!.split(',').map(Number);
      expect(closest[2]).toBeGreaterThan(opening.actual[2] * 3);
      await page.clock.runFor(950);
      const slot = await page.locator('.cosmos-planet-slot').boundingBox();
      const landing = (await host.locator('canvas').getAttribute('data-universe-earth-screen'))!.split(',').map(Number);
      expect(Math.hypot(landing[0] - (slot!.x + slot!.width * .51),landing[1] - (slot!.y + slot!.height * .46))).toBeLessThan(3);
      expect(landing[0]).toBeGreaterThan(viewport.width * .5);
      if (viewport.width > 700) expect(landing[2]).toBeLessThanOrEqual(230);
      await page.clock.runFor(350);
      await expect(page.getByRole('dialog', { name:'Bienvenido a Supernova Eventos' })).toHaveCount(0);
      await expect(host).toHaveAttribute('data-universe-travelling','false');
      expect(await host.locator('canvas').evaluate((canvas,original) => canvas === original,originalCanvas!)).toBe(true);
      expect(await page.locator('#tour-nebula-backdrop').evaluate((sky,original) => sky === original,originalSky!)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  }
}
