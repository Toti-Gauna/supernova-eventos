import type { ReactNode } from 'react';
import { ArrowUpRight, CalendarPlus, Clock3, Compass, MapPin, Ticket, UsersRound } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import { downloadCalendar, formatEventDate } from '../../lib/calendar';
import { eventImageProps } from '../../lib/assets';
import { getEventPhase } from '../../lib/events';
import { eventForSession, getRegistrationSession } from '../../lib/eventSessions';
import { useEventClock } from '../explore/useEventClock';
import AgendaHead from './AgendaHead';
import './agenda.css';

interface Props {
  events: EventItem[];
  registrations: Registration[];
  onOpen: (event: EventItem, sessionId?: string) => void;
  onExplore: () => void;
  /** Section art placed left of the title (the 3D planet slot). */
  art?: ReactNode;
}

const slug = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
const STATUS = { next: 'Tu próximo', active: 'En curso', upcoming: 'Confirmado', ended: 'Finalizado' } as const;

/** Mis eventos for every version: one-line header and each pass as a ticket with its actions at hand. */
export default function MyEventsView({ events, registrations, onOpen, onExplore, art }: Props) {
  const now = useEventClock(events);
  const passes = registrations.flatMap(registration => {
    const rawEvent = events.find(event => event.id === registration.eventId);
    if (!rawEvent) return [];
    const session = getRegistrationSession(rawEvent, registration);
    const event = eventForSession(rawEvent, session);
    return [{ rawEvent, event, registration, session, phase: getEventPhase(event, now) }];
  }).sort((a, b) => {
    const aEnded = a.phase === 'ended', bEnded = b.phase === 'ended';
    if (aEnded !== bEnded) return Number(aEnded) - Number(bEnded);
    // Upcoming passes by date; finished ones from the most recent.
    const order = Date.parse(a.event.date) - Date.parse(b.event.date);
    return aEnded ? -order : order;
  });
  const upcoming = passes.filter(pass => pass.phase !== 'ended').length;
  // Only the earliest pass still to come is "Tu próximo"; a live or finished one never is.
  const nextId = passes.find(pass => pass.phase === 'upcoming')?.registration.id;

  return <section className="my-events agenda-page section-container" aria-labelledby="my-events-title">
    <AgendaHead titleId="my-events-title" title="Mis eventos" count={passes.length} countLabel={passes.length === 1 ? 'pase' : 'pases'} onBack={onExplore} art={art} artSide="left">
      {passes.length > 0 && <>
        <p className="agenda-note"><span className={`agenda-note-dot ${upcoming ? '' : 'is-idle'}`} aria-hidden="true" />{upcoming ? `${upcoming} por vivir` : 'Todos finalizados'}</p>
        <button type="button" className="button primary agenda-action" onClick={onExplore}>Explorar experiencias <ArrowUpRight size={16} aria-hidden="true" /></button>
      </>}
    </AgendaHead>
    {passes.length ? <ul className="agenda-ticket-grid">
      {passes.map(({ rawEvent, event, registration, session, phase }) => {
        const sessionId = registration.sessionId || session?.id;
        const ended = phase === 'ended';
        const status = registration.id === nextId ? 'next' : phase;
        const when = session?.name || capitalize(formatEventDate(event.date, { weekday: 'short' }).replace('.', ''));
        return <li key={registration.id} className="agenda-ticket-item">
          <article className={`agenda-ticket category-${slug(event.category)} is-${status}`} aria-labelledby={`pass-${registration.id}`}>
            <div className="agenda-ticket-media">
              <img {...eventImageProps(event.image, '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw')} alt="" loading="lazy" decoding="async" />
              <span className="agenda-ticket-status"><span className="agenda-ticket-status-dot" aria-hidden="true" />{STATUS[status]}</span>
              <span className="agenda-ticket-date" aria-hidden="true"><strong>{formatEventDate(event.date, { day: '2-digit' })}</strong>{formatEventDate(event.date, { month: 'short' }).replace('.', '').toUpperCase()}</span>
            </div>
            <div className="agenda-ticket-body">
              <span className="agenda-ticket-category">{event.category}</span>
              <h2 id={`pass-${registration.id}`}>{event.title}</h2>
              <ul className="agenda-ticket-facts">
                <li><Clock3 size={14} aria-hidden="true" /><time dateTime={event.date}><span className="sr-only">{formatEventDate(event.date)}, </span>{when} · {formatEventDate(event.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h</time></li>
                <li><MapPin size={14} aria-hidden="true" />{event.location.split(' · ')[0]}</li>
                <li><UsersRound size={14} aria-hidden="true" />{registration.companions ? `Vos + ${registration.companions}` : 'Solo vos'}</li>
              </ul>
            </div>
            <div className="agenda-ticket-stub">
              <button type="button" className="button primary agenda-ticket-open" onClick={() => onOpen(rawEvent, sessionId)}>Ver mi pase <Ticket size={15} aria-hidden="true" /></button>
              {!ended && <button type="button" className="agenda-ticket-calendar icon-only" aria-label={`Agregar ${event.title} al calendario`} title="Agregar al calendario" onClick={() => downloadCalendar(event, sessionId)}><CalendarPlus size={18} aria-hidden="true" /></button>}
            </div>
          </article>
        </li>;
      })}
    </ul> : <div className="agenda-empty">
      <span className="agenda-empty-icon" aria-hidden="true"><Compass size={26} /></span>
      <div><h2>Tu agenda está libre.</h2><p>Elegí una experiencia y tu pase aparece acá.</p></div>
      <button type="button" className="button primary" onClick={onExplore}>Explorar experiencias <ArrowUpRight size={16} aria-hidden="true" /></button>
    </div>}
  </section>;
}
