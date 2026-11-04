import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { INITIAL_EVENTS } from '../src/data/events';

const hostSelector = '[data-universe-host]';
const businessDate = new Date('2026-10-07T15:00:00Z');

async function openUniverse(page: Page, motion: 'reduce' | 'no-preference' = 'reduce') {
  // Fixed business dates leave performance.now(), rAF and travel deadlines running.
  await page.clock.setFixedTime(businessDate);
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  const host = page.locator(hostSelector);
  await expect(host).toHaveAttribute('data-universe-status', 'ready', { timeout: 20_000 });
  await expect(host.locator('canvas')).toHaveCount(1);
  return host;
}

async function expectSettled(host: Locator, destination: string, outcome = 'arrived') {
  await expect(host).toHaveAttribute('data-universe-destination', destination);
  const requestId = await host.getAttribute('data-universe-request');
  expect(requestId).not.toBeNull();
  await expect(host).toHaveAttribute('data-universe-settled', requestId!, { timeout: 15_000 });
  await expect(host).toHaveAttribute('data-universe-outcome', outcome);
  await expect(host).toHaveAttribute('data-universe-travelling', 'false');
  return Number(requestId);
}

async function observeTravelling(host: Locator) {
  await host.evaluate(element => {
    const samples: string[] = [];
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.oldValue === 'true') samples.push('true');
        samples.push(element.getAttribute('data-universe-travelling') ?? '');
      }
    });
    observer.observe(element, { attributes: true, attributeOldValue: true, attributeFilter: ['data-universe-travelling'] });
    Object.assign(element, { __travelSamples: samples, __travelObserver: observer });
  });
}

async function stopObserving(host: Locator) {
  return host.evaluate(element => {
    const observed = element as HTMLElement & { __travelSamples: string[]; __travelObserver: MutationObserver };
    observed.__travelObserver.disconnect();
    return observed.__travelSamples;
  });
}

async function openProfile(page: Page, timeout?: number) {
  await page.getByRole('button', { name: 'Abrir perfil de Alex García', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mi perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible({ timeout });
}

async function observeCommands(host: Locator) {
  await host.evaluate(element => {
    const requests: string[] = [];
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.oldValue) requests.push(record.oldValue);
        requests.push(element.getAttribute('data-universe-request') ?? '');
      }
    });
    observer.observe(element, { attributes: true, attributeOldValue: true, attributeFilter: ['data-universe-request'] });
    Object.assign(element, { __commandRequests: requests, __commandObserver: observer });
  });
}

async function stopObservingCommands(host: Locator) {
  return host.evaluate(element => {
    const observed = element as HTMLElement & { __commandRequests: string[]; __commandObserver: MutationObserver };
    observed.__commandObserver.disconnect();
    return [...new Set(observed.__commandRequests.filter(Boolean))];
  });
}

async function fillWizardIdea(page: Page, name: string) {
  await page.getByLabel('Nombre del evento').fill(name);
  await page.getByLabel('Una frase para inspirar').fill('Un encuentro para probar el viaje a la cabina.');
  await page.getByLabel('Ubicación del evento').fill('Campus de demostración · Montevideo');
  await page.getByLabel('Fecha y hora de inicio', { exact: true }).fill('2026-11-25T18:00');
  await page.getByLabel('Fecha y hora de fin', { exact: true }).fill('2026-11-25T20:00');
  await page.getByLabel('Acerca de la experiencia').fill('Un encuentro ficticio para compartir ideas, aprender y conectar con otros equipos.');
}

