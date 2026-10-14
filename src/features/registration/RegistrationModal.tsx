import { downloadTicket } from '../qr/ticketDownload';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCheck, ChevronDown, Clock3, Download, MapPin, Minus, Plus, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import { downloadCalendar, formatEventDate } from '../../lib/calendar';
import { publicAssetUrl } from '../../lib/assets';
import NativeDialog from '../../components/ui/NativeDialog';
import SupernovaToast from '../../components/ui/SupernovaToast';
import PersonalTicket from './PersonalTicket';
import EventMonthCalendar from './EventMonthCalendar';
import BackButton from '../../components/ui/BackButton';
import { PassQR } from '../../features/qr';
import { eventForSession, getEventSessions, getRegistrationSession, sameRegistrationSession } from '../../lib/eventSessions';
import EventSessionPicker from '../../features/registration/EventSessionPicker';
import { DEMO_USER, getEventPhase } from '../../lib/events';
import './registration.css';
import './theme.css';

interface Props {
  event: EventItem; registration?: Registration; registrations?: Registration[]; initialSessionId?: string; onClose: () => void;
  onRegister: (event: EventItem, name: string, email: string, companions: number, sessionId?: string) => Registration | null;
  onCancel: (registration: Registration) => void;
}

export default function RegistrationModal({ event, registration, registrations = [], initialSessionId, onClose, onRegister, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const allPasses = registrations.length ? registrations : registration ? [registration] : [];
  const sessions = getEventSessions(event);
  const [selectedSessionId, setSelectedSessionId] = useState(() => initialSessionId || (registration && getRegistrationSession(event, registration)?.id) || sessions.find(session => new Date(session.endDate).getTime() > Date.now() && session.registered < session.capacity)?.id || sessions[0].id);
  const selectedSession = sessions.find(session => session.id === selectedSessionId) || sessions[0];
  const [newPass, setNewPass] = useState<Registration>();
  const [browsingFunctions, setBrowsingFunctions] = useState(false);
  const existingPass = allPasses.find(item => sameRegistrationSession(event, item, selectedSession.id)) || (newPass && sameRegistrationSession(event, newPass, selectedSession.id) ? newPass : undefined);
  const pass = browsingFunctions ? undefined : existingPass;
  const displayEvent = eventForSession(event, pass ? getRegistrationSession(event, pass) : selectedSession);
  const [name, setName] = useState(DEMO_USER.name);
  const [email, setEmail] = useState(DEMO_USER.email);
  const [companions, setCompanions] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [toastVersion, setToastVersion] = useState(0);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const available = selectedSession.capacity - selectedSession.registered;
  const closed = event.status !== 'published' || getEventPhase(displayEvent) === 'ended';
  const full = available <= 0;
  const maxCompanions = Math.min(event.companions, Math.max(0, available - 1));
  useEffect(() => {
    if (pass) {
      ref.current?.scrollTo({ top: 0, behavior: 'instant' });
      ref.current?.querySelector<HTMLElement>('.modal-close')?.focus({ preventScroll: true });
    }
  }, [pass]);
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(''), 6500);
    return () => window.clearTimeout(timer);
  }, [error, toastVersion]);
  useEffect(() => {
    if (cancelConfirm) ref.current?.querySelector<HTMLButtonElement>('.cancel-confirm button')?.focus({ preventScroll: true });
  }, [cancelConfirm]);

  function notifyError(message: string) {
    setError(message);
    setToastVersion(version => version + 1);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (closed || full) { notifyError('La inscripción a este evento no está disponible.'); return; }
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { notifyError('Completá tu nombre y un email válido.'); return; }
    if (event.terms && !accepted) { notifyError('Aceptá los términos del evento para continuar.'); return; }
    const result = onRegister(event, name.trim(), email.trim(), companions, selectedSession.id);
    if (result) { setNewPass(result); setBrowsingFunctions(false); setError(''); }
    else notifyError('No hay suficientes lugares disponibles. Probá sin acompañantes.');
  }
  async function downloadPass() {
    if (!pass) return;
    try { await downloadTicket(event, pass); }
    catch { notifyError('No pudimos descargar el pase. Volv' + String.fromCharCode(233) + ' a intentarlo.'); }
  }

  return <NativeDialog labelledBy="registration-title" onClose={onClose} className={pass ? 'pass-dialog' : 'event-dialog'}>
    <motion.div ref={ref} className={`registration-modal ${pass ? 'registration-success' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .3 }}>
      <BackButton onBack={onClose} label="Volver" className="registration-back" />
      <button className="modal-close" aria-label="Cerrar inscripción" onClick={onClose}><X size={20} /></button>
      {pass ? <div className="success-content">
        <div className="success-stars" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <motion.i key={i} initial={{ opacity: 0, x: 0, y: 0 }} animate={reducedMotion ? { opacity: 0 } : { opacity: [0, 1, 0], x: Math.cos(i * 2.4) * (110 + i * 9), y: Math.sin(i * 2.4) * (100 + i * 7) }} transition={{ duration: 1.8, delay: i * .025 }} />)}</div>
        <div className="pass-introduction"><motion.span className="success-emblem" initial={reducedMotion ? { scale: 1 } : { scale: .7 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: .3 }}><CheckCheck size={23} /></motion.span><div className="pass-introduction-copy"><span className="eyebrow">TU PRÓXIMO GRAN MOMENTO</span><h2 id="registration-title">Ya sos parte.</h2><p>Tu experiencia empieza acá.</p></div><div className="universe-pass-art" data-universe-surface="event" data-universe-composition="pass" aria-hidden="true" /></div>
        <div className="pass-layout"><div className="pass-ticket-column"><PersonalTicket event={displayEvent} pass={pass} /></div><EventMonthCalendar event={displayEvent} /></div>
        <div className="pass-footer"><div className="success-actions"><button className="button primary" aria-label="Agregar a mi calendario" onClick={() => downloadCalendar(displayEvent, pass?.sessionId || getRegistrationSession(event, pass!)?.id)}><CalendarDays size={16} /><span className="pass-action-full">Agregar a mi calendario</span><span className="pass-action-short">Guardar fecha</span><ArrowUpRight size={16} /></button><button className="button secondary" onClick={downloadPass}><Download size={16} /> Descargar pase</button><PassQR event={event} pass={pass} /></div>
          <div className="pass-footer-meta"><p className="demo-pass-note">Pase de demostración. La inscripción se guarda en este navegador.</p><div className="pass-footer-links">{sessions.length > 1 && <button type="button" className="pass-function-switch" onClick={() => { setBrowsingFunctions(true); setCancelConfirm(false); }}>Elegir otra función</button>}<button className="cancel-registration" onClick={() => setCancelConfirm(true)}>No voy a poder asistir</button></div></div>
        </div>
        <AnimatePresence>{cancelConfirm && <motion.div className="cancel-confirm" role="alertdialog" aria-label="Cancelar inscripción" aria-describedby="cancel-confirmation-message" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }} transition={{ duration: reducedMotion ? 0 : .22 }}><span id="cancel-confirmation-message">¿Querés liberar tu lugar?</span><button onClick={() => { onCancel(pass); onClose(); }}>Sí, cancelar inscripción</button><button onClick={() => { setCancelConfirm(false); ref.current?.querySelector<HTMLButtonElement>('.cancel-registration')?.focus({ preventScroll: true }); }}>Conservar mi lugar</button></motion.div>}</AnimatePresence>
      </div> : <><div className="universe-event-horizon" data-universe-surface="event" aria-hidden="true" /><div className="registration-layout"><div className="registration-story">
        <div className="registration-art"><img src={publicAssetUrl(event.image)} alt="" /><span className="registration-art-shade" /><span className="registration-category">{event.category}</span><div><span className="eyebrow">TU PRÓXIMO GRAN MOMENTO</span><h2 id="registration-title">{event.title}</h2><p>{event.subtitle}</p></div><span className="registration-date"><strong>{formatEventDate(displayEvent.date, { day: '2-digit' })}</strong>{formatEventDate(displayEvent.date, { month: 'short' }).replace('.', '').toUpperCase()}</span></div>
        <div className="registration-content"><div className="registration-info"><div><CalendarDays size={18} /><span><small>CUÁNDO</small><strong>{formatEventDate(displayEvent.date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong><span>{formatEventDate(displayEvent.date, { hour: '2-digit', minute: '2-digit', hour12: false })} — {formatEventDate(displayEvent.endDate, { hour: '2-digit', minute: '2-digit', hour12: false })} h</span></span></div><div><MapPin size={18} /><span><small>DÓNDE</small><strong>{event.location}</strong><span>{event.mode} · Organiza {event.host}</span></span></div></div>
          <div className="about-event"><h3>Un poco de lo que te espera</h3>{event.description.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
        </div></div><aside className="registration-form-panel" aria-label="Tu inscripción"><div className="reservation-number" aria-hidden="true">01 / TU PRÓXIMA CONEXIÓN</div><div className="registration-form-heading"><span><Sparkles size={20} /><strong>Este momento<br />puede ser tuyo.</strong></span><span className={available < 20 ? 'low-capacity' : ''}><span className="live-dot" />{full ? 'Cupos completos' : `${available} lugares disponibles`}</span></div>
            <EventSessionPicker event={event} selectedId={selectedSession.id} registrations={allPasses} onChange={id => {
              const next = sessions.find(session => session.id === id)!;
              setSelectedSessionId(id); setBrowsingFunctions(true); setCancelConfirm(false); setError('');
              setCompanions(value => Math.min(value, event.companions, Math.max(0, next.capacity - next.registered - 1)));
            }} />
            {existingPass ? <div className="existing-session-pass"><p>Ya tenés tu lugar en esta función.</p><button type="button" className="button primary" onClick={() => setBrowsingFunctions(false)}>Ver mi pase <ArrowRight size={16} /></button></div> : closed ? <p className="form-notice"><Clock3 size={17} />{event.status === 'draft' ? 'Vista previa de la experiencia.' : 'La inscripción para esta función está cerrada.'}</p> : full ? <p className="form-notice"><Users size={17} />Esta función está completa. Podés elegir otro horario.</p> : <form noValidate onSubmit={handleSubmit}>
              <div className="identity-fields"><label>Tu nombre<input value={name} onChange={e => { setName(e.target.value); setError(''); }} required autoComplete="name" maxLength={120} /></label><label>Email corporativo<input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required autoComplete="email" maxLength={254} /></label></div>
              {event.companions > 0 && <div className="companion-field"><span><Users size={16} /> ¿Venís con alguien?<small>Hasta {event.companions} acompañante{event.companions > 1 ? 's' : ''}.</small></span><div><button type="button" aria-label="Quitar acompañante" disabled={companions === 0} onClick={() => setCompanions(c => c - 1)}><Minus size={15} /></button><motion.strong key={companions} aria-live="polite" initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>{companions}</motion.strong><button type="button" aria-label="Agregar acompañante" disabled={companions >= maxCompanions} onClick={() => setCompanions(c => c + 1)}><Plus size={15} /></button></div></div>}
              {event.terms && <div className="terms-field"><label><input type="checkbox" checked={accepted} onChange={e => { setAccepted(e.target.checked); setError(''); }} />Acepto los términos y condiciones del evento.</label><details><summary>Leer términos <ChevronDown size={13} /></summary><p>{event.terms}</p></details></div>}
              <div className="reservation-total"><span>Tu reserva</span><strong>{companions + 1} {companions ? 'lugares' : 'lugar'}<small> · Sin costo</small></strong></div><button className="button primary confirm-registration" type="submit">Confirmar mi lugar <ArrowRight size={18} /></button><span className="registration-secure"><ShieldCheck size={14} /> Tu pase personal, listo al confirmar.</span>
            </form>}
          </aside></div></>}
    </motion.div>
    <AnimatePresence>{error && <SupernovaToast key={toastVersion} message={error} tone="error" onDismiss={() => setError('')} />}</AnimatePresence>
  </NativeDialog>;
}
