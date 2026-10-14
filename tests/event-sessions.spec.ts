import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { INITIAL_EVENTS } from '../src/data/events';
import type { EventItem, Registration } from '../src/types';

const businessDate = new Date('2026-10-09T15:00:00Z');
const eventId = 'supernova-sessions';
const mainId = `${eventId}:main`;
const saturdayId = `${eventId}:saturday`;
const featured = INITIAL_EVENTS.find(event => event.id === eventId)!;

async function openDemo(page: Page, path = '/3d/', date = businessDate) {
  await page.clock.setFixedTime(date);
  await page.goto(path);
  await expect(page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' })).toHaveCount(0);
  await expect(page.locator('.hero')).toBeVisible();
}

async function readState(page: Page) {
  return page.evaluate(() => ({
    registrations: JSON.parse(localStorage.getItem('supernova-registrations-v1') || '[]') as Registration[],
    event: (JSON.parse(localStorage.getItem('supernova-events-v1') || '[]') as EventItem[]).find(event => event.id === 'supernova-sessions')!,
  }));
}

async function doubleSubmit(modal: Locator) {
  await modal.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
  await modal.locator('form').evaluate(form => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(modal.getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
}

async function downloadCalendar(modal: Locator, page: Page) {
  const pending = page.waitForEvent('download');
  await modal.getByRole('button', { name: 'Agregar a mi calendario', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.ics$/);
  return readFile((await download.path())!, 'utf8');
}

async function fillIdea(page: Page, title: string) {
  await page.getByLabel('Nombre del evento').fill(title);
  await page.getByLabel('Ubicación del evento').fill('Campus de demostración · Montevideo');
  await page.getByLabel('Fecha y hora de inicio', { exact: true }).fill('2026-11-25T18:00');
  await page.getByLabel('Fecha y hora de fin', { exact: true }).fill('2026-11-25T20:00');
  await page.getByLabel('Cupo total').fill('50');
  await page.getByLabel('Acerca de la experiencia').fill('Un encuentro ficticio con dos funciones para compartir ideas, aprender y conectar con otros equipos.');
}

async function publishWizard(page: Page) {
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿A quiénes vamos a invitar?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByLabel('Asunto del email')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: /Publicar (evento|cambios)/ }).click();
  await expect(page.locator('.event-wizard')).toHaveCount(0);
}

for (const version of ['original', '3d', 'hibrida']) {
  test(`${version}: dos funciones conservan pases, cupos, fechas y calendarios independientes`, async ({ page }) => {
    await openDemo(page, `/${version}/`);
    await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('radio', { name: /Viernes.*23 de octubre.*19:00/ })).toBeChecked();
    await expect(modal.getByRole('radio', { name: /Sábado.*24 de octubre.*21:00/ })).toBeVisible();
    await modal.getByRole('button', { name: 'Agregar acompañante' }).click();
    await doubleSubmit(modal);
    const firstCalendar = await downloadCalendar(modal, page);
    expect(firstCalendar).toContain('DTSTART:20261023T220000Z');
    expect(firstCalendar).toContain('DTEND:20261024T020000Z');
    await modal.getByRole('button', { name: 'Elegir otra función' }).click();
    await modal.getByRole('radio', { name: /Sábado.*21:00/ }).check();
    await modal.getByRole('button', { name: 'Quitar acompañante' }).click();
    await doubleSubmit(modal);
    const secondCalendar = await downloadCalendar(modal, page);
    expect(secondCalendar).toContain('DTSTART:20261025T000000Z');
    expect(secondCalendar).toContain('DTEND:20261025T020000Z');
    expect(firstCalendar.match(/^UID:.*$/m)?.[0]).not.toBe(secondCalendar.match(/^UID:.*$/m)?.[0]);
    await expect.poll(async () => (await readState(page)).registrations.length).toBe(2);
    const state = await readState(page);
    expect(state.registrations.map(pass => pass.sessionId).sort()).toEqual([mainId, saturdayId].sort());
    expect(state.event.sessions?.map(session => session.registered)).toEqual([188, 1]);
    expect(state.event.registered).toBe(189);
    expect(state.registrations.every(pass => !!pass.sessionSnapshot)).toBe(true);
    await modal.getByRole('button', { name: 'Cerrar inscripción' }).click();
    await page.getByRole('button', { name: /^Mis eventos/ }).click();
    const cards = page.locator('.my-event');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).locator('time')).toHaveAttribute('datetime', featured.sessions![0].date);
    await expect(cards.nth(1).locator('time')).toHaveAttribute('datetime', featured.sessions![1].date);
    await expect(cards.nth(0)).toContainText('19:00 h');
    await expect(cards.nth(1)).toContainText('21:00 h');
    await cards.nth(1).getByRole('button', { name: 'Ver mi pase', exact: true }).click();
    await expect(modal.getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
    await modal.getByRole('button', { name: 'No voy a poder asistir' }).click();
    await modal.getByRole('button', { name: 'Sí, cancelar inscripción' }).click();
    await expect(modal).toHaveCount(0);
    await expect(cards).toHaveCount(1);
    const afterCancel = await readState(page);
    expect(afterCancel.registrations).toHaveLength(1);
    expect(afterCancel.registrations[0].sessionId).toBe(mainId);
    expect(afterCancel.event.sessions?.map(session => session.registered)).toEqual([188, 0]);
    expect(afterCancel.event.registered).toBe(188);
    await page.reload();
    await page.getByRole('button', { name: /^Mis eventos/ }).click();
    await expect(page.locator('.my-event')).toHaveCount(1);
    await expect(page.locator('.my-event time')).toContainText('19:00 h');
  });
}