test('los viajes interrumpidos llegan al último planeta y conservan el Canvas único', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const host = await openUniverse(page, 'no-preference');
  await expectSettled(host, 'section:explore');
  const canvas = await host.locator('canvas').elementHandle();
  expect(canvas).not.toBeNull();
  const initialCamera = await host.locator('canvas').getAttribute('data-universe-camera');
  expect(initialCamera).not.toBeNull();

  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(host).toHaveAttribute('data-universe-travelling', 'true');
  const interruptedRequest = Number(await host.getAttribute('data-universe-request'));
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
  const lastRequest = await expectSettled(host, 'section:favorites');
  expect(lastRequest).toBeGreaterThan(interruptedRequest);
  const history = async () => JSON.parse(await host.getAttribute('data-universe-settlement-history') || '[]') as { requestId: number; outcome: string }[];
  await expect.poll(history).toContainEqual({ requestId: interruptedRequest, outcome: 'cancelled' });
  const settledHistory = await history();
  const settledIds = settledHistory.map(result => result.requestId);
  expect(new Set(settledIds).size).toBe(settledIds.length);
  expect(settledHistory).toContainEqual({ requestId: lastRequest, outcome: 'arrived' });
  await expect(page.getByRole('button', { name: /^Favoritos/ })).toHaveAttribute('aria-current', 'page');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', 'favorites');
  const finalCamera = await host.locator('canvas').getAttribute('data-universe-camera');
  expect(finalCamera).not.toBeNull();
  const origin = initialCamera!.split(',').map(Number);
  const destination = finalCamera!.split(',').map(Number);
  expect(Math.hypot(...destination.map((value, index) => value - origin[index]))).toBeGreaterThan(1);

  await page.getByRole('button', { name: 'Explorar', exact: true }).click();
  await expectSettled(host, 'section:explore');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', 'explore');
  await expect(host.locator('canvas')).toHaveCount(1);
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
  expect(errors).toEqual([]);
});

test('movimiento reducido resuelve navegación sin activar vuelos y mantiene el fondo negro en ambos temas', async ({ page }) => {
  const host = await openUniverse(page);
  await observeTravelling(host);
  for (const destination of [
    { label: /^Mis eventos/, value: 'section:registrations' },
    { label: /^Favoritos/, value: 'section:favorites' },
    { label: /^Explorar$/, value: 'section:explore' },
  ]) {
    await page.getByRole('button', { name: destination.label }).click();
    await expectSettled(host, destination.value);
  }
  expect(await stopObserving(host)).not.toContain('true');
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') { await page.getByRole('button', { name: 'Ajustes', exact: true }).click(); await page.getByRole('switch', { name: 'Modo oscuro' }).click(); await page.keyboard.press('Escape'); }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    // The DOM shell is transparent so the black WebGL/fallback layer remains visible.
    const backgrounds = await page.evaluate(() => [document.documentElement, document.body, document.querySelector('[data-universe-host]')!, document.querySelector('.app-shell')!].map(element => getComputedStyle(element).backgroundColor));
    expect(backgrounds).toEqual(['rgb(2, 2, 5)', 'rgb(2, 2, 5)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']);
  }
});

test('fallar el chunk 3D permite navegar, abrir un evento con teclado y restituir foco', async ({ page }) => {
  await page.route('**/*UniverseExperience*', route => route.abort('failed'));
  await page.clock.setFixedTime(businessDate);
  await page.goto('/');
  const host = page.locator(hostSelector);
  await expect(host).toHaveAttribute('data-universe-status', 'fallback');
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar Órbita Fest', exact: true }).click();
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expectSettled(host, 'section:favorites', 'fallback');
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Ver Órbita Fest', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Órbita Fest', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Confirmar mi lugar', exact: true })).toBeEnabled();
  await expectSettled(host, 'event:supernova-sessions', 'fallback');
  await dialog.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await dialog.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!).length)).toBe(1);
  await expectSettled(host, 'event:supernova-sessions', 'fallback');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expectSettled(host, 'section:favorites', 'fallback');
  await expect(host.locator('canvas')).toHaveCount(0);
});

test('WebGL ausente conserva la app operativa y no deja solicitudes pendientes', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
      if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') return null;
      return Reflect.apply(original, this, [contextId, ...args]);
    } as typeof original;
  });
  await page.clock.setFixedTime(businessDate);
  await page.goto('/');
  const host = page.locator(hostSelector);
  await expect(host).toHaveAttribute('data-universe-status', 'fallback');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu agenda está libre.' })).toBeVisible();
  await expectSettled(host, 'section:registrations', 'fallback');
  await page.getByRole('button', { name: 'Explorar experiencias', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver Órbita Fest', exact: true })).toBeVisible();
  await expectSettled(host, 'section:explore', 'fallback');
});

