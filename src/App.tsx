import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ArrowUpRight, Play } from 'lucide-react';
import type { AppView, EventItem, Registration } from './types';
import { DEMO_ARCHIVE_MIGRATION_KEY, INITIAL_EVENTS, withDemoArchive } from './data/events';
import { readStorage, writeStorage } from './lib/storage';
import { canViewEvent, getEventPhase } from './lib/events';
import { changeSessionRegistration, eventForSession, getEventSession, getRegistrationSession, mergeEventSessionUpdate, sameRegistrationSession, withEventSessions } from './lib/eventSessions';
import Header from './components/Header';
import Brand from './components/Brand';
import EventExplorer from './features/explore/EventExplorer';
import MyEvents from './features/registration/MyEvents';
import Favorites from './features/favorites/Favorites';
import RegistrationModal from './features/registration/RegistrationModal';
import Profile from './features/profile/Profile';
import SupernovaToast from './components/ui/SupernovaToast';
import { useTheme } from './hooks/useTheme';
import IntroLoading from './features/intro/IntroLoading';
import IntroBoundary from './components/ui/IntroBoundary';
import UniverseHost from './features/universe/UniverseHost';
import HybridHost from './features/hybrid/HybridHost';
import { versionHref } from './versions/catalog';
import { readIntroStartedAt, type UniverseDestination } from './features/universe/contracts';
import { UniversePresentationProvider } from './features/universe/presentation';
import { useUniverseController } from './features/universe/useUniverseController';

const AdminPanel = lazy(() => import('./features/admin/AdminPanel'));
const CinematicIntro = lazy(() => import('./features/intro/CinematicIntro'));
const KEYS = { events: 'supernova-events-v1', registrations: 'supernova-registrations-v1', favorites: 'supernova-favorites-v1', subscribed: 'supernova-subscribed-v1', session: 'supernova-demo-session-v1' };
function storedArray<T>(key: string, fallback: T[]): T[] { const result = readStorage<T[]>(key, fallback); return Array.isArray(result) ? result : fallback; }