test('una función completa permite reservar otra, sin tocar su cupo', async ({ page }) => {
  const events = INITIAL_EVENTS.map(event => event.id === eventId ? {
    ...event, registered: 240,
    sessions: event.sessions!.map((session, index) => ({ ...session, registered: index === 0 ? session.capacity : 0 })),
  } : event);
  await page.addInitScript(value => localStorage.setItem('supernova-events-v1', JSON.stringify(value)), events);
  await openDemo(page, `/3d/?evento=${eventId}&funcion=${encodeURIComponent(mainId)}`);
  const modal = page.getByRole('dialog');
  await expect(modal.getByText('Esta función está completa. Podés elegir otro horario.', { exact: true })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Confirmar mi lugar' })).toHaveCount(0);
  await modal.getByRole('radio', { name: /Sábado.*21:00/ }).check();
  await doubleSubmit(modal);
  const state = await readState(page);
  expect(state.event.sessions?.map(session => session.registered)).toEqual([240, 1]);
  expect(state.registrations[0].sessionId).toBe(saturdayId);
});

test('entre funciones el evento sigue vigente y la fecha finalizada no bloquea la siguiente', async ({ page }) => {
  await openDemo(page, `/hibrida/?evento=${eventId}&funcion=${encodeURIComponent(mainId)}`, new Date('2026-10-24T22:00:00Z'));
  const modal = page.getByRole('dialog');
  await expect(modal.getByText('La inscripción para esta función está cerrada.', { exact: true })).toBeVisible();
  await expect(modal.getByRole('radio', { name: /Viernes/ })).toBeChecked();
  await modal.getByRole('radio', { name: /Sábado.*21:00/ }).check();
  await doubleSubmit(modal);
  const state = await readState(page);
  expect(state.event.sessions?.map(session => session.registered)).toEqual([186, 1]);
  expect(state.registrations[0].sessionId).toBe(saturdayId);
});

test('admin valida horarios por función y restaura dos funciones antes de publicar', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Crear experiencia', exact: true }).click();
  await fillIdea(page, 'Dos funciones QA');
  await page.getByRole('button', { name: 'Agregar función', exact: true }).click();
  const second = page.locator('.event-session-fields').nth(1);
  await second.getByLabel(/Fecha y hora de inicio/).fill('2026-11-25T18:00');
  await second.getByLabel(/Fecha y hora de fin/).fill('2026-11-25T22:00');
  await second.getByLabel(/Apertura de puertas/).fill('2026-11-25T19:00');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Ya hay otra función que empieza en esa fecha y horario.', { exact: true })).toBeVisible();
  await expect(page.getByText('La apertura de puertas debe ser anterior o igual al inicio.', { exact: true })).toBeVisible();
  await second.getByLabel(/Fecha y hora de inicio/).fill('2026-11-25T21:00');
  await second.getByLabel(/Apertura de puertas/).fill('2026-11-25T20:00');
  await second.getByLabel(/Cupo/).fill('30');
  await page.getByRole('button', { name: 'Volver a eventos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Seguir creando', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Seguir creando', exact: true }).click();
  await expect(page.locator('.event-session-fields')).toHaveCount(2);
  await expect(page.getByLabel('Nombre del evento')).toHaveValue('Dos funciones QA');
  await expect(page.locator('.event-session-fields').nth(1).getByLabel(/Fecha y hora de inicio/)).toHaveValue('25/11/2026 · 21:00');
  await publishWizard(page);
  await expect(page.getByRole('button', { name: 'Editar Dos funciones QA', exact: true })).toBeVisible();
  const created = await page.evaluate(() => (JSON.parse(localStorage.getItem('supernova-events-v1')!) as EventItem[]).find(event => event.title === 'Dos funciones QA')!);
  expect(created.status).toBe('published');
  expect(created.sessions).toHaveLength(2);
  expect(created.capacity).toBe(80);
  expect(created.sessions?.map(session => session.registered)).toEqual([0, 0]);
  expect(created.sessions?.map(session => new Date(session.date).toISOString())).toEqual(['2026-11-25T21:00:00.000Z', '2026-11-26T00:00:00.000Z']);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('supernova:event-builder:v1'))).toBeNull();
});