test('perder el contexto WebGL libera la última navegación y conserva el Canvas para recuperarlo', async ({ page }) => {
  const host = await openUniverse(page);
  const canvas = await host.locator('canvas').elementHandle();
  const supported = await host.locator('canvas').evaluate(async element => {
    const canvasElement = element as HTMLCanvasElement;
    const gl = canvasElement.getContext('webgl2') ?? canvasElement.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('WebGL no emitió webglcontextlost.')), 2_000);
      canvasElement.addEventListener('webglcontextlost', () => { window.clearTimeout(timer); resolve(); }, { once: true });
      extension.loseContext();
    });
    return true;
  });
  test.skip(!supported, 'Este navegador no ofrece WEBGL_lose_context para provocar la pérdida real.');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu agenda está libre.' })).toBeVisible();
  await expect(host).toHaveAttribute('data-universe-destination', 'section:registrations');
  const requestId = await host.getAttribute('data-universe-request');
  await expect(host).toHaveAttribute('data-universe-settled', requestId!);
  await expect(host).toHaveAttribute('data-universe-outcome', /^(arrived|fallback)$/);
  await expect(host).toHaveAttribute('data-universe-status', /^(ready|fallback|context-lost)$/);
  await expect(host).toHaveAttribute('data-universe-travelling', 'false');
  await expect(host.locator('canvas')).toHaveCount(1);
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
});

test('un chunk de intro tardío libera la app dentro del deadline y no reaparece al llegar', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route('**/src/features/intro/CinematicIntro.tsx*', async route => {
    requested = true;
    await pending;
    await route.continue();
  });
  try {
    // Mount React first; replay isolates a delayed GSAP chunk from a slow main bundle.
    await openUniverse(page, 'reduce');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
      const timing = { seen: false, elapsedMs: null as number | null };
      const observer = new MutationObserver(records => {
        if (document.querySelector('[data-cinematic-intro]')) timing.seen = true;
        for (const record of records) for (const node of record.removedNodes) {
          if (!(node instanceof HTMLElement) || !node.hasAttribute('data-cinematic-intro')) continue;
          if (document.querySelector('[data-cinematic-intro]')) continue;
          timing.elapsedMs = performance.now() - Number(node.dataset.introStartedAt);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      Object.assign(window, { __universeIntroTiming: timing });
    });
    const replay = page.getByRole('button', { name: /Volver a vivir el inicio/ });
    await replay.click();
    const intro = page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' });
    const timing = () => page.evaluate(() => (window as Window & { __universeIntroTiming: { seen: boolean; elapsedMs: number | null } }).__universeIntroTiming);
    await expect.poll(async () => (await timing()).seen).toBe(true);
    await expect(intro).toHaveCount(0, { timeout: 4_500 });
    await expect.poll(async () => (await timing()).elapsedMs).not.toBeNull();
    expect((await timing()).elapsedMs!).toBeLessThan(4_000);
    expect(requested).toBe(true);
    expect(await page.locator('#root').evaluate(element => (element as HTMLElement).inert)).toBe(false);
    await expect(replay).toBeFocused();
    await page.getByRole('button', { name: /^Mis eventos/ }).click();
    await expect(page.getByRole('heading', { name: 'Tu agenda está libre.' })).toBeVisible();
    const response = page.waitForResponse(response => response.url().includes('/src/features/intro/CinematicIntro.tsx') && response.ok());
    release();
    await response;
    await expectSettled(page.locator(hostSelector), 'section:registrations');
    await expect(intro).toHaveCount(0);
    expect(await page.locator('#root').evaluate(element => (element as HTMLElement).inert)).toBe(false);
  } finally {
    release();
  }
});

