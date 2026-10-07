import type { EventItem } from '../types';

export const DEMO_USER = { name: 'Alex García', email: 'alex.garcia@demo.telefonica.test' };
export function canViewEvent(event: EventItem): boolean {
  return !event.isPrivate || event.audience?.mode === 'all' || Boolean(event.audience?.people.some(person => person.email.toLowerCase() === DEMO_USER.email));
}
