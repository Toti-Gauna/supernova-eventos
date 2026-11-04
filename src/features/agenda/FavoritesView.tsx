import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Heart, Search, X } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import EventCard from '../../components/EventCard';
import { canViewEvent, getEventPhase } from '../../lib/events';
import { getDisplaySession } from '../../lib/eventSessions';
import { useViewer } from '../access/access';
import { useEventClock } from '../explore/useEventClock';
import AgendaHead from './AgendaHead';
import './agenda.css';

interface Props {
  events: EventItem[];
  favorites: string[];
  registrations: Registration[];
  onFavorite: (id: string) => void;
  onOpen: (event: EventItem) => void;
  onExplore: () => void;
  /** Section art placed at the end of the header (the 3D planet slot). */
  art?: ReactNode;
}

const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Favoritos for every version: search lives in the header; an empty list offers plans to save in one tap. */
export default function FavoritesView({ events, favorites, registrations, onFavorite, onOpen, onExplore, art }: Props) {
  const viewer = useViewer();
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  // The clear button disappears with the query, so focus goes back to the field.
  const clearSearch = () => { setQuery(''); search.current?.focus(); };
  const now = useEventClock(events);
  const visible = events.filter(event => event.status !== 'draft' && canViewEvent(event, viewer));
  const byDate = (a: EventItem, b: EventItem) => Date.parse(getDisplaySession(a, now).date) - Date.parse(getDisplaySession(b, now).date);
  const saved = visible.filter(event => favorites.includes(event.id)).sort(byDate);
  const filtered = saved.filter(event => normalize(`${event.title} ${event.category} ${event.location}`).includes(normalize(query)));
  const suggestions = saved.length ? [] : visible.filter(event => getEventPhase(event, now) !== 'ended').sort(byDate).slice(0, 3);
  const card = (event: EventItem) => <motion.div key={event.id} layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .2 }}>
    <EventCard event={event} now={now} favorite={favorites.includes(event.id)} joined={registrations.some(registration => registration.eventId === event.id)} onFavorite={() => onFavorite(event.id)} onOpen={() => onOpen(event)} />
  </motion.div>;

  return <section className="favorites-page agenda-page section-container" aria-labelledby="favorites-title">
    <AgendaHead titleId="favorites-title" title="Favoritos" count={saved.length} countLabel={saved.length === 1 ? 'guardado' : 'guardados'} onBack={onExplore} art={art} artSide="right">
      {saved.length > 0 && <div className="search-field agenda-search">
        <Search size={17} aria-hidden="true" />
        <input ref={search} aria-label="Buscar en favoritos" placeholder="Buscar en tus favoritos" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape' && query) { event.stopPropagation(); setQuery(''); } }} />
        {query && <button type="button" className="agenda-search-clear icon-only" aria-label="Limpiar búsqueda de favoritos" onClick={clearSearch}><X size={15} aria-hidden="true" /></button>}
      </div>}
      <button type="button" className="button primary agenda-action" onClick={onExplore}>Descubrir experiencias <ArrowUpRight size={16} aria-hidden="true" /></button>
    </AgendaHead>
    {saved.length
      ? filtered.length
        ? <div className="event-grid favorites-grid"><AnimatePresence>{filtered.map(card)}</AnimatePresence></div>
        : <div className="agenda-empty" role="status"><span className="agenda-empty-icon" aria-hidden="true"><Search size={24} /></span><div><h2>No encontramos ese plan.</h2><p>Probá con otro nombre, tema o lugar.</p></div><button type="button" className="button secondary" onClick={clearSearch}>Ver todos mis favoritos</button></div>
      : <>
        <div className="agenda-empty">
          <span className="agenda-empty-icon" aria-hidden="true"><Heart size={24} /></span>
          <div><h2>Guardá lo que te interesa.</h2><p>Tocá el corazón de una experiencia y la tenés siempre a mano.</p></div>
        </div>
        {suggestions.length > 0 && <section className="agenda-suggestions" aria-labelledby="favorites-suggestions"><h2 id="favorites-suggestions">Para empezar</h2><div className="event-grid agenda-suggestion-grid"><AnimatePresence>{suggestions.map(card)}</AnimatePresence></div></section>}
      </>}
  </section>;
}