test('la pausa voluntaria persiste y cambia destinos sin bloquear navegación', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  await openProfile(page);
  await expectSettled(host, 'section:profile');
  await page.getByRole('button', { name: 'Pausar movimiento', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reanudar movimiento', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await observeTravelling(host);
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expectSettled(host, 'section:favorites');
  expect(await stopObserving(host)).not.toContain('true');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/intro-playing/);
  await expectSettled(host, 'section:explore');
  // With Playwright's fixed clock, performance.now() keeps counting across reload() while the new
  // page's animation timeline restarts, so view fades start late. Real browsers reset both.
  await openProfile(page, 45_000);
  const resume = page.getByRole('button', { name: 'Reanudar movimiento', exact: true });
  await expect(resume).toHaveAttribute('aria-pressed', 'true');
  await resume.click();
  await expect(page.getByRole('button', { name: 'Pausar movimiento', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(host).toHaveAttribute('data-universe-travelling', 'true');
  await expectSettled(host, 'section:registrations');
});

test('al leer una sección lejos de su planeta el ambiente pausa y la navegación sigue operativa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions', 'reset-mind', 'next-frontier'])));
  const host = await openUniverse(page, 'no-preference');
  const canvas = await host.locator('canvas').elementHandle();
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expectSettled(host, 'section:favorites');
  await expect(host).toHaveAttribute('data-universe-paused', 'false');

  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(host).toHaveAttribute('data-universe-paused', 'true');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-motion', 'static');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(page.getByRole('heading', { name: 'Mis eventos', exact: true })).toBeVisible();
  await expectSettled(host, 'section:registrations');
  await expect(host).toHaveAttribute('data-universe-paused', 'false');
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
});

test('cerrar un evento vuelve al planeta de origen y devuelve el foco al control que lo abrió', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions'])));
  const host = await openUniverse(page, 'no-preference');
  const canvas = await host.locator('canvas').elementHandle();
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
  await expectSettled(host, 'section:favorites');
  const trigger = page.getByRole('button', { name: 'Ver Órbita Fest', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Órbita Fest', exact: true })).toBeVisible();
  await expectSettled(host, 'event:supernova-sessions');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expectSettled(host, 'section:favorites');
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
});

test('la cabina abre una vez, los pasos no viajan y la vista previa devuelve el borrador intacto', async ({ page }) => {
  const host = await openUniverse(page);
  const canvas = await host.locator('canvas').elementHandle();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await expectSettled(host, 'section:admin');
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  const studioRequest = await expectSettled(host, 'studio');
  await observeCommands(host);
  const title = 'Cabina QA · borrador preservado';
  await fillWizardIdea(page, title);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿A quiénes vamos a invitar?' })).toBeVisible();
  await page.getByRole('radio', { name: /Toda la compañía/ }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Asunto del email').fill('Cabina QA · invitación local');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Una idea. Muchas historias por venir.' })).toBeVisible();
  expect(await stopObservingCommands(host)).toEqual([]);
  await expect(host).toHaveAttribute('data-universe-request', String(studioRequest));
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('supernova:event-builder:v1') || 'null')?.step)).toBe(3);
  const originalDraft = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova:event-builder:v1')!).event);
  const preview = page.getByRole('button', { name: 'Ver como participante', exact: true });
  await preview.click();
  await expect(page.getByRole('dialog', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('Vista previa de la experiencia.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar mi lugar', exact: true })).toHaveCount(0);
  await expectSettled(host, `event:${originalDraft.id}`);
  await page.keyboard.press('Escape');
  await expect(preview).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Una idea. Muchas historias por venir.' })).toBeVisible();
  await expectSettled(host, 'studio');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova:event-builder:v1')!).event)).toEqual(originalDraft);
  await page.locator('.studio-stepper button').first().click();
  await expect(page.getByLabel('Nombre del evento')).toHaveValue(title);
  await page.getByRole('button', { name: 'Volver a eventos', exact: true }).click();
  await expectSettled(host, 'section:admin');
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
});

