import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Heart, Search, X } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import EventCard from '../../components/EventCard';
import { canViewEvent } from '../../lib/events';

interface Props {
  events: EventItem[];
  favorites: string[];
  registrations: Registration[];
  onFavorite: (id: string) => void;
  onOpen: (event: EventItem) => void;
  onExplore: () => void;
}

export default function Favorites({ events, favorites, registrations, onFavorite, onOpen, onExplore }: Props) {
  const [query, setQuery] = useState('');
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const saved = events.filter(event => favorites.includes(event.id) && event.status !== 'draft' && canViewEvent(event))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const filtered = saved.filter(event => normalize(`${event.title} ${event.category} ${event.location}`).includes(normalize(query)));
  return <section className="favorites-page section-container">
    <div className="favorites-heading"><div><span className="eyebrow">TU PROPIA CONSTELACIÓN</span><h1>Esos planes que <span>te guardaste.</span></h1><p>Un lugar para lo que te inspira. Volvé cuando quieras dar el próximo paso.</p></div><button className="button secondary" onClick={onExplore}>Seguir explorando <ArrowUpRight size={16} /></button></div>
    {saved.length ? <>
      <div className="favorites-toolbar"><span><Heart size={16} /> {saved.length} experiencia{saved.length !== 1 ? 's' : ''} guardada{saved.length !== 1 ? 's' : ''}</span><div className="search-field"><Search size={17} /><input aria-label="Buscar en favoritos" placeholder="Buscar en tus favoritos" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="Limpiar búsqueda de favoritos" onClick={() => setQuery('')}><X size={15} /></button>}</div></div>
      {filtered.length ? <div className="event-grid favorites-grid"><AnimatePresence>{filtered.map(event => <motion.div key={event.id} layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .2 }}><EventCard event={event} favorite joined={registrations.some(registration => registration.eventId === event.id)} onFavorite={() => onFavorite(event.id)} onOpen={() => onOpen(event)} /></motion.div>)}</AnimatePresence></div> : <div className="empty-state"><span><Search size={28} /></span><h2>No encontramos ese plan.</h2><p>Probá con otro nombre, tema o lugar.</p><button className="button secondary" onClick={() => setQuery('')}>Ver todos mis favoritos</button></div>}
    </> : <div className="empty-state favorites-empty"><span><Heart size={30} /></span><h2>Lo que te gusta, cerca.</h2><p>Tocá el corazón de una experiencia para encontrarla acá.</p><button className="button primary" onClick={onExplore}>Descubrir experiencias <ArrowUpRight size={16} /></button></div>}
  </section>;
}
