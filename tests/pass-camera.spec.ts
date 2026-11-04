import { expect, test, type Page } from '@playwright/test';
import QRCode from 'qrcode';
import { INITIAL_EVENTS } from '../src/data/events';
import type { Registration } from '../src/types';

const event = INITIAL_EVENTS.find(item => item.id === 'supernova-sessions')!;
const friday = event.sessions![0];
const saturday = event.sessions![1];
const pass: Registration = {
  id:'SN-CAMERA-QA', eventId:event.id, sessionId:friday.id, sessionSnapshot:friday,
  name:'Alex Cámara', email:'alex.camara@example.test', companions:1, createdAt:'2026-10-12T15:00:00Z',
};
const payload = JSON.stringify({ type:'supernova-demo-pass', version:1, passId:pass.id, eventId:event.id, sessionId:friday.id });
type FakeMode = 'good' | 'blank' | 'denied' | 'missing' | 'deferred';
interface CameraQA {
  requests: MediaStreamConstraints[];
  tracks: MediaStreamTrack[];
  stopped: number;
  mode: FakeMode;
  resolvePending?: () => Promise<void>;
}
type CameraWindow = Window & { __passCameraQA: CameraQA };

async function fakeCamera(page: Page, mode: FakeMode = 'good') {
  const source = await QRCode.toDataURL(payload, { errorCorrectionLevel:'Q', width:512, margin:4 });
  await page.addInitScript(({ source, mode }) => {
    const state: CameraQA = { requests:[], tracks:[], stopped:0, mode };
    (window as CameraWindow).__passCameraQA = state;
    const createStream = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, 512, 512);
      const image = new Image();
      if (state.mode !== 'blank') { image.src = source; await image.decode(); }
      const paint = () => {
        context.fillRect(0, 0, 512, 512);
        if (image.complete && image.naturalWidth) context.drawImage(image, 0, 0, 512, 512);
      };
      paint();
      const stream = canvas.captureStream(12);
      const timer = window.setInterval(paint, 80);
      stream.getTracks().forEach(track => {
        state.tracks.push(track);
        const stop = track.stop.bind(track);
        track.stop = () => { state.stopped++; clearInterval(timer); stop(); };
      });
      return stream;
    };
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable:true, value:async (constraints: MediaStreamConstraints) => {
      state.requests.push(constraints);
      if (state.mode === 'denied') throw new DOMException('Fixture denied', 'NotAllowedError');
      if (state.mode === 'missing') throw new DOMException('Fixture missing', 'NotFoundError');
      if (state.mode === 'deferred') return await new Promise<MediaStream>(resolve => {
        state.resolvePending = async () => { resolve(await createStream()); };
      });
      return await createStream();
    } });
  }, { source, mode });
}

async function openChecker(page: Page, version = 'original') {
  await page.clock.setFixedTime(new Date('2026-10-13T15:00:00Z'));
  await page.addInitScript(registration => localStorage.setItem('supernova-registrations-v1', JSON.stringify([registration])), pass);
  await page.goto(`/${version}/`);
  await expect(page.locator('.app-shell')).not.toHaveClass(/intro-playing/);
  await expect(page.getByRole('heading', { name:/Salí de la rutina/ })).toBeVisible();
  await page.getByRole('button', { name:'Administrar', exact:true }).click();
  const trigger = page.getByRole('button', { name:'Registrar pase', exact:true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name:'Registrar pase', exact:true });
  await dialog.getByRole('combobox', { name:'Evento', exact:true }).selectOption(event.id);
  await dialog.getByRole('combobox', { name:'Función', exact:true }).selectOption(friday.id);
  return { dialog, trigger };
}

async function stoppedTracks(page: Page, count: number) {
  await expect.poll(() => page.evaluate(() => {
    const state = (window as CameraWindow).__passCameraQA;
    return state.tracks.filter(track => track.readyState === 'ended').length;
  })).toBe(count);
}