test('la inscripción válida guarda el pase antes del cue y fallar o reabrir no vuelve a celebrarlo', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Órbita Fest', exact: true });
  const eventRequest = await expectSettled(host, 'event:supernova-sessions');
  await modal.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Aceptá los términos del evento para continuar.');
  await expect(host).toHaveAttribute('data-universe-request', String(eventRequest));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1') || '[]').length)).toBe(0);
  await modal.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.evaluate(() => {
    const samples: number[][] = [];
    let frame = 0;
    const sample = () => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-universe-host] canvas');
      if (canvas?.dataset.universeCueActive === 'true') samples.push(canvas.dataset.universeCamera!.split(',').map(Number));
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    Object.assign(window, { __cueCameraSamples: samples, __cueCameraStop: () => cancelAnimationFrame(frame) });
  });
  await modal.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
  await expect(host).toHaveAttribute('data-universe-reason', 'registration-success');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!).filter((registration: { eventId: string }) => registration.eventId === 'supernova-sessions').length)).toBe(1);
  await expectSettled(host, 'event:supernova-sessions');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-cue-active', 'false');
  const cueCameras = await page.evaluate(() => {
    const state = window as Window & { __cueCameraSamples: number[][]; __cueCameraStop: () => void };
    state.__cueCameraStop();
    return state.__cueCameraSamples;
  });
  expect(cueCameras.length).toBeGreaterThan(1);
  // The pass has its own measured region. Only motion during the cue should stay quiet.
  expect(Math.max(...cueCameras.map(camera => Math.hypot(...camera.map((value, index) => value - cueCameras[0][index]))))).toBeLessThan(.12);
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click();
  await expectSettled(host, 'section:explore');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(page.getByRole('button', { name: 'Ver mi pase', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver mi pase', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
  await expect(host).toHaveAttribute('data-universe-reason', 'open-event');
  await expectSettled(host, 'event:supernova-sessions');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-cue-active', 'false');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!).length)).toBe(1);
});

test('replay mantiene Favoritos, conserva el scroll y un reloj nuevo sin resetear sus datos', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions', 'reset-mind'])));
  const host = await openUniverse(page, 'no-preference');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
  await expectSettled(host, 'section:favorites');
  const replay = page.getByRole('button', { name: 'Volver a vivir el inicio', exact: true });
  await replay.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  const started = await page.evaluate(() => performance.now());
  await replay.click();
  const intro = page.getByRole('dialog', { name: 'Te damos la bienvenida a Órbita' });
  await expect(intro).toBeVisible();
  const introStarted = Number(await page.locator('[data-cinematic-intro]').getAttribute('data-intro-started-at'));
  expect(introStarted).toBeGreaterThanOrEqual(started);
  await expect(host).toHaveAttribute('data-universe-destination', 'section:favorites');
  await expect(host).toHaveAttribute('data-universe-travelling', 'true');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', /solar/);
  await expect(intro).toHaveCount(0, { timeout: 4_500 });
  await expectSettled(host, 'section:favorites');
  await expect(replay).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-favorites-v1')!))).toEqual(['supernova-sessions', 'reset-mind']);
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
});

test('cambiar reduced motion en pleno vuelo resuelve el destino y apaga la estela', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  await expectSettled(host, 'section:explore');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(host).toHaveAttribute('data-universe-travelling', 'true');
  const request = await host.getAttribute('data-universe-request');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectSettled(host, 'section:registrations');
  await expect(host).toHaveAttribute('data-universe-request', request!);
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-motion', 'static');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-trail-count', '0');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(host).toHaveAttribute('data-universe-travelling', 'false');
  await expect(host).toHaveAttribute('data-universe-request', request!);
});

test('ocultar la pestaña durante un vuelo resuelve la última intención sin reproducirla al volver', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  await expectSettled(host, 'section:explore');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(host).toHaveAttribute('data-universe-travelling', 'true');
  // Exercise the visibility boundary deterministically in headless Chromium.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(host).toHaveAttribute('data-universe-paused', 'true');
  await expectSettled(host, 'section:registrations');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  const latest = await expectSettled(host, 'section:favorites');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-trail-count', '0');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(host).toHaveAttribute('data-universe-paused', 'false');
  await expect(host).toHaveAttribute('data-universe-request', String(latest));
  await expect(host).toHaveAttribute('data-universe-travelling', 'false');
});

test('hover y foco del destino sólo iluminan su cuerpo; Enter navega con el handler DOM', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  const request = await expectSettled(host, 'section:explore');
  const favorites = page.getByRole('button', { name: /^Favoritos/ });
  await favorites.hover();
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-highlight', 'section:favorites');
  await expect(host).toHaveAttribute('data-universe-request', String(request));
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await favorites.focus();
  await expect(host).toHaveAttribute('data-universe-request', String(request));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
  await expectSettled(host, 'section:favorites');
});

