import { ArrowUpRight, Heart, Ticket } from 'lucide-react';
import type { EventItem, EventSession } from '../../types';
import type { EventPhase } from '../../lib/events';
import { formatEventDate } from '../../lib/calendar';
import { eventForSession } from '../../lib/eventSessions';
import { publicAssetUrl } from '../../lib/assets';
import './orbit-event-preview.css';

interface Props {
  event: EventItem;
  session: EventSession;
  phase: EventPhase;
  joined: boolean;
  favorite: boolean;
  onOpen: () => void;
  onFavorite: () => void;
}

export default function OrbitEventPreview({ event, session, phase, joined, favorite, onOpen, onFavorite }: Props) {
  const displayed = eventForSession(event, session);
  const dateLabel = `${formatEventDate(displayed.date, { day:'2-digit',month:'short' }).replace('.', '')} · ${formatEventDate(displayed.date, { hour:'2-digit',minute:'2-digit',hour12:false })} h`;
  const action = joined ? 'Mi pase' : 'Anotarme';
  return <article className="orbit-event-preview" data-event-state={phase} data-preview-kind={joined ? 'registered' : 'available'} data-event-id={event.id} data-session-id={session.id}>
    <button type="button" className="orbit-event-open" aria-label={`${action}: ${event.title}, ${session.name ? `${session.name}, ` : ''}${dateLabel}`} onClick={onOpen}>
      <img src={publicAssetUrl(event.image)} alt="" loading="lazy" />
      <span className="orbit-event-copy">
        <span className="orbit-event-title" title={event.title}>{event.title}</span>
        <span className="orbit-event-meta" title={`${session.name ? `${session.name} · ` : ''}${dateLabel}`}><time dateTime={displayed.date}>{dateLabel}</time>{session.name && <span className="orbit-event-session"> · {session.name}</span>}</span>
        <span className="orbit-event-status"><span className="orbit-event-category">{event.category} · </span>{joined ? 'Confirmado' : phase === 'active' ? 'En vivo' : 'Disponible'}<span className="orbit-event-action-mobile">{action} <ArrowUpRight size={12} aria-hidden="true" /></span></span>
      </span>
      <span className="orbit-event-cta">{action}{joined ? <Ticket size={16} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}</span>
    </button>
    <button type="button" className={`orbit-event-favorite ${favorite ? 'is-saved' : ''}`} aria-label={`${favorite ? 'Quitar plan de favoritos' : 'Guardar plan'}: ${event.title}`} aria-pressed={favorite} onClick={onFavorite}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button>
  </article>;
}
