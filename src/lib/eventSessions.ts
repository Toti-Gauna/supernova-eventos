import type { EventItem, EventSession, Registration } from '../types';

/** Old persisted events remain a single function without changing their seat totals. */
export function getEventSessions(event: EventItem): EventSession[] {
  if (event.sessions?.length) return event.sessions;
  return [{ id: `${event.id}:main`, date: event.date, endDate: event.endDate, capacity: event.capacity, registered: event.registered }];
}

export function getEventSession(event: EventItem, sessionId?: string): EventSession | undefined {
  const sessions = getEventSessions(event);
  return sessionId ? sessions.find(session => session.id === sessionId) : sessions[0];
}

export function getDisplaySession(event: EventItem, now = Date.now()): EventSession {
  const sessions = [...getEventSessions(event)].sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
  return (event.status !== 'ended' ? sessions.find(session => Date.parse(session.endDate) > now) : undefined) || sessions[sessions.length - 1];
}

/** Reservations made before functions existed belong to the original first function. */
export function getRegistrationSession(event: EventItem, registration: Registration): EventSession | undefined {
  if (!registration.sessionId) return getEventSessions(event).find(session => session.id === `${event.id}:main`) || getEventSession(event);
  return getEventSession(event, registration.sessionId) || registration.sessionSnapshot;
}

export function sameRegistrationSession(event: EventItem, registration: Registration, sessionId?: string): boolean {
  const target = getEventSession(event, sessionId);
  return !!target && registration.eventId === event.id && getRegistrationSession(event, registration)?.id === target.id;
}

export function eventForSession(event: EventItem, sessionOrId?: EventSession | string): EventItem {
  const session = typeof sessionOrId === 'object' ? sessionOrId : getEventSession(event, sessionOrId);
  return session ? { ...event, sessions: undefined, date: session.date, endDate: session.endDate, capacity: session.capacity, registered: session.registered } : event;
}

/** Aggregate fields retain their original names for calendars, dashboards and old readers. */
export function withEventSessions(event: EventItem, sessions: EventSession[]): EventItem {
  if (!sessions.length) return event;
  const ordered = [...sessions].sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
  const lastEnd = ordered.reduce((latest, session) => Date.parse(session.endDate) > Date.parse(latest) ? session.endDate : latest, ordered[0].endDate);
  return {
    ...event, sessions: ordered, date: ordered[0].date, endDate: lastEnd,
    capacity: ordered.reduce((total, session) => total + session.capacity, 0),
    registered: ordered.reduce((total, session) => total + session.registered, 0),
  };
}

export function changeSessionRegistration(event: EventItem, sessionId: string | undefined, delta: number): EventItem {
  const target = getEventSession(event, sessionId);
  if (!target) return event;
  if (!event.sessions?.length) return { ...event, registered: Math.max(0, Math.min(event.capacity, event.registered + delta)) };
  return withEventSessions(event, event.sessions.map(session => session.id === target.id
    ? { ...session, registered: Math.max(0, Math.min(session.capacity, session.registered + delta)) }
    : session));
}

/** Keep live seat counts when an editor publishes a draft captured earlier. */
export function mergeEventSessionUpdate(current: EventItem, updated: EventItem): EventItem | null {
  const currentSessions = getEventSessions(current);
  const proposed = getEventSessions(updated);
  const reserved = currentSessions.filter(session => session.registered > 0);
  if (reserved.some(session => {
    const next = proposed.find(item => item.id === session.id);
    return !next || Date.parse(next.date) !== Date.parse(session.date)
      || Date.parse(next.endDate) !== Date.parse(session.endDate)
      || (next.doorsDate ? Date.parse(next.doorsDate) : undefined) !== (session.doorsDate ? Date.parse(session.doorsDate) : undefined);
  })) return null;
  const sessions = proposed.map(session => ({ ...session, registered: currentSessions.find(item => item.id === session.id)?.registered || 0 }));
  const merged = updated.sessions?.length || current.sessions?.length
    ? withEventSessions(updated, sessions)
    : { ...updated, registered: current.registered };
  return Object.keys(validateEventSessions(merged)).length ? null : merged;
}

export function validateEventSessions(event: EventItem): Record<string, string> {
  const errors: Record<string, string> = {};
  const sessions = getEventSessions(event);
  const ids = new Set<string>();
  const starts = new Set<number>();
  if (sessions.length > 24) errors.sessions = 'Podés crear hasta 24 funciones por evento.';
  sessions.forEach((session, index) => {
    const prefix = index === 0 ? '' : `session.${session.id}.`;
    const start = Date.parse(session.date), end = Date.parse(session.endDate);
    if (!session.id || ids.has(session.id)) errors.sessions = 'Cada función debe tener un identificador único.';
    ids.add(session.id);
    if (!Number.isFinite(start)) errors[`${prefix}date`] = 'Elegí una fecha de inicio válida.';
    else if (starts.has(start)) errors[`${prefix}date`] = 'Ya hay otra función que empieza en esa fecha y horario.';
    starts.add(start);
    if (!Number.isFinite(end) || end <= start) errors[`${prefix}endDate`] = 'El fin debe ser posterior al inicio.';
    if (session.doorsDate && (!Number.isFinite(Date.parse(session.doorsDate)) || Date.parse(session.doorsDate) > start)) errors[`${prefix}doorsDate`] = 'La apertura de puertas debe ser anterior o igual al inicio.';
    if (!Number.isInteger(session.capacity) || session.capacity < Math.max(1, session.registered) || session.capacity > 100000) errors[`${prefix}capacity`] = `El cupo debe ser entero, entre ${Math.max(1, session.registered)} y 100.000.`;
    if (!Number.isInteger(session.registered) || session.registered < 0) errors.sessions = 'La cantidad de inscriptos de cada función debe ser válida.';
    if ((session.name || '').length > 80) errors[`${prefix}name`] = 'Usá un nombre de hasta 80 caracteres.';
  });
  return errors;
}