test.describe('controles touch dentro del universo', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('el fondo permite abrir el ticket, editar campos y cerrar el evento con touch', async ({ page }) => {
    const host = await openUniverse(page, 'no-preference');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const ticket = page.locator('.orbit-event-preview[data-preview-kind="available"][data-event-id="supernova-sessions"] .orbit-event-open');
    await ticket.tap();
    const dialog = page.getByRole('dialog', { name: 'Órbita Fest', exact: true });
    await expect(dialog).toBeVisible();
    await expectSettled(host, 'event:supernova-sessions');
    const name = dialog.getByLabel('Tu nombre', { exact: true });
    await name.tap();
    await name.fill('Alex Touch QA');
    await expect(name).toHaveValue('Alex Touch QA');
    await expect(name).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).tap();
    await expect(dialog).toHaveCount(0);
    await expectSettled(host, 'section:explore');
    await expect(ticket).toBeFocused();
    await page.getByRole('button', { name: /^Mis eventos/ }).tap();
    await expect(page.getByRole('heading', { name: 'Tu agenda está libre.' })).toBeVisible();
    await expectSettled(host, 'section:registrations');
  });
});

test('Escape durante el acercamiento cancela el evento y devuelve origen y foco', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions'])));
  const host = await openUniverse(page, 'no-preference');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expectSettled(host, 'section:favorites');
  const trigger = page.getByRole('button', { name: 'Ver Órbita Fest', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(host).toHaveAttribute('data-universe-travelling', 'true');
  const openingRequest = Number(await host.getAttribute('data-universe-request'));
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const closingRequest = await expectSettled(host, 'section:favorites');
  expect(closingRequest).toBeGreaterThan(openingRequest);
  await expect.poll(async () => JSON.parse(await host.getAttribute('data-universe-settlement-history') || '[]')).toContainEqual({ requestId: openingRequest, outcome: 'cancelled' });
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', 'favorites');
});

test('dos submits en el mismo turno crean una reserva, descuentan plazas una vez y emiten un cue', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
  await expectSettled(host, 'event:supernova-sessions');
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  const before = Number(await host.getAttribute('data-universe-request'));
  await page.locator('.registration-form-panel form').evaluate(form => {
    // Both events run before React can commit new props or replace the form with the pass.
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
  await expectSettled(host, 'event:supernova-sessions');
  expect(Number(await host.getAttribute('data-universe-request'))).toBe(before + 1);
  const state = await page.evaluate(() => ({
    reservations: JSON.parse(localStorage.getItem('supernova-registrations-v1')!),
    events: JSON.parse(localStorage.getItem('supernova-events-v1')!),
  }));
  expect(state.reservations.filter((entry: { eventId: string }) => entry.eventId === 'supernova-sessions')).toHaveLength(1);
  expect(state.events.find((entry: { id: string }) => entry.id === 'supernova-sessions').registered).toBe(187);
  await expect(page.getByRole('button', { name: 'Cerrar inscripción', exact: true })).toBeFocused();
});

test('un email inválido no reserva ni emite confirmación espacial', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
  const request = await expectSettled(host, 'event:supernova-sessions');
  await page.getByLabel('Email corporativo', { exact: true }).fill('alex@sin-dominio');
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Completá tu nombre y un email válido.');
  await expect(host).toHaveAttribute('data-universe-request', String(request));
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-cue-active', 'false');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1') || '[]'))).toEqual([]);
});

test('un evento completo permite leer el detalle pero no promete un pase ni dispara un cue', async ({ page }) => {
  await page.addInitScript(events => localStorage.setItem('supernova-events-v1', JSON.stringify(events)), INITIAL_EVENTS.map(event => event.id === 'supernova-sessions' ? { ...event, registered: event.capacity, sessions: event.sessions?.map(session => ({ ...session, registered: session.capacity })) } : event));
  const host = await openUniverse(page, 'no-preference');
  await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
  const request = await expectSettled(host, 'event:supernova-sessions');
  await expect(page.getByText('Esta función está completa. Podés elegir otro horario.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar mi lugar', exact: true })).toHaveCount(0);
  await expect(host).toHaveAttribute('data-universe-request', String(request));
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-cue-active', 'false');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1') || '[]'))).toEqual([]);
});