export default function App({ variant = '3d' }: { variant?: '3d' | 'hybrid' }) {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<AppView>('explore');
  const [events, setEvents] = useState<EventItem[]>(() => withDemoArchive(storedArray(KEYS.events, INITIAL_EVENTS), readStorage(DEMO_ARCHIVE_MIGRATION_KEY, false)));
  const [registrations, setRegistrations] = useState<Registration[]>(() => storedArray(KEYS.registrations, []));
  const [favorites, setFavorites] = useState<string[]>(() => storedArray(KEYS.favorites, []));
  const [subscribed, setSubscribed] = useState(() => readStorage<boolean>(KEYS.subscribed, false));
  const [sessionActive, setSessionActive] = useState(() => readStorage<boolean>(KEYS.session, true));
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [opening] = useState(() => ({ startedAt: readIntroStartedAt(), dismissed: document.getElementById('intro-bootstrap')?.getAttribute('data-intro-dismissed') === 'true' }));
  const [showIntro, setShowIntro] = useState(() => !opening.dismissed && performance.now() - opening.startedAt < 4000);
  const [studioActive, setStudioActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const universe = useUniverseController(opening.startedAt, showIntro);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('supernova:background-motion', { detail: { paused: universe.userPaused } }));
  }, [universe.userPaused]);
  const [introRevealed, setIntroRevealed] = useState(false);
  const viewRef = useRef(view);
  const studioRef = useRef(studioActive);
  const eventReturn = useRef<UniverseDestination | null>(null);
  const registrationsRef = useRef(registrations);
  const eventsRef = useRef(events);
  const replayFocus = useRef<HTMLElement | null>(null);
  const deepLinkHandled = useRef(false);
  viewRef.current = view;
  studioRef.current = studioActive;
  registrationsRef.current = registrations;
  eventsRef.current = events;
  useLayoutEffect(() => {
    document.getElementById('intro-bootstrap')?.remove();
    document.getElementById('intro-bootstrap-style')?.remove();
    document.getElementById('intro-bootstrap-note')?.remove();
    if (opening.dismissed) universe.finishOpening();
  }, [opening.dismissed, universe.finishOpening]);
  useEffect(() => {
    if (writeStorage(KEYS.events, events)) writeStorage(DEMO_ARCHIVE_MIGRATION_KEY, true);
    else setToast('El almacenamiento del navegador está lleno. Los cambios se conservan durante esta sesión.');
  }, [events]);
  useEffect(() => { if (!writeStorage(KEYS.registrations, registrations)) setToast('No pudimos guardar tu pase en el navegador. Se conserva durante esta sesión.'); }, [registrations]);
  useEffect(() => { writeStorage(KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { writeStorage(KEYS.subscribed, subscribed); }, [subscribed]);
  useEffect(() => { writeStorage(KEYS.session, sessionActive); }, [sessionActive]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 5200); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    setIntroRevealed(false);
    if (!showIntro || universe.status !== 'ready' || universe.reducedMotion) return;
    const timer = window.setTimeout(() => setIntroRevealed(true), Math.max(0, universe.introStartedAtMs + 2750 - performance.now()));
    return () => window.clearTimeout(timer);
  }, [showIntro, universe.status, universe.reducedMotion, universe.introStartedAtMs]);
  const closeModal = useCallback(() => {
    setSelectedEvent(null);
    setSelectedSessionId(undefined);
    universe.issueCommand(eventReturn.current ?? { kind: 'section', view: viewRef.current }, 'close-event');
    eventReturn.current = null;
  }, [universe.issueCommand]);
  const finishIntro = useCallback(() => { setShowIntro(false); universe.finishOpening(); }, [universe.finishOpening]);
  const failedIntro = useCallback(() => {
    finishIntro();
    queueMicrotask(() => {
      const target = replayFocus.current?.isConnected ? replayFocus.current : document.getElementById('main-content');
      target?.focus({ preventScroll: true });
    });
  }, [finishIntro]);
  const wizardChanged = useCallback((active: boolean) => {
    if (viewRef.current !== 'admin' || studioRef.current === active) return;
    studioRef.current = active;
    setStudioActive(active);
    universe.issueCommand(active ? { kind: 'studio' } : { kind: 'section', view: 'admin' }, active ? 'open-studio' : 'close-studio');
  }, [universe.issueCommand]);
  function openEvent(event: EventItem, sessionId?: string) {
    eventReturn.current = studioRef.current && viewRef.current === 'admin' ? { kind: 'studio' } : { kind: 'section', view: viewRef.current };
    setSelectedEvent(event);
    setSelectedSessionId(sessionId);
    universe.issueCommand({ kind: 'event', eventId: event.id, category: event.category }, 'open-event');
  }
  function navigate(next: AppView) {
    studioRef.current = false;
    setSelectedEvent(null); setSelectedSessionId(undefined); setStudioActive(false); setView(next);
    universe.issueCommand({ kind: 'section', view: next }, 'navigate');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function replayIntro() { replayFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; universe.replay({ kind: 'section', view }); setShowIntro(true); }
  function favorite(id: string) { setFavorites(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]); }
  function logout() { studioRef.current = false; setSelectedEvent(null); setSelectedSessionId(undefined); setStudioActive(false); setToast(null); setView('explore'); setSessionActive(false); universe.issueCommand({ kind: 'section', view: 'explore' }, 'navigate', performance.now() - 2000); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function subscribe() { setSubscribed(v => !v); setToast(subscribed ? 'Desactivaste las novedades en esta demo.' : '¡Ya estás en órbita! Preferencia guardada en este navegador.'); }
  function register(event: EventItem, name: string, email: string, companions: number, sessionId?: string): Registration | null {
    const current = eventsRef.current.find(e => e.id === event.id);
    if (!current) return null;
    const session = getEventSession(current, sessionId);
    if (!session) return null;
    const existing = registrationsRef.current.find(r => sameRegistrationSession(current, r, session.id));
    if (existing) return existing;
    if (!canViewEvent(current) || current.status !== 'published' || getEventPhase(eventForSession(current, session)) === 'ended' || session.capacity - session.registered < 1 + companions || !Number.isInteger(companions) || companions < 0 || companions > current.companions || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return null;
    const registration: Registration = { id: `SN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, eventId: event.id, sessionId: session.id, sessionSnapshot: { ...session }, name: name.trim(), email: email.trim(), companions, createdAt: new Date().toISOString() };
    registrationsRef.current = [...registrationsRef.current, registration];
    eventsRef.current = eventsRef.current.map(e => e.id === event.id ? changeSessionRegistration(e, session.id, 1 + companions) : e);
    setRegistrations(registrationsRef.current);
    setEvents(eventsRef.current);
    universe.issueCommand({ kind: 'event', eventId: event.id, category: event.category }, 'registration-success');
    return registration;
  }
  function cancel(registration: Registration) {
    const stored = registrationsRef.current.find(r => r.id === registration.id);
    if (!stored) return;
    registrationsRef.current = registrationsRef.current.filter(r => r.id !== stored.id);
    eventsRef.current = eventsRef.current.map(e => {
      if (e.id !== stored.eventId) return e;
      const session = getRegistrationSession(e, stored);
      return session ? changeSessionRegistration(e, session.id, -1 - stored.companions) : e;
    });
    setRegistrations(registrationsRef.current);
    setEvents(eventsRef.current);
    setToast('Liberaste tu lugar. Te esperamos en una próxima experiencia.');
  }
  function create(event: EventItem) {
    if (eventsRef.current.some(e => e.id === event.id)) return;
    const created = event.sessions?.length ? withEventSessions(event, event.sessions.map(session => ({ ...session, registered: 0 }))) : { ...event, registered: 0 };
    eventsRef.current = [created, ...eventsRef.current]; setEvents(eventsRef.current);
    setToast(event.status === 'draft' ? 'Borrador guardado en este navegador.' : 'Evento publicado en esta demo. Los emails no se enviaron.');
  }
  function update(event: EventItem) {
    const current = eventsRef.current.find(item => item.id === event.id);
    const updated = current ? mergeEventSessionUpdate(current, event) : null;
    if (!updated) { setToast('Conservá las funciones que tienen inscriptos y sus horarios. El cupo debe cubrir sus lugares ocupados.'); return; }
    eventsRef.current = eventsRef.current.map(item => item.id === event.id ? updated : item); setEvents(eventsRef.current);
    setToast('Cambios guardados en esta demo. Los emails no se enviaron.');
  }
  useEffect(() => {
    if (showIntro || !sessionActive || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    const query = new URLSearchParams(window.location.search);
    const eventId = query.get('evento');
    if (!eventId) return;
    const event = eventsRef.current.find(item => item.id === eventId && item.status !== 'draft' && canViewEvent(item));
    const sessionId = query.get('funcion') || undefined;
    if (!event || !getEventSession(event, sessionId)) { setToast('No encontramos ese evento o esa función en esta demo.'); return; }
    eventReturn.current = { kind: 'section', view: viewRef.current };
    setSelectedEvent(event); setSelectedSessionId(sessionId);
    universe.issueCommand({ kind: 'event', eventId: event.id, category: event.category }, 'open-event');
  }, [showIntro, sessionActive, universe.issueCommand]);
  const selectedLiveEvent = selectedEvent ? selectedEvent.status === 'draft' ? selectedEvent : events.find(e => e.id === selectedEvent.id) ?? selectedEvent : null;
  const immersiveStudio = view === 'admin' && studioActive;
  const visibleFavoriteCount = events.filter(event => favorites.includes(event.id) && event.status !== 'draft' && canViewEvent(event)).length;
  const favoriteSatellites = useMemo(() => events
    .filter(event => favorites.includes(event.id) && event.status !== 'draft' && canViewEvent(event))
    .sort((a, b) => a.id.localeCompare(b.id)).slice(0, 8)
    .map(event => ({ eventId: event.id, category: event.category })), [events, favorites]);
  const presentation = useMemo(() => ({ status: universe.status, command: universe.command, introStartedAtMs: universe.introStartedAtMs }), [universe.status, universe.command, universe.introStartedAtMs]);
  const ExperienceHost = variant === 'hybrid' ? HybridHost : UniverseHost;

  return <MotionConfig reducedMotion="user"><UniversePresentationProvider value={presentation}>
    <ExperienceHost introActive={showIntro} command={universe.command} favoriteSatellites={favoriteSatellites} reducedMotion={universe.reducedMotion} paused={universe.paused} quality="auto" onSettled={universe.onSettled} onStatusChange={universe.onStatusChange} status={universe.status} settled={universe.settled} settlementHistory={universe.settlementHistory} />
    <div data-experience={variant} data-universe-enabled="true" data-universe-status={universe.status} data-universe-event={String(!!selectedLiveEvent)} data-universe-reveal={String(introRevealed)} data-universe-paused={String(universe.paused)} className={`app-shell view-${view} ${showIntro ? 'intro-playing' : ''} ${sessionActive ? '' : 'signed-out'}`}><a className="skip-link" href="#main-content">Ir al contenido</a>
    {sessionActive && !immersiveStudio && !selectedLiveEvent && <Header view={view} onNavigate={navigate} registrations={registrations} favoriteCount={visibleFavoriteCount} onLogout={logout} theme={theme} onThemeToggle={toggleTheme} />}
    <main id="main-content" className={immersiveStudio ? 'studio-main' : !sessionActive ? 'session-main' : ''} tabIndex={-1}>{sessionActive ? <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
      {view === 'explore' && <EventExplorer events={events} registrations={registrations} favorites={favorites} onFavorite={favorite} onOpen={openEvent} subscribed={subscribed} onSubscribe={subscribe} />}
      {view === 'registrations' && <MyEvents events={events} registrations={registrations} onOpen={openEvent} onExplore={() => navigate('explore')} />}
      {view === 'favorites' && <Favorites events={events} favorites={favorites} registrations={registrations} onFavorite={favorite} onOpen={openEvent} onExplore={() => navigate('explore')} />}
      {view === 'profile' && <Profile subscribed={subscribed} registrations={registrations.length} favorites={visibleFavoriteCount} onSubscribe={subscribe} onLogout={logout} onBack={() => navigate('explore')} motionPaused={universe.userPaused} onMotionToggle={universe.toggleMotion} universeStatus={universe.status} onUniverseRetry={universe.retry} />}
      {view === 'admin' && <div className={immersiveStudio ? 'studio-container' : 'section-container'}><Suspense fallback={<div className="page-loading"><span className="loading-star">✦</span><p>Preparando tu espacio de creación...</p></div>}><AdminPanel events={events} registrations={registrations} onCreate={create} onUpdate={update} onPreview={event => openEvent({ ...event, status: 'draft' })} notify={setToast} onWizardChange={wizardChanged} onBack={() => navigate('explore')} /></Suspense></div>}
    </motion.div></AnimatePresence> : <section className="session-closed"><Brand compact /><span className="session-orbit" aria-hidden="true">✦</span><span className="eyebrow">NOS VEMOS EN LA PRÓXIMA ÓRBITA</span><h1>Sesión cerrada.</h1><p>Tu próximo gran momento te va a estar esperando.</p><button className="button primary" onClick={() => setSessionActive(true)}>Volver a entrar <ArrowUpRight size={16} /></button><small>Acceso de demostración</small></section>}</main>
    {sessionActive && !immersiveStudio && !selectedLiveEvent && <footer className={`site-footer section-container ${view === 'admin' ? 'compact-footer' : ''}`}><div className="footer-main"><Brand compact />{view !== 'admin' && <span>Un universo de experiencias.<br />Una nueva forma de conectar.</span>}<button onClick={replayIntro}><Play size={11} fill="currentColor" /> Volver a vivir el inicio <ArrowUpRight size={12} /></button></div><div className="footer-bottom"><span>© 2026 Supernova · Telefónica · <a className="version-access" href={versionHref('versions')}>Ver versiones</a></span><span>Experiencia de demostración · Datos guardados en este navegador</span><span>HECHO PARA CONECTAR <span>✦</span></span></div></footer>}
    <AnimatePresence>{selectedLiveEvent && <RegistrationModal key={selectedLiveEvent.id} event={selectedLiveEvent} initialSessionId={selectedSessionId} registrations={selectedLiveEvent.status === 'draft' ? [] : registrations} registration={selectedLiveEvent.status === 'draft' ? undefined : registrations.find(r => sameRegistrationSession(selectedLiveEvent, r, selectedSessionId))} onClose={closeModal} onRegister={register} onCancel={cancel} />}</AnimatePresence>
    <AnimatePresence>{toast && <SupernovaToast message={toast} onDismiss={() => setToast(null)} />}</AnimatePresence>
  </div>{showIntro && <IntroBoundary key={universe.introStartedAtMs} onFailure={failedIntro}><Suspense fallback={<IntroLoading onComplete={finishIntro} variant={variant} />}><CinematicIntro onComplete={finishIntro} variant={variant} /></Suspense></IntroBoundary>}</UniversePresentationProvider></MotionConfig>;
}
