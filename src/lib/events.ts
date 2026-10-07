import type { EventItem } from '../types';

export const DEMO_USER = { name: 'Alex García', email: 'alex.garcia@demo.telefonica.test' };
export type EventPhase = 'active' | 'upcoming' | 'ended';

/** Client-side presentation for the demo; the backend will own these transitions. */
export function getEventPhase(event: EventItem, now = Date.now()): EventPhase {
  if (event.status === 'ended' || new Date(event.endDate).getTime() <= now) return 'ended';
  return new Date(event.date).getTime() <= now ? 'active' : 'upcoming';
}

export function canViewEvent(event: EventItem): boolean {
  return !event.isPrivate || event.audience?.mode === 'all' || Boolean(event.audience?.people.some(person => person.email.toLowerCase() === DEMO_USER.email));
}