test('la última edición anterior a 600 ms se conserva al salir y al recargar el estudio', async ({ page }) => {
  const host = await openUniverse(page);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await expectSettled(host, 'studio');
  const title = 'Última edición antes del debounce';
  await page.getByLabel('Nombre del evento').evaluate(input => {
    input.addEventListener('input', () => Object.assign(window, { __lastDraftEditAt: performance.now() }), { once: true });
  });
  await page.getByLabel('Nombre del evento').fill(title);
  const elapsed = await page.evaluate(() => {
    const editedAt = (window as Window & { __lastDraftEditAt: number }).__lastDraftEditAt;
    const elapsed = performance.now() - editedAt;
    document.querySelector<HTMLButtonElement>('.studio-back')!.click();
    return elapsed;
  });
  expect(elapsed).toBeLessThan(600);
  await expectSettled(host, 'section:admin');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova:event-builder:v1')!).event.title)).toBe(title);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Seguir creando', exact: true }).click();
  await expect(page.getByLabel('Nombre del evento')).toHaveValue(title);
  const description = 'El último cambio antes de recargar también tiene que llegar al borrador.';
  await page.getByLabel('Acerca de la experiencia').fill(description);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Salí de la rutina/ })).toBeVisible();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Seguir creando', exact: true }).click();
  await expect(page.getByLabel('Nombre del evento')).toHaveValue(title);
  await expect(page.getByLabel('Acerca de la experiencia')).toHaveValue(description);
  await expectSettled(host, 'studio');
});

test('restaurar un contexto real conserva Canvas, datos y el destino vigente', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  const canvas = await host.locator('canvas').elementHandle();
  const supported = await host.locator('canvas').evaluate(element => {
    const gl = (element as HTMLCanvasElement).getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    Object.assign(window, { __restoreUniverseContext: () => extension.restoreContext() });
    extension.loseContext();
    return true;
  });
  test.skip(!supported, 'El navegador no expone WEBGL_lose_context para provocar pérdida y restauración reales.');
  await expect(host).toHaveAttribute('data-universe-status', 'context-lost');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
  const latest = Number(await host.getAttribute('data-universe-request'));
  await expectSettled(host, 'section:favorites', 'fallback');
  await page.evaluate(() => (window as Window & { __restoreUniverseContext: () => void }).__restoreUniverseContext());
  await expect(host).toHaveAttribute('data-universe-status', 'ready');
  await expect.poll(async () => Number(await host.getAttribute('data-universe-request'))).toBeGreaterThan(latest);
  await expectSettled(host, 'section:favorites');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', 'favorites');
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
  expect(await page.evaluate(() => (document.querySelector('[data-universe-host] canvas') as HTMLCanvasElement).getContext('webgl2')!.isContextLost())).toBe(false);
});

test('un chunk 3D rechazado se puede reintentar desde DOM conservando favoritos y destino', async ({ page }) => {
  await page.route('**/src/features/universe/UniverseExperience.tsx*', route => route.abort('failed'));
  await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions'])));
  await page.clock.setFixedTime(businessDate);
  await page.goto('/');
  const host = page.locator(hostSelector);
  await expect(host).toHaveAttribute('data-universe-status', 'fallback');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible();
  await expectSettled(host, 'section:favorites', 'fallback');
  const latest = await host.getAttribute('data-universe-request');
  await page.unroute('**/src/features/universe/UniverseExperience.tsx*');
  await openProfile(page);
  await expectSettled(host, 'section:profile', 'fallback');
  const profileRequest = await host.getAttribute('data-universe-request');
  expect(Number(profileRequest)).toBeGreaterThan(Number(latest));
  await page.getByRole('button', { name: 'Reintentar ambiente', exact: true }).click();
  await expect(host).toHaveAttribute('data-universe-status', 'ready', { timeout: 20_000 });
  await expect(host.locator('canvas')).toHaveCount(1);
  await expect.poll(async () => Number(await host.getAttribute('data-universe-request'))).toBeGreaterThan(Number(profileRequest));
  await expectSettled(host, 'section:profile');
  await expect(host).toHaveAttribute('data-universe-destination', 'section:profile');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', 'profile');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('button', { name: 'Ver Órbita Fest', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-favorites-v1')!))).toEqual(['supernova-sessions']);
});

