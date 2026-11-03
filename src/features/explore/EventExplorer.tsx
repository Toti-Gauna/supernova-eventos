import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Compass, Heart, Leaf, Music2, Search, SlidersHorizontal, Sparkles, Users, X, Zap } from 'lucide-react';
import type { EventCategory, EventItem, EventSession, Registration } from '../../types';
import EventCard from '../../components/EventCard';
import CosmicScene from '../../components/CosmicScene';
import OrbitEventPreview from './OrbitEventPreview';
import FeaturedBanner from './FeaturedBanner';
import { canViewEvent, getEventPhase } from '../../lib/events';
import { eventLocalDay } from '../../lib/calendar';
import { eventForSession, getDisplaySession, getEventSessions, getRegistrationSession, sameRegistrationSession } from '../../lib/eventSessions';
import SupernovaSelect from '../../components/ui/SupernovaSelect';
import SupernovaDatePicker from '../../components/ui/SupernovaDatePicker';
import { useEventClock } from './useEventClock';
import { useViewer } from '../access/access';
import './explorer.css';

interface Props { events: EventItem[]; registrations: Registration[]; favorites: string[]; onFavorite: (id: string) => void; onOpen: (event: EventItem, sessionId?: string) => void; subscribed: boolean; onSubscribe: () => void; layout?: 'classic' | 'orbital' }
const categories = [{ label: 'Todo el universo', value: 'all', Icon: Compass }, { label: 'Música', value: 'Música', Icon: Music2 }, { label: 'Bienestar', value: 'Bienestar', Icon: Leaf }, { label: 'Tecnología', value: 'Tecnología', Icon: Zap }, { label: 'Comunidad', value: 'Comunidad', Icon: Users }, { label: 'Aprendizaje', value: 'Aprendizaje', Icon: Sparkles }];
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const PAGE_SIZE = 3;
const phases = [
  { key: 'active', label: 'Eventos activos' },
  { key: 'upcoming', label: 'Eventos próximos' },
  { key: 'ended', label: 'Eventos finalizados' },
] as const;
const phaseOrder = { active: 0, upcoming: 1, ended: 2 };
interface CatalogFilters { category: EventCategory | 'all'; query: string; sort: string; mode: string; savedOnly: boolean; fromDate: string }
interface PreviewPlan { event: EventItem; session: EventSession; registration?: Registration }
const initialFilters: CatalogFilters = { category: 'all', query: '', sort: 'date', mode: 'all', savedOnly: false, fromDate: '' };

