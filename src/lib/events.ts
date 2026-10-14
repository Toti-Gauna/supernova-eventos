import type { EventItem } from '../types';
import { getEventSessions } from './eventSessions';

export const DEMO_USER = { name: 'Alex García', email: 'alex.garcia@demo.telefonica.test' };
export type EventPhase = 'active' | 'upcoming' | 'ended';

/** Client-side presentation for the demo; the backend will own these transitions. */
export function getEventPhase(event: EventItem, now = Date.now()): EventPhase {
  if (event.status === 'ended') return 'ended';
  const sessions = getEventSessions(event);
  if (sessions.some(session => Date.parse(session.date) <= now && Date.parse(session.endDate) > now)) return 'active';
  if (sessions.some(session => Date.parse(session.date) > now && Date.parse(session.endDate) > now)) return 'upcoming';
  return 'ended';
}

export function canViewEvent(event: EventItem): boolean {
  return !event.isPrivate || event.audience?.mode === 'all' || Boolean(event.audience?.people.some(person => person.email.toLowerCase() === DEMO_USER.email));
}