test('celular: cámara sólo al tocar, QR real muestra datos locales y exige registrar ingreso por separado', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await fakeCamera(page);
  const { dialog, trigger } = await openChecker(page, 'hibrida');
  expect(await page.evaluate(() => (window as CameraWindow).__passCameraQA.requests.length)).toBe(0);
  await dialog.getByRole('button', { name:'Abrir cámara', exact:true }).click();
  const result = dialog.getByRole('heading', { name:'Pase válido', exact:true });
  await expect(result).toBeVisible({ timeout:20_000 });
  await expect(result).toBeFocused();
  await expect(dialog.locator('video')).toHaveCount(0);
  await stoppedTracks(page, 1);
  const constraints = await page.evaluate(() => (window as CameraWindow).__passCameraQA.requests[0]);
  expect(constraints).toMatchObject({ audio:false, video:{ facingMode:{ ideal:'environment' } } });
  await expect(dialog.getByRole('combobox', { name:'Evento', exact:true })).toHaveValue(event.id);
  await expect(dialog.getByRole('combobox', { name:'Función', exact:true })).toHaveValue(friday.id);
  await dialog.getByRole('tab', { name:'Código', exact:true }).click();
  await expect(dialog.getByRole('textbox', { name:'QR o código del pase', exact:true })).toHaveValue(payload);
  const details = dialog.locator('.pass-check-details');
  for (const value of [pass.name, pass.email, event.title, 'Viernes', '23 de octubre de 2026', '19:00 — 23:00 h', event.location, '1 acompañante', '2 lugares', pass.id, 'Ingreso pendiente', 'Todavía no registrado']) await expect(details).toContainText(value);
  expect(payload).not.toContain(pass.email);
  expect(payload).not.toContain(pass.name);
  expect(await page.evaluate(() => localStorage.getItem('supernova-pass-check-ins-v1'))).toBeNull();
  await dialog.getByRole('button', { name:'Registrar ingreso', exact:true }).click();
  await expect(dialog.getByRole('heading', { name:'Ingreso registrado', exact:true })).toBeVisible();
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('supernova-pass-check-ins-v1')!));
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({ passId:pass.id, sessionId:friday.id, people:2 });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('la cámara rechaza otra función y conserva la selección sin admitir ni cambiar horario', async ({ page }) => {
  await fakeCamera(page);
  const { dialog } = await openChecker(page);
  await dialog.getByRole('combobox', { name:'Función', exact:true }).selectOption(saturday.id);
  await dialog.getByRole('button', { name:'Abrir cámara', exact:true }).click();
  await expect(dialog.getByRole('heading', { name:'Pase no válido', exact:true })).toBeVisible({ timeout:20_000 });
  await expect(dialog).toContainText('otra función');
  await expect(dialog.getByRole('combobox', { name:'Función', exact:true })).toHaveValue(saturday.id);
  await expect(dialog.getByRole('button', { name:'Registrar ingreso', exact:true })).toHaveCount(0);
  await stoppedTracks(page, 1);
  expect(await page.evaluate(() => localStorage.getItem('supernova-pass-check-ins-v1'))).toBeNull();
  await dialog.getByRole('combobox', { name:'Función', exact:true }).selectOption(friday.id);
  await dialog.getByRole('button', { name:'Validar pase', exact:true }).click();
  await expect(dialog.getByRole('heading', { name:'Pase válido', exact:true })).toBeVisible();
});

test('permiso rechazado ofrece reintento e imagen/código y no repite permisos automáticamente', async ({ page }) => {
  await fakeCamera(page, 'denied');
  const { dialog } = await openChecker(page);
  await dialog.getByRole('button', { name:'Abrir cámara', exact:true }).click();
  await expect(dialog.getByRole('alert')).toContainText('No tenemos permiso');
  await expect(dialog.locator('input[type="file"]')).toBeEnabled();
  await dialog.getByRole('tab', { name:'Código', exact:true }).click();
  await expect(dialog.getByRole('textbox', { name:'QR o código del pase', exact:true })).toBeEnabled();
  await dialog.getByRole('tab', { name:'Cámara', exact:true }).click();
  expect(await page.evaluate(() => (window as CameraWindow).__passCameraQA.requests.length)).toBe(1);
  await page.evaluate(() => { (window as CameraWindow).__passCameraQA.mode = 'good'; });
  await dialog.getByRole('button', { name:'Reintentar cámara', exact:true }).click();
  await expect(dialog.getByRole('heading', { name:'Pase válido', exact:true })).toBeVisible({ timeout:20_000 });
  await stoppedTracks(page, 1);
  expect(await page.evaluate(() => (window as CameraWindow).__passCameraQA.requests.length)).toBe(2);
});

