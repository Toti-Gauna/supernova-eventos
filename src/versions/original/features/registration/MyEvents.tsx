import { ArrowRight, ArrowUpRight, CalendarDays, Compass, Ticket } from 'lucide-react';
import type { EventItem, Registration } from '../../../../types';
import { downloadCalendar, formatEventDate } from '../../../../lib/calendar';
import { publicAssetUrl } from '../../../../lib/assets';
import BackButton from '../../../../components/ui/BackButton';
import { eventForSession, getRegistrationSession } from '../../../../lib/eventSessions';

interface Props { events: EventItem[]; registrations: Registration[]; onOpen: (event: EventItem, sessionId?: string) => void; onExplore: () => void }
export default function MyEvents({ events, registrations, onOpen, onExplore }: Props) {
  const registeredEvents = registrations.flatMap(registration => {
    const rawEvent = events.find(event => event.id === registration.eventId);
    if (!rawEvent) return [];
    const session = getRegistrationSession(rawEvent, registration);
    return [{ rawEvent, event: eventForSession(rawEvent, session), registration, session }];
  }).sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());
  return <section className="my-events section-container"><BackButton onBack={onExplore} /><span className="eyebrow">TUS PRÓXIMAS CONEXIONES</span><div className="section-heading"><div><h1>Tu agenda tiene <span>otra energía.</span></h1><p>Todos tus momentos, tus pases y las ganas de estar ahí.</p></div><button className="button secondary" onClick={onExplore}>Seguir explorando <ArrowUpRight size={16} /></button></div>
    {registeredEvents.length ? <><div className="my-events-summary"><Ticket size={17} /><span>{registeredEvents.length} pase{registeredEvents.length > 1 ? 's' : ''} en tu agenda</span><span>La próxima historia la escribimos juntos.</span></div><div className="my-event-list">{registeredEvents.map(({ rawEvent, event, registration, session }) => <article className="my-event" key={registration.id}><img src={publicAssetUrl(event.image)} alt="" /><div className="my-event-date"><strong>{formatEventDate(event.date, { day: '2-digit' })}</strong><span>{formatEventDate(event.date, { month: 'short' }).replace('.', '').toUpperCase()}</span></div><div className="my-event-detail"><span className="eyebrow">{event.category.toUpperCase()} · {event.mode.toUpperCase()}</span><h2>{event.title}</h2><p>{session?.name && `${session.name} · `}<time dateTime={event.date}>{formatEventDate(event.date, { day: 'numeric', month: 'short' })} · {formatEventDate(event.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h</time><br />{event.location}</p><span>{registration.companions ? `Vos + ${registration.companions} acompañante` : 'Tu lugar está confirmado'}</span></div><div className="my-event-actions"><button className="button primary" onClick={() => onOpen(rawEvent, registration.sessionId || session?.id)}>Ver mi pase <Ticket size={15} /></button><button className="my-calendar" onClick={() => downloadCalendar(event, registration.sessionId || session?.id)}><CalendarDays size={14} /> Agregar al calendario</button></div></article>)}</div></> : <div className="empty-state my-events-empty"><span><Compass size={34} /></span><h2>Tu próximo momento está esperando.</h2><p>Sumate a una experiencia y encontrá tu pase personal acá.</p><button className="button primary" onClick={onExplore}>Explorar experiencias <ArrowRight size={17} /></button></div>}
  </section>;
}
