import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ArrowUpRight, Play } from 'lucide-react';
import type { AccessProfile, AppView, EventItem, Registration } from '../../types';
import { DEMO_ARCHIVE_MIGRATION_KEY, INITIAL_EVENTS, withAccessDefaults, withDemoArchive } from '../../data/events';
import { readStorage, writeStorage } from '../../lib/storage';
import { canAccessEvent, canViewEvent, getEventPhase } from '../../lib/events';
import { changeSessionRegistration, eventForSession, getEventSession, getRegistrationSession, mergeEventSessionUpdate, sameRegistrationSession, withEventSessions } from '../../lib/eventSessions';
import Header from './components/Header';
import Brand from '../../components/Brand';
import AccessGate from '../../features/access/AccessGate';
import { AccessContext, INTERNAL_DEMO_PROFILE, toViewer, useAccessSession } from '../../features/access/access';
import EventExplorer from '../../features/explore/EventExplorer';
import MyEvents from './features/registration/MyEvents';
import Favorites from './features/favorites/Favorites';
import RegistrationModal from './features/registration/RegistrationModal';
import Profile from './features/profile/Profile';
import SupernovaToast from '../../components/ui/SupernovaToast';
import { COMMERCIAL_THEME_KEY, useTheme } from './hooks/useTheme';
import { versionHref } from '../catalog';
import IntroLoading from './features/intro/IntroLoading';

const AdminPanel = lazy(() => import('./features/admin/AdminPanel'));
const CinematicIntro = lazy(() => import('./features/intro/CinematicIntro'));
const KEYS = { events: 'supernova-events-v1', registrations: 'supernova-registrations-v1', favorites: 'supernova-favorites-v1', subscribed: 'supernova-subscribed-v1' };
function storedArray<T>(key: string, fallback: T[]): T[] { const result = readStorage<T[]>(key, fallback); return Array.isArray(result) ? result : fallback; }

