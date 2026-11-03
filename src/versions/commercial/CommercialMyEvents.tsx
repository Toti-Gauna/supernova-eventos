import { ArrowUpRight, CalendarPlus, Clock3, Compass, MapPin, Ticket, UsersRound } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import { downloadCalendar, formatEventDate } from '../../lib/calendar';
import { publicAssetUrl } from '../../lib/assets';
import { getEventPhase } from '../../lib/events';
import { eventForSession, getRegistrationSession } from '../../lib/eventSessions';
import BackButton from '../../components/ui/BackButton';
import './commercial-pages.css';

interface Props { events: EventItem[]; registrations: Registration[]; onOpen: (event: EventItem, sessionId?: string) => void; onExplore: () => void }
const slug = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Comercial agenda: one compact header and every pass as a ticket with its actions at hand. */
export default function CommercialMyEvents({ events, registrations, onOpen, onExplore }: Props) {
  const now = Date.now();
  const passes = registrations.flatMap(registration => {
    const rawEvent = events.find(event => event.id === registration.eventId);
    if (!rawEvent) return [];
    const session = getRegistrationSession(rawEvent, registration);
    const event = eventForSession(rawEvent, session);
    return [{ rawEvent, event, registration, session, ended: getEventPhase(event, now) === 'ended' }];
  }).sort((a, b) => Number(a.ended) - Number(b.ended) || Date.parse(a.event.date) - Date.parse(b.event.date));
  const upcoming = passes.filter(pass => !pass.ended).length;

  return <section className="my-events commercial-page section-container" aria-labelledby="my-events-title">
    <header className="commercial-page-head">
      <BackButton onBack={onExplore} />
      <div className="commercial-page-title"><h1 id="my-events-title">Mis eventos</h1><span className="commercial-count">{passes.length}<span className="sr-only"> pases</span></span></div>
      {passes.length > 0 && <p className="commercial-page-note">{upcoming ? `${upcoming} por vivir` : 'Todos finalizados'}</p>}
      <button type="button" className="button primary commercial-page-action" onClick={onExplore}>Explorar experiencias <ArrowUpRight size={16} /></button>
    </header>
    {passes.length ? <ul className="pass-ticket-grid">
      {passes.map(({ rawEvent, event, registration, session, ended }, index) => {
        const sessionId = registration.sessionId || session?.id;
        const day = formatEventDate(event.date, { weekday: 'short' }).replace('.', '');
        return <li key={registration.id}>
          <article className={`pass-ticket category-${slug(event.category)} ${ended ? 'is-ended' : ''}`} aria-labelledby={`pass-${registration.id}`}>
            <div className="pass-ticket-media">
              <img src={publicAssetUrl(event.image)} alt="" loading="lazy" />
              <span className="pass-ticket-date"><strong>{formatEventDate(event.date, { day: '2-digit' })}</strong>{formatEventDate(event.date, { month: 'short' }).replace('.', '').toUpperCase()}</span>
              <span className="pass-ticket-status">{ended ? 'Finalizado' : index === 0 ? 'Tu próximo' : 'Confirmado'}</span>
            </div>
            <div className="pass-ticket-body">
              <span className="pass-ticket-category">{event.category}</span>
              <h2 id={`pass-${registration.id}`}>{event.title}</h2>
              <ul className="pass-ticket-facts">
                <li><Clock3 size={14} aria-hidden="true" />{session?.name ? `${session.name} · ` : `${day.charAt(0).toUpperCase()}${day.slice(1)} · `}{formatEventDate(event.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h</li>
                <li><MapPin size={14} aria-hidden="true" />{event.location.split(' · ')[0]}</li>
                <li><UsersRound size={14} aria-hidden="true" />{registration.companions ? `Vos + ${registration.companions}` : 'Solo vos'}</li>
              </ul>
            </div>
            <div className="pass-ticket-actions">
              <button type="button" className="button primary" onClick={() => onOpen(rawEvent, sessionId)}>Ver mi pase <Ticket size={15} /></button>
              {!ended && <button type="button" className="pass-ticket-calendar" aria-label={`Agregar ${event.title} al calendario`} title="Agregar al calendario" onClick={() => downloadCalendar(event, sessionId)}><CalendarPlus size={18} /></button>}
            </div>
          </article>
        </li>;
      })}
    </ul> : <div className="commercial-empty">
      <span className="commercial-empty-icon" aria-hidden="true"><Compass size={26} /></span>
      <div><h2>Tu agenda está libre.</h2><p>Elegí una experiencia y tu pase aparece acá.</p></div>
      <button type="button" className="button primary" onClick={onExplore}>Explorar experiencias <ArrowUpRight size={16} /></button>
    </div>}
  </section>;
}
