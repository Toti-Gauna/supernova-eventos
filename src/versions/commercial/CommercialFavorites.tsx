import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Heart, Search, X } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import EventCard from '../../components/EventCard';
import { canViewEvent, getEventPhase } from '../../lib/events';
import { getDisplaySession } from '../../lib/eventSessions';
import { useViewer } from '../../features/access/access';
import { useEventClock } from '../../features/explore/useEventClock';
import BackButton from '../../components/ui/BackButton';
import './commercial-pages.css';

interface Props { events: EventItem[]; favorites: string[]; registrations: Registration[]; onFavorite: (id: string) => void; onOpen: (event: EventItem) => void; onExplore: () => void }
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Comercial favorites: search lives in the header; an empty list offers plans to save in one tap. */
export default function CommercialFavorites({ events, favorites, registrations, onFavorite, onOpen, onExplore }: Props) {
  const viewer = useViewer();
  const [query, setQuery] = useState('');
  const now = useEventClock(events);
  const visible = events.filter(event => event.status !== 'draft' && canViewEvent(event, viewer));
  const byDate = (a: EventItem, b: EventItem) => Date.parse(getDisplaySession(a, now).date) - Date.parse(getDisplaySession(b, now).date);
  const saved = visible.filter(event => favorites.includes(event.id)).sort(byDate);
  const filtered = saved.filter(event => normalize(`${event.title} ${event.category} ${event.location}`).includes(normalize(query)));
  const suggestions = saved.length ? [] : visible.filter(event => getEventPhase(event, now) !== 'ended').sort(byDate).slice(0, 3);
  const card = (event: EventItem) => <motion.div key={event.id} layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .2 }}>
    <EventCard event={event} now={now} favorite={favorites.includes(event.id)} joined={registrations.some(registration => registration.eventId === event.id)} onFavorite={() => onFavorite(event.id)} onOpen={() => onOpen(event)} />
  </motion.div>;

  return <section className="favorites-page commercial-page section-container" aria-labelledby="favorites-title">
    <header className="commercial-page-head">
      <BackButton onBack={onExplore} />
      <div className="commercial-page-title"><h1 id="favorites-title">Favoritos</h1><span className="commercial-count">{saved.length}<span className="sr-only"> guardados</span></span></div>
      {saved.length > 0 && <div className="search-field commercial-page-search"><Search size={17} /><input aria-label="Buscar en favoritos" placeholder="Buscar en tus favoritos" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="Limpiar búsqueda de favoritos" onClick={() => setQuery('')}><X size={15} /></button>}</div>}
      <button type="button" className="button primary commercial-page-action" onClick={onExplore}>Descubrir experiencias <ArrowUpRight size={16} /></button>
    </header>
    {saved.length
      ? filtered.length
        ? <div className="event-grid favorites-grid"><AnimatePresence>{filtered.map(card)}</AnimatePresence></div>
        : <div className="commercial-empty"><span className="commercial-empty-icon" aria-hidden="true"><Search size={24} /></span><div><h2>No encontramos ese plan.</h2><p>Probá con otro nombre, tema o lugar.</p></div><button type="button" className="button secondary" onClick={() => setQuery('')}>Ver todos mis favoritos</button></div>
      : <>
        <div className="commercial-empty">
          <span className="commercial-empty-icon" aria-hidden="true"><Heart size={24} /></span>
          <div><h2>Guardá lo que te interesa.</h2><p>Tocá el corazón de una experiencia y la tenés siempre a mano.</p></div>
        </div>
        {suggestions.length > 0 && <section className="commercial-suggestions" aria-labelledby="favorites-suggestions"><h2 id="favorites-suggestions">Para empezar</h2><div className="event-grid favorites-grid"><AnimatePresence>{suggestions.map(card)}</AnimatePresence></div></section>}
      </>}
  </section>;
}
