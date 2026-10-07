import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Heart, MapPin, Monitor } from 'lucide-react';
import type { EventItem } from '../types';
import { formatEventDate } from '../lib/calendar';
import { publicAssetUrl } from '../lib/assets';

interface Props { event: EventItem; joined: boolean; favorite: boolean; onFavorite: () => void; onOpen: () => void }

export default function EventCard({ event, joined, favorite, onFavorite, onOpen }: Props) {
  const reducedMotion = useReducedMotion();
  const remaining = Math.max(0, event.capacity - event.registered);
  const categoryClass = event.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return <motion.article className={`event-card category-${categoryClass} ${joined ? 'is-joined' : ''}`} whileHover={reducedMotion ? undefined : { y: -4 }} transition={{ type: 'spring', stiffness: 360, damping: 28 }}>
    <button className="event-cover" onClick={onOpen} aria-label={`Ver ${event.title}`}>
      <img src={publicAssetUrl(event.image)} alt="" loading="lazy" onError={e => { e.currentTarget.style.opacity = '0'; }} />
      <span className="cover-shade" />
      <span className="category-badge">{event.category}</span>
      <span className="date-badge"><strong>{formatEventDate(event.date, { day: '2-digit' })}</strong><span>{formatEventDate(event.date, { month: 'short' }).replace('.', '').toUpperCase()}</span></span>
      <span className="cover-open" aria-hidden="true"><ArrowUpRight size={22} /></span>
    </button>
    <motion.button className={`favorite-button ${favorite ? 'active' : ''}`} aria-label={favorite ? `Quitar ${event.title} de favoritos` : `Guardar ${event.title}`} aria-pressed={favorite} onClick={onFavorite} whileTap={reducedMotion ? undefined : { scale: .86 }}>
      <motion.span key={String(favorite)} initial={reducedMotion ? false : { scale: .7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 16 }}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></motion.span>
    </motion.button>
    <div className="event-card-body">
      <div className="event-meta"><span className="event-location">{event.mode === 'Online' ? <Monitor size={14} /> : <MapPin size={14} />}{event.location.split(' · ')[0]}</span><time dateTime={event.date}>{formatEventDate(event.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h</time></div>
      <h3><button onClick={onOpen}>{event.title}</button></h3><p>{event.subtitle}</p>
      <div className="event-card-bottom">
        <span className="attendees"><span>{event.registered > 0 ? <><strong>{event.registered}</strong> se sumaron</> : 'Sé el primero'}</span></span>
        <button className={`card-cta ${joined ? 'joined' : ''}`} onClick={onOpen}>{joined ? <><Check size={16} /> Mi pase</> : <>Me sumo <ArrowUpRight size={18} /></>}</button>
      </div>
      {remaining < 20 && !joined && <span className="scarcity"><span />{remaining === 0 ? 'Cupos completos' : `Quedan ${remaining} lugares`}</span>}
    </div>
  </motion.article>;
}
