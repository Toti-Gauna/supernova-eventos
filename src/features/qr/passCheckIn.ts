import type { EventItem, EventSession, Registration } from '../../types';
import { getEventSession, getRegistrationSession } from '../../lib/eventSessions';
import { readStorage, writeStorage } from '../../lib/storage';

export const CHECK_IN_KEY = 'supernova-pass-check-ins-v1';
export interface PassCheckIn { passId: string; eventId: string; sessionId: string; admittedAt: string; people: number }
export type PassValidation =
  | { kind: 'invalid'; message: string }
  | { kind: 'valid' | 'used'; message: string; pass: Registration; event: EventItem; session: EventSession; entry?: PassCheckIn };

export function readCheckIns(): PassCheckIn[] {
  const records = readStorage<unknown>(CHECK_IN_KEY, []);
  return Array.isArray(records) ? records.filter((record): record is PassCheckIn => !!record && typeof record === 'object'
    && typeof record.passId === 'string' && typeof record.eventId === 'string' && typeof record.sessionId === 'string'
    && typeof record.admittedAt === 'string' && Number.isFinite(Date.parse(record.admittedAt))
    && Number.isInteger(record.people) && record.people > 0) : [];
}

/** Validate the QR against an actual local reservation; QR contents alone never grant entry. */
export function validatePass(input: string, eventId: string, sessionId: string, events: readonly EventItem[], registrations: readonly Registration[], entries = readCheckIns(), now = Date.now()): PassValidation {
  const text = input.trim();
  if (!text || text.length > 4096) return { kind: 'invalid', message: 'Ingresá un QR o un código de pase válido.' };
  let passId = text;
  let qr: { eventId: string; sessionId: string } | undefined;
  if (text.startsWith('{')) {
    try {
      const payload: unknown = JSON.parse(text);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid QR');
      const value = payload as Record<string, unknown>;
      if (value.type !== 'supernova-demo-pass' || value.version !== 1
        || ![value.passId, value.eventId, value.sessionId].every(id => typeof id === 'string' && id.length > 0 && id.length <= 128)) throw new Error('Invalid QR');
      passId = value.passId as string;
      qr = { eventId: value.eventId as string, sessionId: value.sessionId as string };
    } catch { return { kind: 'invalid', message: 'El QR no es un pase de Órbita válido.' }; }
  } else if (!/^[A-Za-z0-9:_-]{1,128}$/.test(text)) return { kind: 'invalid', message: 'El código de pase no tiene un formato válido.' };
  const pass = registrations.find(registration => registration.id === passId);
  if (!pass) return { kind: 'invalid', message: 'Pase inválido: no existe una reserva vigente con ese código en este navegador.' };
  const event = events.find(item => item.id === pass.eventId);
  if (!event || event.status !== 'published') return { kind: 'invalid', message: 'Pase inválido: el evento no está disponible.' };
  const reserved = getRegistrationSession(event, pass);
  const session = reserved && getEventSession(event, reserved.id);
  if (!session || !Number.isFinite(Date.parse(session.endDate)) || Date.parse(session.endDate) <= now) return { kind: 'invalid', message: 'Pase inválido: la función terminó o ya no está disponible.' };
  if (qr && (qr.eventId !== pass.eventId || qr.sessionId !== session.id)) return { kind: 'invalid', message: 'Pase inválido: los datos del QR no coinciden con la reserva.' };
  if (event.id !== eventId) return { kind: 'invalid', message: 'Este pase corresponde a otro evento.' };
  if (session.id !== sessionId) return { kind: 'invalid', message: 'Este pase corresponde a otra función. Seleccioná el horario correcto.' };
  if (!Number.isInteger(pass.companions) || pass.companions < 0 || pass.companions > event.companions) return { kind: 'invalid', message: 'Pase inválido: revisá los lugares de la reserva.' };
  const entry = entries.find(item => item.passId === pass.id && item.eventId === event.id && item.sessionId === session.id);
  return { kind: entry ? 'used' : 'valid', message: entry ? 'Este pase ya tiene un ingreso registrado.' : 'Pase válido', pass, event, session, entry };
}

/** Recheck fresh storage and duplicates immediately before storing the demo admission. */
export async function registerPassEntry(input: string, eventId: string, sessionId: string, events: EventItem[], registrations: Registration[]): Promise<PassValidation> {
  const register = () => {
    const storedEvents = readStorage<unknown>('supernova-events-v1', events);
    const storedPasses = readStorage<unknown>('supernova-registrations-v1', registrations);
    const entries = readCheckIns();
    const result = validatePass(input, eventId, sessionId, Array.isArray(storedEvents) ? storedEvents : events, Array.isArray(storedPasses) ? storedPasses : registrations, entries);
    if (result.kind !== 'valid') return result;
    const entry: PassCheckIn = { passId: result.pass.id, eventId: result.event.id, sessionId: result.session.id, admittedAt: new Date().toISOString(), people: 1 + result.pass.companions };
    if (!writeStorage(CHECK_IN_KEY, [...entries, entry])) return { kind: 'invalid' as const, message: 'No pudimos guardar el ingreso en este navegador. Reintentá.' };
    return { ...result, kind: 'used' as const, message: 'Ingreso registrado', entry };
  };
  return navigator.locks ? navigator.locks.request('supernova-pass-check-in', register) : register();
}