export default function App({ variant = 'original' }: { variant?: 'original' | 'commercial' }) {
  const commercial = variant === 'commercial';
  const { theme, toggleTheme } = useTheme(commercial ? COMMERCIAL_THEME_KEY : undefined, commercial ? 'light' : 'dark');
  const [view, setView] = useState<AppView>('explore');
  const [events, setEvents] = useState<EventItem[]>(() => withAccessDefaults(withDemoArchive(storedArray(KEYS.events, INITIAL_EVENTS), readStorage(DEMO_ARCHIVE_MIGRATION_KEY, false))));
  const [registrations, setRegistrations] = useState<Registration[]>(() => storedArray(KEYS.registrations, []));
  const [favorites, setFavorites] = useState<string[]>(() => storedArray(KEYS.favorites, []));
  const [subscribed, setSubscribed] = useState(() => readStorage<boolean>(KEYS.subscribed, false));
  const { access, signedOut, signIn, signOut } = useAccessSession();
  const sessionActive = access !== null;
  const viewer = useMemo(() => access ? toViewer(access) : toViewer(INTERNAL_DEMO_PROFILE), [access]);
  const viewerRef = useRef(viewer);
  viewerRef.current = viewer;
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [showIntro, setShowIntro] = useState(!commercial);
  const [studioActive, setStudioActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const registrationsRef = useRef(registrations);
  const eventsRef = useRef(events);
  const deepLinkHandled = useRef(false);
  registrationsRef.current = registrations;
  eventsRef.current = events;
  useLayoutEffect(() => {
    document.getElementById('intro-bootstrap')?.remove();
    document.getElementById('intro-bootstrap-style')?.remove();
    document.getElementById('intro-bootstrap-note')?.remove();
    delete document.documentElement.dataset.universe;
  }, []);
  useEffect(() => {
    if (writeStorage(KEYS.events, events)) writeStorage(DEMO_ARCHIVE_MIGRATION_KEY, true);
    else setToast('El almacenamiento del navegador está lleno. Los cambios se conservan durante esta sesión.');
  }, [events]);
  useEffect(() => { if (!writeStorage(KEYS.registrations, registrations)) setToast('No pudimos guardar tu pase en el navegador. Se conserva durante esta sesión.'); }, [registrations]);
  useEffect(() => { writeStorage(KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { writeStorage(KEYS.subscribed, subscribed); }, [subscribed]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 5200); return () => window.clearTimeout(timer); }, [toast]);
  const closeModal = useCallback(() => { setSelectedEvent(null); setSelectedSessionId(undefined); }, []);
  const finishIntro = useCallback(() => setShowIntro(false), []);
  function openEvent(event: EventItem, sessionId?: string) { setSelectedEvent(event); setSelectedSessionId(sessionId); }
  function navigate(next: AppView) { if (next === 'admin' && access?.kind === 'external') next = 'explore'; setSelectedEvent(null); setSelectedSessionId(undefined); setStudioActive(false); setView(next); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function favorite(id: string) { setFavorites(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]); }
  function enter(profile: AccessProfile) { signIn(profile); setView('explore'); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function logout() { setSelectedEvent(null); setSelectedSessionId(undefined); setStudioActive(false); setToast(null); setView('explore'); signOut(); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function subscribe() { setSubscribed(v => !v); setToast(subscribed ? 'Desactivaste las novedades en esta demo.' : '¡Ya estás en órbita! Preferencia guardada en este navegador.'); }
  function register(event: EventItem, name: string, email: string, companions: number, sessionId?: string): Registration | null {
    const current = eventsRef.current.find(e => e.id === event.id);
    if (!current) return null;
    const session = getEventSession(current, sessionId);
    if (!session) return null;
    const existing = registrationsRef.current.find(r => sameRegistrationSession(current, r, session.id));
    if (existing) return existing;
    if (!canViewEvent(current, viewerRef.current) || current.status !== 'published' || getEventPhase(eventForSession(current, session)) === 'ended' || session.capacity - session.registered < 1 + companions || !Number.isInteger(companions) || companions < 0 || companions > current.companions || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return null;
    const registration: Registration = { id: `SN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, eventId: event.id, sessionId: session.id, sessionSnapshot: { ...session }, name: name.trim(), email: email.trim(), companions, createdAt: new Date().toISOString() };
    registrationsRef.current = [...registrationsRef.current, registration];
    eventsRef.current = eventsRef.current.map(e => e.id === event.id ? changeSessionRegistration(e, session.id, 1 + companions) : e);
    setRegistrations(registrationsRef.current);
    setEvents(eventsRef.current);
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
    const requested = eventsRef.current.find(item => item.id === eventId && item.status !== 'draft');
    if (requested && !canAccessEvent(requested, viewerRef.current.kind)) { setToast(viewerRef.current.kind === 'external' ? 'Este evento es solo para personal interno.' : 'Este evento es solo para personal externo.'); return; }
    const event = requested && canViewEvent(requested, viewerRef.current) ? requested : undefined;
    const sessionId = query.get('funcion') || undefined;
    if (!event || !getEventSession(event, sessionId)) { setToast('No encontramos ese evento o esa función en esta demo.'); return; }
    setSelectedEvent(event); setSelectedSessionId(sessionId);
  }, [showIntro, sessionActive]);
  const selectedLiveEvent = selectedEvent ? selectedEvent.status === 'draft' ? selectedEvent : events.find(e => e.id === selectedEvent.id) ?? selectedEvent : null;
  const immersiveStudio = view === 'admin' && studioActive;
  const visibleFavoriteCount = events.filter(event => favorites.includes(event.id) && event.status !== 'draft' && canViewEvent(event, viewer)).length;

  return <AccessContext.Provider value={access ?? INTERNAL_DEMO_PROFILE}><MotionConfig reducedMotion="user"><div data-experience={variant} className={`app-shell view-${view} ${sessionActive ? '' : 'signed-out'}`}>{!commercial && <div className="ambient-stars" aria-hidden="true" />}<a className="skip-link" href="#main-content">Ir al contenido</a>
    {sessionActive && !immersiveStudio && !selectedLiveEvent && <Header view={view} onNavigate={navigate} registrations={registrations} favoriteCount={visibleFavoriteCount} onLogout={logout} theme={theme} onThemeToggle={toggleTheme} />}
    <main id="main-content" className={immersiveStudio ? 'studio-main' : !sessionActive ? 'session-main' : ''} tabIndex={-1}>{sessionActive ? <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
      {view === 'explore' && <EventExplorer layout={commercial ? 'commercial' : 'classic'} events={events} registrations={registrations} favorites={favorites} onFavorite={favorite} onOpen={openEvent} subscribed={subscribed} onSubscribe={subscribe} />}
      {view === 'registrations' && <MyEvents events={events} registrations={registrations} onOpen={openEvent} onExplore={() => navigate('explore')} />}
      {view === 'favorites' && <Favorites events={events} favorites={favorites} registrations={registrations} onFavorite={favorite} onOpen={openEvent} onExplore={() => navigate('explore')} />}
      {view === 'profile' && <Profile subscribed={subscribed} registrations={registrations.length} favorites={visibleFavoriteCount} onSubscribe={subscribe} onLogout={logout} onBack={() => navigate('explore')} />}
      {view === 'admin' && <div className={immersiveStudio ? 'studio-container' : 'section-container'}><Suspense fallback={<div className="page-loading"><span className="loading-star">✦</span><p>Preparando tu espacio de creación...</p></div>}><AdminPanel events={events} registrations={registrations} onCreate={create} onUpdate={update} onPreview={event => openEvent({ ...event, status: 'draft' })} notify={setToast} onWizardChange={setStudioActive} onBack={() => navigate('explore')} /></Suspense></div>}
    </motion.div></AnimatePresence> : <AccessGate onEnter={enter} signedOut={signedOut} />}</main>
    {sessionActive && !immersiveStudio && !selectedLiveEvent && <footer className={`site-footer section-container ${view === 'admin' ? 'compact-footer' : ''}`}><div className="footer-main"><Brand compact />{view !== 'admin' && <span>Un universo de experiencias.<br />Una nueva forma de conectar.</span>}{!commercial && <button onClick={() => setShowIntro(true)}><Play size={11} fill="currentColor" /> Volver a vivir el inicio <ArrowUpRight size={12} /></button>}</div><div className="footer-bottom"><span>© 2026 Órbita · Personal · <a className="version-access" href={versionHref('versions')}>Ver versiones</a></span><span>Experiencia de demostración · Datos guardados en este navegador</span><span>HECHO PARA CONECTAR <span>✦</span></span></div></footer>}
    <AnimatePresence>{selectedLiveEvent && <RegistrationModal key={selectedLiveEvent.id} event={selectedLiveEvent} initialSessionId={selectedSessionId} registrations={selectedLiveEvent.status === 'draft' ? [] : registrations} registration={selectedLiveEvent.status === 'draft' ? undefined : registrations.find(r => sameRegistrationSession(selectedLiveEvent, r, selectedSessionId))} onClose={closeModal} onRegister={register} onCancel={cancel} />}</AnimatePresence>
    <AnimatePresence>{toast && <SupernovaToast message={toast} onDismiss={() => setToast(null)} />}</AnimatePresence>
  </div>{showIntro && <Suspense fallback={<IntroLoading onComplete={finishIntro} />}><CinematicIntro onComplete={finishIntro} /></Suspense>}</MotionConfig></AccessContext.Provider>;
}