test('HTTPS, navegador sin cámara y dispositivo ausente conservan alternativas manuales', async ({ page }) => {
  await fakeCamera(page, 'missing');
  const { dialog } = await openChecker(page);
  await page.evaluate(() => Object.defineProperty(window, 'isSecureContext', { configurable:true, value:false }));
  await dialog.getByRole('button', { name:'Abrir cámara', exact:true }).click();
  await expect(dialog.getByRole('alert')).toContainText('HTTPS');
  expect(await page.evaluate(() => (window as CameraWindow).__passCameraQA.requests.length)).toBe(0);
  await page.evaluate(() => Object.defineProperty(window, 'isSecureContext', { configurable:true, value:true }));
  await dialog.getByRole('button', { name:'Reintentar cámara', exact:true }).click();
  await expect(dialog.getByRole('alert')).toContainText('No encontramos una cámara');
  expect(await page.evaluate(() => (window as CameraWindow).__passCameraQA.requests.length)).toBe(1);
  await page.evaluate(() => Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable:true, value:undefined }));
  await dialog.getByRole('button', { name:'Reintentar cámara', exact:true }).click();
  await expect(dialog.getByRole('alert')).toContainText('no ofrece acceso');
  await expect(dialog.locator('input[type="file"]')).toBeEnabled();
  await dialog.getByRole('button', { name:'Escribir el código', exact:true }).click();
  await dialog.getByRole('textbox', { name:'QR o código del pase', exact:true }).fill(pass.id);
  await dialog.getByRole('button', { name:'Validar pase', exact:true }).click();
  await expect(dialog.getByRole('heading', { name:'Pase válido', exact:true })).toBeVisible();
});

test('detener, Escape y ocultar pestaña liberan tracks; volver no enciende otra cámara', async ({ page }) => {
  await fakeCamera(page, 'blank');
  const { dialog, trigger } = await openChecker(page);
  const start = dialog.getByRole('button', { name:'Abrir cámara', exact:true });
  await start.click();
  await expect(dialog.locator('[data-camera-state]')).toHaveAttribute('data-camera-state', 'scanning');
  await expect(dialog.locator('video')).toBeVisible();
  expect(await dialog.locator('video').evaluate(element => (element as HTMLVideoElement).playsInline && (element as HTMLVideoElement).muted)).toBe(true);
  await dialog.getByRole('button', { name:'Detener cámara', exact:true }).click();
  await stoppedTracks(page, 1);
  await expect(start).toBeFocused();
  await start.click();
  await expect(dialog.locator('[data-camera-state]')).toHaveAttribute('data-camera-state', 'scanning');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await stoppedTracks(page, 2);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name:'Abrir cámara', exact:true }).click();
  await expect(dialog.locator('[data-camera-state]')).toHaveAttribute('data-camera-state', 'scanning');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable:true, get:() => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await stoppedTracks(page, 3);
  await expect(dialog.locator('video')).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable:true, get:() => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(dialog.getByRole('button', { name:'Abrir cámara', exact:true })).toBeEnabled();
  expect(await page.evaluate(() => (window as CameraWindow).__passCameraQA.requests.length)).toBe(3);
});

test('un permiso que responde después de cerrar detiene el stream tardío y conserva el foco', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', failure => errors.push(failure.message));
  await fakeCamera(page, 'deferred');
  const { dialog, trigger } = await openChecker(page);
  await dialog.getByRole('button', { name:'Abrir cámara', exact:true }).click();
  await expect(dialog.locator('[data-camera-state]')).toHaveAttribute('data-camera-state', 'requesting');
  await dialog.getByRole('button', { name:'Cerrar registro de pase', exact:true }).click();
  await expect(dialog).toHaveCount(0);
  await page.evaluate(async () => { await (window as CameraWindow).__passCameraQA.resolvePending?.(); });
  await stoppedTracks(page, 1);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});
