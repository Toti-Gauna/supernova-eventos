import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Compass, Heart, Leaf, Music2, Search, SlidersHorizontal, Sparkles, Users, X, Zap } from 'lucide-react';
import type { EventCategory, EventItem, Registration } from '../../types';
import EventCard from '../../components/EventCard';
import CosmicScene from '../../components/CosmicScene';
import { canViewEvent } from '../../lib/events';
import { eventLocalDay } from '../../lib/calendar';
import SupernovaSelect from '../../components/ui/SupernovaSelect';
import SupernovaDatePicker from '../../components/ui/SupernovaDatePicker';

interface Props { events: EventItem[]; registrations: Registration[]; favorites: string[]; onFavorite: (id: string) => void; onOpen: (event: EventItem) => void; subscribed: boolean; onSubscribe: () => void }
const categories = [{ label: 'Todo el universo', value: 'all', Icon: Compass }, { label: 'Música', value: 'Música', Icon: Music2 }, { label: 'Bienestar', value: 'Bienestar', Icon: Leaf }, { label: 'Tecnología', value: 'Tecnología', Icon: Zap }, { label: 'Comunidad', value: 'Comunidad', Icon: Users }, { label: 'Aprendizaje', value: 'Aprendizaje', Icon: Sparkles }];
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function EventExplorer({ events, registrations, favorites, onFavorite, onOpen, subscribed, onSubscribe }: Props) {
  const [category, setCategory] = useState<EventCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [mode, setMode] = useState('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const catalog = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === '/' && !(e.target as HTMLElement).closest('dialog') && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) { e.preventDefault(); search.current?.focus(); } };
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey);
  }, []);
  const visible = events.filter(e => e.status === 'published' && new Date(e.endDate).getTime() >= Date.now() && canViewEvent(e));
  const filtered = visible.filter(e => (category === 'all' || e.category === category) && normalize(`${e.title} ${e.subtitle} ${e.category} ${e.location}`).includes(normalize(query)) && (mode === 'all' || e.mode === mode) && (!savedOnly || favorites.includes(e.id)) && (!fromDate || eventLocalDay(e.date) >= fromDate)).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'available' ? (b.capacity - b.registered) - (a.capacity - a.registered) : new Date(a.date).getTime() - new Date(b.date).getTime());
  const featured = visible.find(event => event.featured) ?? visible[0];
  const activeFilterCount = Number(mode !== 'all') + Number(savedOnly) + Number(Boolean(fromDate));
  function clearFilters() { setQuery(''); setCategory('all'); setMode('all'); setSavedOnly(false); setFromDate(''); }
  function explore() { catalog.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }

  return <>
    <section className="hero section-container">
      <div className="hero-copy"><motion.span className="hero-eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}><span className="live-dot" /> EL UNIVERSO DE EVENTOS DE SUPERNOVA</motion.span>
        <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .08, ease: [.22, 1, .36, 1] }}>Salí de la rutina.<br />Entrá en <span className="hero-gradient">órbita<span className="title-star">✦</span></span>.</motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .16 }}>Hay momentos que nos conectan de otra manera.<br className="desktop-break" /> Descubrí experiencias para encontrarnos, inspirarnos<br className="desktop-break" /> y hacer que algo extraordinario pase.</motion.p>
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .25 }}><button className="button primary" onClick={explore}>Encontrá tu experiencia <ArrowUpRight size={18} /></button><span><span className="hero-mini-stars">✦ ✧</span> Hecho para conectar.</span></motion.div>
        <div className="hero-social"><span className="avatar-stack hero-avatars"><i>LM</i><i>JV</i><i>AC</i><i>MS</i></span><div><strong>Un universo. Miles de conexiones.</strong><span>Y tu próximo momento está acá.</span></div></div>
      </div><CosmicScene featured={featured} onExplore={() => { if (featured) onOpen(featured); else explore(); }} />
    </section>
    <div className="experience-divider section-container"><span>COMPARTÍ ALGO EXTRAORDINARIO</span><div /><span className="divider-spark">✦</span><div /><span>CONECTÁ SIN LÍMITES</span></div>
    <section className="event-section section-container" id="experiencias" ref={catalog}>
      <div className="section-heading"><div><span className="eyebrow">TU AGENDA, CON OTRA ENERGÍA</span><h2>Encontrá tu próximo <span>momento.</span></h2></div><span className="section-count"><span className="live-dot" /> {visible.length} experiencias en órbita</span></div>
      <div className="search-toolbar"><div className="search-field"><Search size={18} /><input ref={search} aria-label="Buscar experiencias" placeholder="Buscá una experiencia, un tema, un lugar..." value={query} onChange={e => setQuery(e.target.value)} />{query ? <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><X size={15} /></button> : <kbd>/</kbd>}</div><div className="sort-field"><CalendarDays size={15} /><SupernovaSelect label="Ordenar experiencias" value={sort} onChange={setSort} options={[{ value: 'date', label: 'Próximos primero' }, { value: 'available', label: 'Más lugares disponibles' }, { value: 'title', label: 'Nombre: A a Z' }]} /></div><button className={`filter-toggle ${showFilters || activeFilterCount ? 'active' : ''}`} aria-expanded={showFilters} onClick={() => setShowFilters(s => !s)}><SlidersHorizontal size={16} />Filtros{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button></div>
      <AnimatePresence>{showFilters && <motion.div className="expanded-filters" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .18 }}><div><div className="explorer-filter-field"><label htmlFor="explorer-mode">Modalidad</label><SupernovaSelect id="explorer-mode" label="Filtrar por modalidad" value={mode} onChange={setMode} options={[{ value: 'all', label: 'Todas las modalidades' }, ...['Presencial', 'Online', 'Híbrido'].map(mode => ({ value: mode, label: mode }))]} /></div><div className="explorer-filter-field"><label htmlFor="explorer-date">A partir del</label><SupernovaDatePicker id="explorer-date" label="Filtrar por fecha" value={fromDate} onChange={setFromDate} /></div><button className={`saved-filter ${savedOnly ? 'active' : ''}`} aria-pressed={savedOnly} onClick={() => setSavedOnly(v => !v)}><Heart size={15} fill={savedOnly ? 'currentColor' : 'none'} />Mis favoritos{savedOnly && <Check size={12} />}</button>{activeFilterCount > 0 && <button className="reset-filters" onClick={clearFilters}>Limpiar filtros <X size={12} /></button>}</div></motion.div>}</AnimatePresence>
      <div className="category-row" role="group" aria-label="Categorías de experiencias">{categories.map(({ label, value, Icon }) => <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value as EventCategory | 'all')} aria-pressed={category === value}>{category === value && <motion.span className="category-active-surface" layoutId="active-category" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}<Icon size={15} />{label}{value === 'all' && <span className="category-count">{visible.length}</span>}</button>)}</div>
      <div className="result-info" aria-live="polite"><span>{filtered.length} experiencia{filtered.length === 1 ? '' : 's'} para descubrir</span><span>Buenos momentos. Mejor compañía.</span></div>
      {filtered.length ? <div className="event-grid">{filtered.map((event, index) => <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: .5, delay: Math.min(index * .045, .15), ease: [.22, 1, .36, 1] }}><EventCard event={event} joined={registrations.some(r => r.eventId === event.id)} favorite={favorites.includes(event.id)} onFavorite={() => onFavorite(event.id)} onOpen={() => onOpen(event)} /></motion.div>)}</div> : <div className="empty-state"><span><Search size={30} /></span><h3>Todavía no hay una órbita por acá.</h3><p>Probá con otra búsqueda o descubrí todo el universo.</p><button className="button secondary" onClick={clearFilters}>Ver todas las experiencias <ArrowRight size={16} /></button></div>}
    </section>
    <section className="newsletter section-container"><div className="newsletter-orbit" aria-hidden="true">✦</div><div><span className="eyebrow">LAS MEJORES CONEXIONES ESTÁN POR VENIR</span><h2>Que nada te pase de largo.</h2><p>Activá las novedades y descubrí tu próximo plan antes que nadie.</p></div><button className={`button ${subscribed ? 'secondary' : 'primary'}`} onClick={onSubscribe}>{subscribed ? <><Check size={17} /> Novedades activadas</> : <>Quiero estar en órbita <ArrowUpRight size={17} /></>}</button></section>
  </>;
}
