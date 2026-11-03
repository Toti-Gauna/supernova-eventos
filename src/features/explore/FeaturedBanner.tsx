import { ArrowUpRight, CalendarDays, MapPin, Ticket, UsersRound } from 'lucide-react';
import type { EventItem, EventSession } from '../../types';
import { formatEventDate } from '../../lib/calendar';
import { publicAssetUrl } from '../../lib/assets';
import { eventAccess } from '../../lib/events';
import { eventForSession, getEventSessions } from '../../lib/eventSessions';
import './featured-banner.css';

interface Props { event: EventItem; session?: EventSession; joined: boolean; onOpen: () => void }

/** Festival-style promo for the featured event, inspired by Personal's event banners. */
export default function FeaturedBanner({ event, session, joined, onOpen }: Props) {
  const shown = eventForSession(event, session);
  const sessions = getEventSessions(event);
  const categoryClass = event.category.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const day = formatEventDate(shown.date, { weekday: 'long', day: 'numeric', month: 'long' });
  return <section className={`featured-banner section-container category-${categoryClass}`} aria-labelledby="featured-banner-title">
    <div className="featured-banner-copy">
      <span className="featured-banner-eyebrow"><span aria-hidden="true">✦</span> NO TE LO PIERDAS · {event.category.toUpperCase()}</span>
      <h2 id="featured-banner-title">{event.title}</h2>
      <p>{event.subtitle}</p>
      <ul className="featured-banner-lineup">
        <li><CalendarDays size={15} aria-hidden="true" />{day.charAt(0).toUpperCase() + day.slice(1)}</li>
        <li><MapPin size={15} aria-hidden="true" />{event.location.split(' · ')[0]}</li>
        {sessions.length > 1 && <li><Ticket size={15} aria-hidden="true" />{sessions.length} funciones</li>}
        {eventAccess(event) === 'all' && <li><UsersRound size={15} aria-hidden="true" />Abierto a invitados</li>}
      </ul>
      <button type="button" className="button featured-banner-cta" onClick={onOpen} aria-label={`${joined ? 'Ver mi pase de' : 'Quiero ir a'} ${event.title}`}>{joined ? 'Ver mi pase' : 'Quiero ir'} <ArrowUpRight size={18} /></button>
    </div>
    <div className="featured-banner-art" aria-hidden="true">
      <span className="featured-banner-block" />
      <img src={publicAssetUrl(event.image)} alt="" loading="lazy" onError={image => { image.currentTarget.style.opacity = '0'; }} />
      <span className="featured-banner-date"><strong>{formatEventDate(shown.date, { day: '2-digit' })}</strong>{formatEventDate(shown.date, { month: 'short' }).replace('.', '').toUpperCase()}</span>
    </div>
  </section>;
}