export default function EventExplorer({ events, registrations, favorites, onFavorite, onOpen, subscribed, onSubscribe, layout = 'orbital' }: Props) {
  const reducedMotion = useReducedMotion();
  const viewer = useViewer();
  const [filters, setFilters] = useState(initialFilters);
  const { category, query, sort, mode, savedOnly, fromDate } = filters;
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const catalog = useRef<HTMLElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const focusPage = useRef(false);
  const now = useEventClock(events);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === '/' && !(e.target as HTMLElement).closest('dialog') && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) { e.preventDefault(); search.current?.focus(); } };
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey);
  }, []);
  const visible = events.filter(event => event.status !== 'draft' && canViewEvent(event, viewer));
  const displayedSessions = new Map(visible.map(event => {
    const sessions = getEventSessions(event).filter(session => !fromDate || eventLocalDay(session.date) >= fromDate);
    return [event.id, getDisplaySession(sessions.length ? { ...event, sessions } : event, now)];
  }));
  const display = (event: EventItem) => eventForSession(event, displayedSessions.get(event.id));
  const filtered = visible.filter(e => (category === 'all' || e.category === category) && normalize(`${e.title} ${e.subtitle} ${e.category} ${e.location}`).includes(normalize(query)) && (mode === 'all' || e.mode === mode) && (!savedOnly || favorites.includes(e.id)) && (!fromDate || getEventSessions(e).some(session => eventLocalDay(session.date) >= fromDate))).sort((a, b) => {
    const priority = phaseOrder[getEventPhase(display(a), now)] - phaseOrder[getEventPhase(display(b), now)];
    if (priority) return priority;
    if (sort === 'title') return a.title.localeCompare(b.title, 'es-AR');
    if (sort === 'available') return (display(b).capacity - display(b).registered) - (display(a).capacity - display(a).registered);
    return new Date(display(a).date).getTime() - new Date(display(b).date).getTime();
  });
  const liveEvents = visible.filter(event => getEventPhase(event, now) !== 'ended');
  const featured = liveEvents.find(event => event.featured) ?? liveEvents[0];
  const sessionMatches = (event: EventItem, session: EventSession) => getEventPhase(eventForSession(event, session), now) !== 'ended' && (!fromDate || eventLocalDay(session.date) >= fromDate);
  const availablePreviews: PreviewPlan[] = filtered.flatMap(event => {
    const session = [...getEventSessions(event)].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
      .find(session => sessionMatches(event, session) && session.capacity > session.registered
        && !registrations.some(registration => sameRegistrationSession(event, registration, session.id)));
    return session ? [{ event, session }] : [];
  }).sort((a, b) => Date.parse(a.session.date) - Date.parse(b.session.date)).slice(0, 2);
  const registeredPreview = registrations.flatMap(registration => {
    const event = filtered.find(event => event.id === registration.eventId);
    const session = event ? getRegistrationSession(event, registration) : undefined;
    return event && session && sessionMatches(event, session) ? [{ event, session, registration }] : [];
  }).sort((a, b) => Date.parse(a.session.date) - Date.parse(b.session.date))[0];
  const orbital = layout === 'orbital';
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageEvents = filtered.slice(start, start + PAGE_SIZE);
  const groups = phases.map(phase => ({
    ...phase,
    total: filtered.filter(event => getEventPhase(display(event), now) === phase.key).length,
    events: pageEvents.filter(event => getEventPhase(display(event), now) === phase.key),
  })).filter(group => group.events.length);
  const pageNumbers = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])].filter(number => number >= 1 && number <= totalPages).sort((a, b) => a - b);
  const resultSummary = filtered.length
    ? `Mostrando ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} de ${filtered.length} eventos`
    : '0 eventos para descubrir';
  const activeFilterCount = Number(mode !== 'all') + Number(savedOnly) + Number(Boolean(fromDate));
  useEffect(() => {
    if (page > totalPages) { focusPage.current = true; setPage(totalPages); }
  }, [page, totalPages]);
  useLayoutEffect(() => {
    if (!focusPage.current) return;
    focusPage.current = false;
    results.current?.focus({ preventScroll: true });
    results.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }, [page]);
  function updateFilters(patch: Partial<CatalogFilters>) {
    focusPage.current = false;
    setFilters(current => ({ ...current, ...patch }));
    setPage(1);
  }
  function clearFilters() { focusPage.current = false; setFilters(initialFilters); setPage(1); }
  function goToPage(nextPage: number) {
    if (nextPage === currentPage || nextPage < 1 || nextPage > totalPages) return;
    focusPage.current = true;
    setPage(nextPage);
  }
  function explore() {
    catalog.current?.focus({ preventScroll: true });
    catalog.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  const searchField = <div className="search-field"><Search size={18} /><input ref={search} aria-label="Buscar experiencias" placeholder="Buscá una experiencia, un tema, un lugar..." value={query} onChange={e => updateFilters({ query:e.target.value })} />{query ? <button onClick={() => updateFilters({ query:'' })} aria-label="Limpiar búsqueda"><X size={15} /></button> : <kbd>/</kbd>}</div>;
  const scene = <CosmicScene featured={featured ? display(featured) : undefined} onExplore={() => { if (featured) onOpen(featured, displayedSessions.get(featured.id)?.id); else explore(); }} />;
  const preview = ({ event, session, registration }: PreviewPlan) => <OrbitEventPreview key={`${event.id}:${session.id}:${registration ? 'registered' : 'available'}`} event={event} session={session} phase={getEventPhase(eventForSession(event, session), now)} joined={Boolean(registration)} favorite={favorites.includes(event.id)} onFavorite={() => onFavorite(event.id)} onOpen={() => onOpen(event, registration?.sessionId || session.id)} />;

  return <>
    <section className={`hero hero-compact ${orbital ? 'hero-orbital' : 'hero-classic'} section-container`}>
      <div className="hero-copy"><div className="hero-orbital-heading"><motion.span className="hero-eyebrow" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .6 }}><span className="live-dot" /> TU PRÓXIMO PLAN</motion.span>
        <motion.h1 aria-label="Salí de la rutina. Entrá en órbita." initial={reducedMotion ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .8, delay: reducedMotion ? 0 : .08, ease: [.22, 1, .36, 1] }}><span className="hero-title-opening">Salí de la rutina.</span><br className="hero-title-opening-break" />Entrá en <span className="hero-gradient">órbita<span className="title-star">✦</span></span>.</motion.h1>
        </div>
        {orbital && <><div className="hero-orbital-search">{searchField}</div><div className="orbit-preview-list" aria-label="Una primera órbita de eventos">
          {availablePreviews.length ? availablePreviews.map(preview) : <p className="orbit-preview-empty">No hay funciones disponibles con estos filtros.</p>}
          {availablePreviews.length === 1 && <p className="orbit-preview-empty">No hay otra función disponible con estos filtros.</p>}
          {registeredPreview ? preview(registeredPreview) : <p className="orbit-preview-empty orbit-preview-reservation">Todavía no tenés una próxima función reservada.</p>}
        </div></>}
        <motion.div className="hero-actions" initial={reducedMotion ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .7, delay: reducedMotion ? 0 : .16 }}><button className="button primary" onClick={explore}>Ver eventos <ArrowUpRight size={18} /></button></motion.div>
      </div>{orbital ? <div className="hero-orbital-universe">{scene}<div className="cosmos-planet-slot" data-universe-surface="hero" data-universe-side="right" data-universe-composition="hero-compact" aria-hidden="true" /></div> : scene}
    </section>
    <section className={`event-section section-container${orbital ? ' orbital-catalog' : ''}`} id="experiencias" ref={catalog} tabIndex={-1} aria-labelledby="catalog-heading">
      <div className="section-heading"><div><span className="eyebrow">TU AGENDA, CON OTRA ENERGÍA</span><h2 id="catalog-heading">Encontrá tu próximo <span>momento.</span></h2></div><span className="section-count"><span className="live-dot" /> {visible.length} experiencias en órbita</span></div>
      <div className={`search-toolbar ${orbital ? 'orbital-catalog-toolbar' : ''}`}>{!orbital && searchField}<div className="sort-field"><CalendarDays size={15} /><SupernovaSelect label="Ordenar experiencias" value={sort} onChange={sort => updateFilters({ sort })} options={[{ value: 'date', label: 'Próximos primero' }, { value: 'available', label: 'Más lugares disponibles' }, { value: 'title', label: 'Nombre: A a Z' }]} /></div><button className={`filter-toggle ${showFilters || activeFilterCount ? 'active' : ''}`} aria-expanded={showFilters} onClick={() => setShowFilters(s => !s)}><SlidersHorizontal size={16} />Filtros{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button></div>
      <AnimatePresence>{showFilters && <motion.div className="expanded-filters" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .18 }}><div><div className="explorer-filter-field"><label htmlFor="explorer-mode">Modalidad</label><SupernovaSelect id="explorer-mode" label="Filtrar por modalidad" value={mode} onChange={mode => updateFilters({ mode })} options={[{ value: 'all', label: 'Todas las modalidades' }, ...['Presencial', 'Online', 'Híbrido'].map(mode => ({ value: mode, label: mode }))]} /></div><div className="explorer-filter-field"><label htmlFor="explorer-date">A partir del</label><SupernovaDatePicker id="explorer-date" label="Filtrar por fecha" value={fromDate} onChange={fromDate => updateFilters({ fromDate })} /></div><button className={`saved-filter ${savedOnly ? 'active' : ''}`} aria-pressed={savedOnly} onClick={() => updateFilters({ savedOnly: !savedOnly })}><Heart size={15} fill={savedOnly ? 'currentColor' : 'none'} />Mis favoritos{savedOnly && <Check size={12} />}</button>{activeFilterCount > 0 && <button className="reset-filters" onClick={clearFilters}>Limpiar filtros <X size={12} /></button>}</div></motion.div>}</AnimatePresence>
      <div className="category-row" role="group" aria-label="Categorías de experiencias">{categories.map(({ label, value, Icon }) => <button key={value} className={category === value ? 'active' : ''} onClick={() => updateFilters({ category: value as EventCategory | 'all' })} aria-pressed={category === value}>{category === value && <motion.span className="category-active-surface" layoutId="active-category" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}<Icon size={15} />{label}{value === 'all' && <span className="category-count">{visible.length}</span>}</button>)}</div>
      <div className="result-info" aria-live="polite" aria-atomic="true"><span>{resultSummary}</span><span>Buenos momentos. Mejor compañía.</span></div>
      {filtered.length ? <>
        <div className="catalog-results" id="catalog-result-list" ref={results} tabIndex={-1} aria-label={`Eventos de la página ${currentPage} de ${totalPages}`}>
          {groups.map(group => <section key={group.key} className="event-phase-group" aria-labelledby={`phase-${group.key}`}>
            <div className="event-phase-heading"><h3 id={`phase-${group.key}`}>{group.label}</h3><span className="event-phase-count" aria-label={`${group.total} eventos en este grupo`}>{group.total}</span></div>
            <div className="event-grid">{group.events.map((event, index) => <motion.div key={event.id} initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .02 }} transition={{ duration: reducedMotion ? 0 : .5, delay: reducedMotion ? 0 : Math.min(index * .045, .15), ease: [.22, 1, .36, 1] }}><EventCard event={event} now={now} session={displayedSessions.get(event.id)} phase={group.key} titleLevel={4} joined={registrations.some(r => r.eventId === event.id)} favorite={favorites.includes(event.id)} onFavorite={() => onFavorite(event.id)} onOpen={() => onOpen(event, displayedSessions.get(event.id)?.id)} /></motion.div>)}</div>
          </section>)}
        </div>
        {totalPages > 1 && <div className="catalog-pagination">
          <p className="pagination-summary">{resultSummary}</p>
          <nav aria-label="Paginación de eventos">
            <button type="button" className="pagination-arrow" aria-label="Página anterior de eventos" aria-controls="catalog-result-list" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}><ChevronLeft size={16} />Anterior</button>
            <ol className="pagination-pages">{pageNumbers.map((number, index) => <Fragment key={number}>
              {index > 0 && number - pageNumbers[index - 1] > 1 && <li aria-hidden="true"><span className="pagination-ellipsis">…</span></li>}
              <li><button type="button" aria-label={`Ir a la página ${number} de eventos`} aria-controls="catalog-result-list" aria-current={number === currentPage ? 'page' : undefined} onClick={() => goToPage(number)}>{number}</button></li>
            </Fragment>)}</ol>
            <button type="button" className="pagination-arrow" aria-label="Página siguiente de eventos" aria-controls="catalog-result-list" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>Siguiente<ChevronRight size={16} /></button>
          </nav>
        </div>}
      </> : <div className="empty-state"><span><Search size={30} /></span><h3>Todavía no hay una órbita por acá.</h3><p>Probá con otra búsqueda o descubrí todo el universo.</p><button className="button secondary" onClick={clearFilters}>Ver todas las experiencias <ArrowRight size={16} /></button></div>}
    </section>
    {featured && <FeaturedBanner event={featured} session={displayedSessions.get(featured.id)} joined={registrations.some(registration => registration.eventId === featured.id)} onOpen={() => onOpen(featured, displayedSessions.get(featured.id)?.id)} />}
    <section className="newsletter section-container"><div className="newsletter-orbit" aria-hidden="true">✦</div><div><span className="eyebrow">LAS MEJORES CONEXIONES ESTÁN POR VENIR</span><h2>Que nada te pase de largo.</h2><p>Activá las novedades y descubrí tu próximo plan antes que nadie.</p></div><button className={`button ${subscribed ? 'secondary' : 'primary'}`} onClick={onSubscribe}>{subscribed ? <><Check size={17} /> Novedades activadas</> : <>Quiero estar en órbita <ArrowUpRight size={17} /></>}</button></section>
  </>;
}