test('un shader inválido conserva inscripción DOM y un reintento fallido mantiene el mismo Canvas', async ({ page }) => {
  await page.route('**/src/features/universe/shaders/planet.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    expect(body).toContain('uniform vec3 uDark;');
    await route.fulfill({ response, body: body.replace('uniform vec3 uDark;', 'this_is_not_valid_glsl;\n  uniform vec3 uDark;') });
  });
  await page.clock.setFixedTime(businessDate);
  await page.goto('/');
  const host = page.locator(hostSelector);
  await expect(host).toHaveAttribute('data-universe-status', 'fallback');
  const canvas = await host.locator('canvas').elementHandle();
  expect(canvas).not.toBeNull();
  await page.getByRole('button', { name: 'Ver Órbita Fest', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ya sos parte.', exact: true })).toBeVisible();
  await expectSettled(host, 'event:supernova-sessions', 'fallback');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-registrations-v1')!).length)).toBe(1);
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click();
  await openProfile(page);
  await expectSettled(host, 'section:profile', 'fallback');
  await page.getByRole('button', { name: 'Reintentar ambiente', exact: true }).click();
  await expect(host).toHaveAttribute('data-universe-status', 'fallback');
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
  expect(await host.locator('canvas').evaluate((element, original) => element === original, canvas!)).toBe(true);
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(page.getByRole('button', { name: 'Ver mi pase', exact: true })).toBeVisible();
  await expectSettled(host, 'section:registrations', 'fallback');
});

test('abrir un evento después de leer el catálogo reanuda su vuelo aunque el hero esté fuera de pantalla', async ({ page }) => {
  const host = await openUniverse(page, 'no-preference');
  const trigger = page.getByRole('button', { name: 'Ver Órbita Fest', exact: true });
  await page.locator('#experiencias').evaluate(section => scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: 'instant' }));
  await expect(host).toHaveAttribute('data-universe-paused', 'true');
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Órbita Fest', exact: true })).toBeVisible();
  await expect(host).toHaveAttribute('data-universe-paused', 'false');
  await expect(host).toHaveAttribute('data-universe-travelling', 'true');
  await expectSettled(host, 'event:supernova-sessions');
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', 'event-supernova-sessions');
});

test('una excepción React dentro del engine conserva la app y un retry explícito recupera el destino actual', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('supernova-favorites-v1', JSON.stringify(['supernova-sessions'])));
  await page.route('**/src/features/universe/SolarMap.tsx*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    const signature = /(function SolarMap\([^)]*\)\s*\{)/;
    expect(body).toMatch(signature);
    await route.fulfill({ response, body: body.replace(signature, '$1\n  if (!window.__allowUniverseScene) throw new Error("Fallo React 3D inyectado por QA");') });
  });
  await page.clock.setFixedTime(businessDate);
  await page.goto('/');
  const host = page.locator(hostSelector);
  await expect(host).toHaveAttribute('data-universe-status', 'fallback');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('button', { name: 'Ver Órbita Fest', exact: true })).toBeVisible();
  await expectSettled(host, 'section:favorites', 'fallback');
  await openProfile(page);
  const failedRequest = await expectSettled(host, 'section:profile', 'fallback');
  // Clear the render exception without replacing its module or creating a second app.
  await page.evaluate(() => Object.assign(window, { __allowUniverseScene: true }));
  await page.getByRole('button', { name: 'Reintentar ambiente', exact: true }).click();
  await expect(host).toHaveAttribute('data-universe-status', 'ready', { timeout: 20_000 });
  await expect.poll(async () => Number(await host.getAttribute('data-universe-request'))).toBeGreaterThan(failedRequest);
  await expectSettled(host, 'section:profile');
  await expect(host.locator('canvas')).toHaveCount(1);
  await expect(host.locator('canvas')).toHaveAttribute('data-universe-visible', 'profile');
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByRole('button', { name: 'Ver Órbita Fest', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-favorites-v1')!))).toEqual(['supernova-sessions']);
});
