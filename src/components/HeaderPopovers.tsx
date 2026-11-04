import type { RefObject } from 'react';
import { ArrowUpRight, Bell, CalendarDays, Compass, LogOut, MapPin, Ticket, UserRound, X } from 'lucide-react';
import type { AccessProfile, AppView, EventItem, Registration } from '../types';
import { canViewEvent, getEventPhase } from '../lib/events';
import { eventForSession, getRegistrationSession } from '../lib/eventSessions';
import { formatEventDate } from '../lib/calendar';
import { initials } from '../features/access/access';

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const categorySlug = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

export interface NextPass { event: EventItem; sessionId?: string; date: string; upcoming: number }

/** The closest pass that has not ended yet, among the events this person can see. */
export function findNextPass(events: EventItem[] | undefined, registrations: Registration[], access: AccessProfile, now = Date.now()): NextPass | undefined {
  if (!events) return undefined;
  const viewer = { kind: access.kind, email: access.email };
  const passes = registrations.flatMap(registration => {
    const event = events.find(item => item.id === registration.eventId && item.status !== 'draft');
    const session = event && canViewEvent(event, viewer) ? getRegistrationSession(event, registration) : undefined;
    if (!event || !session || getEventPhase(eventForSession(event, session), now) === 'ended') return [];
    return [{ event, sessionId: registration.sessionId || session.id, date: session.date }];
  }).sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
  return passes[0] ? { ...passes[0], upcoming: passes.length } : undefined;
}

/* Opening a pass replaces the header with the pass dialog. When the dialog closes the
   header mounts again and gives the focus back to the notifications trigger. */
let pendingHeaderFocus = false;
export function requestHeaderFocus() { pendingHeaderFocus = true; }
export function consumeHeaderFocus() { const pending = pendingHeaderFocus; pendingHeaderFocus = false; return pending; }
export function hasHeaderFocusRequest() { return pendingHeaderFocus; }

interface NotificationsProps {
  popover: RefObject<HTMLDivElement | null>;
  registrations: Registration[];
  nextPass?: NextPass;
  onNavigate: (view: AppView) => void;
  onOpenPass?: (pass: NextPass) => void;
  onToggle: (open: boolean) => void;
  universeTargets?: boolean;
}

export function NotificationsPopover({ popover, registrations, nextPass, onNavigate, onOpenPass, onToggle, universeTargets }: NotificationsProps) {
  const total = registrations.length;
  const target = (view: AppView) => universeTargets ? { 'data-universe-target': `section:${view}` } : {};
  return <div ref={popover} id="header-notifications" className="header-popover notifications-popover" popover="auto" aria-labelledby="header-notifications-title" onToggle={event => onToggle((event.nativeEvent as ToggleEvent).newState === 'open')}>
    <div className="popover-heading"><h2 id="header-notifications-title">Notificaciones</h2><button type="button" className="popover-close icon-only" popoverTarget="header-notifications" popoverTargetAction="hide" aria-label="Cerrar notificaciones"><X size={16} aria-hidden="true" /></button></div>
    {nextPass ? <article className={`popover-pass category-${categorySlug(nextPass.event.category)}`} aria-labelledby="header-next-pass-title">
      <span className="popover-pass-date" aria-hidden="true"><strong>{formatEventDate(nextPass.date, { day: '2-digit' })}</strong>{formatEventDate(nextPass.date, { month: 'short' }).replace('.', '').toUpperCase()}</span>
      <div className="popover-pass-copy">
        <small>Tu próximo pase</small>
        <strong id="header-next-pass-title">{nextPass.event.title}</strong>
        <span><CalendarDays size={13} aria-hidden="true" />{formatEventDate(nextPass.date, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').replace(',', '')} · {formatEventDate(nextPass.date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} h</span>
        <span><MapPin size={13} aria-hidden="true" />{nextPass.event.location}</span>
      </div>
      {onOpenPass && <button type="button" className="popover-cta" onClick={() => onOpenPass(nextPass)}>Ver mi pase <Ticket size={15} aria-hidden="true" /></button>}
    </article> : <div className="popover-note">
      <span className="popover-note-icon" aria-hidden="true">{total ? <Ticket size={18} /> : <Bell size={18} />}</span>
      <div><strong>{total ? 'Sin pases por vivir' : 'Todo al día'}</strong><p>{total ? 'Tus experiencias ya pasaron. Elegí la próxima.' : 'Tus próximos planes empiezan en Explorar.'}</p></div>
    </div>}
    <div className="popover-links">
      {total > 0 && <button type="button" className="popover-row" {...target('registrations')} onClick={() => onNavigate('registrations')}>
        <Ticket size={16} aria-hidden="true" /><span>Ver mis eventos</span><span className="popover-row-meta num-pill">{total}</span><ArrowUpRight size={15} aria-hidden="true" />
      </button>}
      {!nextPass && <button type="button" className="popover-row" {...target('explore')} onClick={() => onNavigate('explore')}>
        <Compass size={16} aria-hidden="true" /><span>Explorar experiencias</span><ArrowUpRight size={15} aria-hidden="true" />
      </button>}
    </div>
  </div>;
}

interface ProfileProps {
  popover: RefObject<HTMLDivElement | null>;
  access: AccessProfile;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onToggle: (open: boolean) => void;
  universeTargets?: boolean;
}

export function ProfilePopover({ popover, access, onNavigate, onLogout, onToggle, universeTargets }: ProfileProps) {
  const internal = access.kind === 'internal';
  return <div ref={popover} id="header-profile" className="header-popover profile-popover" popover="auto" onToggle={event => onToggle((event.nativeEvent as ToggleEvent).newState === 'open')}>
    <div className={`account-chip ${internal ? 'is-internal' : 'is-external'}`}>
      <span className="account-avatar num-pill" aria-hidden="true">{initials(access.name)}</span>
      <div className="account-chip-copy">
        <strong>{access.name}</strong>
        <span className="account-email">{access.email}</span>
        <span className="account-access"><span className="account-kind">{internal ? 'Personal interno' : 'Personal externo'}</span> · {access.organization}</span>
      </div>
      <button type="button" className="popover-close icon-only" popoverTarget="header-profile" popoverTargetAction="hide" aria-label="Cerrar menú de perfil"><X size={16} aria-hidden="true" /></button>
    </div>
    <div className="popover-links">
      <button type="button" className="popover-row" {...(universeTargets ? { 'data-universe-target': 'section:profile' } : {})} onClick={() => onNavigate('profile')}>
        <UserRound size={16} aria-hidden="true" /><span>Ver mi perfil</span><ArrowUpRight size={15} aria-hidden="true" />
      </button>
      <button type="button" className="popover-row logout-action" onClick={onLogout}>
        <LogOut size={16} aria-hidden="true" /><span>Cerrar sesión</span>
      </button>
    </div>
  </div>;
}
