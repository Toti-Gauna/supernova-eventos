import type { AccessKind, EventAccess, EventItem } from '../types';
import { getEventSessions } from './eventSessions';

export const DEMO_USER = { name: 'Alex García', email: 'alex.garcia@demo.personal.test' };
export type EventPhase = 'active' | 'upcoming' | 'ended';
export interface EventViewer { kind: AccessKind; email: string }
export const DEMO_VIEWER: EventViewer = { kind: 'internal', email: DEMO_USER.email };

/** Client-side presentation for the demo; the backend will own these transitions. */
export function getEventPhase(event: EventItem, now = Date.now()): EventPhase {
  if (event.status === 'ended') return 'ended';
  const sessions = getEventSessions(event);
  if (sessions.some(session => Date.parse(session.date) <= now && Date.parse(session.endDate) > now)) return 'active';
  if (sessions.some(session => Date.parse(session.date) > now && Date.parse(session.endDate) > now)) return 'upcoming';
  return 'ended';
}

/** Events saved before access existed stay internal: the safe default until the server says otherwise. */
export function eventAccess(event: EventItem): EventAccess {
  return event.access ?? 'internal';
}

export function canAccessEvent(event: EventItem, kind: AccessKind): boolean {
  const access = eventAccess(event);
  return access === 'all' || access === kind;
}

export function canViewEvent(event: EventItem, viewer: EventViewer = DEMO_VIEWER): boolean {
  if (!canAccessEvent(event, viewer.kind)) return false;
  const email = viewer.email.toLowerCase();
  return !event.isPrivate || event.audience?.mode === 'all' || Boolean(event.audience?.people.some(person => person.email.toLowerCase() === email));
}