test('admin conserva horarios reservados y valida el cupo por función', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Supernova Sessions', exact: true }).click();
  const first = page.locator('.event-session-fields').nth(0);
  await expect(first.getByLabel('Fecha y hora de inicio', { exact: true })).toBeDisabled();
  await expect(first.getByLabel('Fecha y hora de fin', { exact: true })).toBeDisabled();
  await expect(first.getByRole('button', { name: 'Quitar función 1', exact: true })).toBeDisabled();
  await first.getByLabel('Cupo total').fill('180');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(first.getByText('El cupo debe ser entero, entre 186 y 100.000.', { exact: true })).toBeVisible();
  await first.getByLabel('Cupo total').fill('250');
  await publishWizard(page);
  const state = await readState(page);
  expect(state.event.sessions?.map(session => session.registered)).toEqual([186, 0]);
  expect(state.event.sessions![0].capacity).toBe(250);
  expect(state.event.sessions![0].date).toBe(featured.sessions![0].date);
  expect(state.event.capacity).toBe(490);
});

test('una inscripción antigua conserva su función al agregar una fecha anterior', async ({ page }) => {
  const legacyEvent: EventItem = { ...featured, sessions: undefined, capacity: 240, registered: 187, endDate: featured.sessions![0].endDate };
  const legacyPass: Registration = { id: 'SN-LEGACY', eventId, name: 'Alex García', email: 'alex.garcia@demo.telefonica.test', companions: 0, createdAt: '2026-10-08T15:00:00Z' };
  await page.addInitScript(({ events, pass }) => {
    localStorage.setItem('supernova-events-v1', JSON.stringify(events));
    localStorage.setItem('supernova-registrations-v1', JSON.stringify([pass]));
  }, { events: INITIAL_EVENTS.map(event => event.id === eventId ? legacyEvent : event), pass: legacyPass });
  await openDemo(page, '/original/');
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await page.getByRole('button', { name: 'Ver mi pase', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Elegir otra función', exact: true })).toHaveCount(0);
  const legacyCalendar = await downloadCalendar(page.getByRole('dialog'), page);
  expect(legacyCalendar).toContain('DTSTART:20261023T220000Z');
  await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click();
  await page.getByRole('button', { name: 'Administrar', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Supernova Sessions', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar función', exact: true }).click();
  const addedId = await page.locator('.event-session-fields').nth(1).getAttribute('data-session-id');
  const added = page.locator(`[data-session-id="${addedId}"]`);
  await added.getByLabel(/Fecha y hora de inicio/).fill('2026-10-22T18:00');
  await added.getByLabel(/Fecha y hora de fin/).fill('2026-10-22T20:00');
  await added.getByLabel(/Apertura de puertas/).fill('2026-10-22T17:00');
  await added.getByLabel(/Cupo/).fill('20');
  await publishWizard(page);
  await page.getByRole('button', { name: /^Mis eventos/ }).click();
  await expect(page.locator('.my-event')).toHaveCount(1);
  await expect(page.locator('.my-event time')).toHaveAttribute('datetime', legacyEvent.date);
  await page.getByRole('button', { name: 'Ver mi pase', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('heading', { name: 'Ya sos parte.' })).toBeVisible();
  await expect(modal.locator('.personal-ticket')).toContainText('23');
  await modal.getByRole('button', { name: 'No voy a poder asistir' }).click();
  await modal.getByRole('button', { name: 'Sí, cancelar inscripción' }).click();
  const state = await readState(page);
  expect(state.registrations).toHaveLength(0);
  expect(state.event.sessions?.find(session => session.id === mainId)?.registered).toBe(186);
  expect(state.event.sessions?.find(session => session.id === addedId)?.registered).toBe(0);
});
