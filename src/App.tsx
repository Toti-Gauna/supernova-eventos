import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ArrowUpRight, Play } from 'lucide-react';
import type { AppView, EventItem, Registration } from './types';
import { INITIAL_EVENTS } from './data/events';
import { readStorage, writeStorage } from './lib/storage';
import { canViewEvent } from './lib/events';
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

const AdminPanel = lazy(() => import('./features/admin/AdminPanel'));
const CinematicIntro = lazy(() => import('./features/intro/CinematicIntro'));
const KEYS = { events: 'supernova-events-v1', registrations: 'supernova-registrations-v1', favorites: 'supernova-favorites-v1', subscribed: 'supernova-subscribed-v1', session: 'supernova-demo-session-v1' };
function storedArray<T>(key: string, fallback: T[]): T[] { const result = readStorage<T[]>(key, fallback); return Array.isArray(result) ? result : fallback; }

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<AppView>('explore');
  const [events, setEvents] = useState<EventItem[]>(() => storedArray(KEYS.events, INITIAL_EVENTS));
  const [registrations, setRegistrations] = useState<Registration[]>(() => storedArray(KEYS.registrations, []));
  const [favorites, setFavorites] = useState<string[]>(() => storedArray(KEYS.favorites, []));
  const [subscribed, setSubscribed] = useState(() => readStorage<boolean>(KEYS.subscribed, false));
  const [sessionActive, setSessionActive] = useState(() => readStorage<boolean>(KEYS.session, true));
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [studioActive, setStudioActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useLayoutEffect(() => {
    document.getElementById('intro-bootstrap')?.remove();
    document.getElementById('intro-bootstrap-style')?.remove();
  }, []);
  useEffect(() => { if (!writeStorage(KEYS.events, events)) setToast('El almacenamiento del navegador está lleno. Los cambios se conservan durante esta sesión.'); }, [events]);
  useEffect(() => { if (!writeStorage(KEYS.registrations, registrations)) setToast('No pudimos guardar tu pase en el navegador. Se conserva durante esta sesión.'); }, [registrations]);
  useEffect(() => { writeStorage(KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { writeStorage(KEYS.subscribed, subscribed); }, [subscribed]);
  useEffect(() => { writeStorage(KEYS.session, sessionActive); }, [sessionActive]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 5200); return () => window.clearTimeout(timer); }, [toast]);
  const closeModal = useCallback(() => setSelectedEvent(null), []);
  const finishIntro = useCallback(() => setShowIntro(false), []);
  function navigate(next: AppView) { setStudioActive(false); setView(next); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function favorite(id: string) { setFavorites(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]); }
  function logout() { setSelectedEvent(null); setStudioActive(false); setToast(null); setView('explore'); setSessionActive(false); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function subscribe() { setSubscribed(v => !v); setToast(subscribed ? 'Desactivaste las novedades en esta demo.' : '¡Ya estás en órbita! Preferencia guardada en este navegador.'); }
  function register(event: EventItem, name: string, email: string, companions: number): Registration | null {
    const existing = registrations.find(r => r.eventId === event.id);
    if (existing) return existing;
    const current = events.find(e => e.id === event.id);
    if (!current || !canViewEvent(current) || current.status !== 'published' || new Date(current.endDate).getTime() < Date.now() || current.capacity - current.registered < 1 + companions || companions < 0 || companions > current.companions) return null;
    const registration: Registration = { id: `SN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, eventId: event.id, name, email, companions, createdAt: new Date().toISOString() };
    setRegistrations(previous => [...previous, registration]);
    setEvents(previous => previous.map(e => e.id === event.id ? { ...e, registered: e.registered + 1 + companions } : e));
    return registration;
  }
  function cancel(registration: Registration) {
    setRegistrations(previous => previous.filter(r => r.id !== registration.id));
    setEvents(previous => previous.map(e => e.id === registration.eventId ? { ...e, registered: Math.max(0, e.registered - 1 - registration.companions) } : e));
    setToast('Liberaste tu lugar. Te esperamos en una próxima experiencia.');
  }
  function create(event: EventItem) { setEvents(previous => [event, ...previous]); setToast(event.status === 'draft' ? 'Borrador guardado en este navegador.' : 'Evento publicado en esta demo. Los emails no se enviaron.'); }
  function update(event: EventItem) { setEvents(previous => previous.map(e => e.id === event.id ? { ...event, registered: e.registered } : e)); setToast('Cambios guardados en esta demo. Los emails no se enviaron.'); }
  const selectedLiveEvent = selectedEvent ? selectedEvent.status === 'draft' ? selectedEvent : events.find(e => e.id === selectedEvent.id) ?? selectedEvent : null;
  const immersiveStudio = view === 'admin' && studioActive;
  const visibleFavoriteCount = events.filter(event => favorites.includes(event.id) && event.status !== 'draft' && canViewEvent(event)).length;

  return <MotionConfig reducedMotion="user"><div className={`app-shell view-${view} ${sessionActive ? '' : 'signed-out'}`}><div className="ambient-stars" aria-hidden="true" /><a className="skip-link" href="#main-content">Ir al contenido</a>
    {sessionActive && !immersiveStudio && !selectedLiveEvent && <Header view={view} onNavigate={navigate} registrations={registrations} favoriteCount={visibleFavoriteCount} onLogout={logout} theme={theme} onThemeToggle={toggleTheme} />}
    <main id="main-content" className={immersiveStudio ? 'studio-main' : !sessionActive ? 'session-main' : ''} tabIndex={-1}>{sessionActive ? <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
      {view === 'explore' && <EventExplorer events={events} registrations={registrations} favorites={favorites} onFavorite={favorite} onOpen={setSelectedEvent} subscribed={subscribed} onSubscribe={subscribe} />}
      {view === 'registrations' && <MyEvents events={events} registrations={registrations} onOpen={setSelectedEvent} onExplore={() => navigate('explore')} />}
      {view === 'favorites' && <Favorites events={events} favorites={favorites} registrations={registrations} onFavorite={favorite} onOpen={setSelectedEvent} onExplore={() => navigate('explore')} />}
      {view === 'profile' && <Profile subscribed={subscribed} registrations={registrations.length} favorites={visibleFavoriteCount} onSubscribe={subscribe} onLogout={logout} />}
      {view === 'admin' && <div className={immersiveStudio ? 'studio-container' : 'section-container'}><Suspense fallback={<div className="page-loading"><span className="loading-star">✦</span><p>Preparando tu espacio de creación...</p></div>}><AdminPanel events={events} registrations={registrations} onCreate={create} onUpdate={update} onPreview={event => setSelectedEvent({ ...event, status: 'draft' })} notify={setToast} onWizardChange={setStudioActive} /></Suspense></div>}
    </motion.div></AnimatePresence> : <section className="session-closed"><Brand compact /><span className="session-orbit" aria-hidden="true">✦</span><span className="eyebrow">NOS VEMOS EN LA PRÓXIMA ÓRBITA</span><h1>Sesión cerrada.</h1><p>Tu próximo gran momento te va a estar esperando.</p><button className="button primary" onClick={() => setSessionActive(true)}>Volver a entrar <ArrowUpRight size={16} /></button><small>Acceso de demostración</small></section>}</main>
    {sessionActive && !immersiveStudio && !selectedLiveEvent && <footer className={`site-footer section-container ${view === 'admin' ? 'compact-footer' : ''}`}><div className="footer-main"><Brand compact />{view !== 'admin' && <span>Un universo de experiencias.<br />Una nueva forma de conectar.</span>}<button onClick={() => setShowIntro(true)}><Play size={11} fill="currentColor" /> Volver a vivir el inicio <ArrowUpRight size={12} /></button></div><div className="footer-bottom"><span>© 2026 Supernova · Telefónica</span><span>Experiencia de demostración · Datos guardados en este navegador</span><span>HECHO PARA CONECTAR <span>✦</span></span></div></footer>}
    <AnimatePresence>{selectedLiveEvent && <RegistrationModal key={selectedLiveEvent.id} event={selectedLiveEvent} registration={selectedLiveEvent.status === 'draft' ? undefined : registrations.find(r => r.eventId === selectedLiveEvent.id)} onClose={closeModal} onRegister={register} onCancel={cancel} />}</AnimatePresence>
    <AnimatePresence>{toast && <SupernovaToast message={toast} onDismiss={() => setToast(null)} />}</AnimatePresence>
  </div>{showIntro && <Suspense fallback={<IntroLoading onComplete={finishIntro} />}><CinematicIntro onComplete={finishIntro} /></Suspense>}</MotionConfig>;
}
