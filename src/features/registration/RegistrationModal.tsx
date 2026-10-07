import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCheck, ChevronDown, Clock3, Download, MapPin, Minus, Plus, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import { downloadCalendar, downloadFile, formatEventDate } from '../../lib/calendar';
import { publicAssetUrl } from '../../lib/assets';
import NativeDialog from '../../components/ui/NativeDialog';
import SupernovaToast from '../../components/ui/SupernovaToast';
import PersonalTicket from './PersonalTicket';
import EventMonthCalendar from './EventMonthCalendar';
import { DEMO_USER } from '../../lib/events';
import './registration.css';
import './theme.css';

interface Props {
  event: EventItem; registration?: Registration; onClose: () => void;
  onRegister: (event: EventItem, name: string, email: string, companions: number) => Registration | null;
  onCancel: (registration: Registration) => void;
}
const escapeXml = (text: string) => text.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));

export default function RegistrationModal({ event, registration, onClose, onRegister, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [pass, setPass] = useState(registration);
  const [name, setName] = useState(DEMO_USER.name);
  const [email, setEmail] = useState(DEMO_USER.email);
  const [companions, setCompanions] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [toastVersion, setToastVersion] = useState(0);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const available = event.capacity - event.registered;
  const closed = event.status !== 'published' || new Date(event.endDate).getTime() < Date.now();
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
    const result = onRegister(event, name.trim(), email.trim(), companions);
    if (result) { setPass(result); setError(''); }
    else notifyError('No hay suficientes lugares disponibles. Probá sin acompañantes.');
  }
  function downloadPass() {
    if (!pass) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540"><defs><radialGradient id="g"><stop stop-color="#6845b4"/><stop offset="1" stop-color="#161020"/></radialGradient></defs><rect width="900" height="540" rx="32" fill="url(#g)"/><circle cx="780" cy="90" r="190" fill="none" stroke="#c5a5ff" stroke-opacity=".2"/><circle cx="780" cy="90" r="135" fill="none" stroke="#c5a5ff" stroke-opacity=".2"/><g font-family="Arial,sans-serif" fill="#f7f5fb"><text x="56" y="77" font-size="28">supernova</text><text x="56" y="139" font-size="13" letter-spacing="4" fill="#c5a5ff">TU PRÓXIMO GRAN MOMENTO</text><text x="56" y="204" font-size="37">${escapeXml(event.title)}</text><text x="56" y="265" font-size="22">${escapeXml(formatEventDate(event.date))} · ${escapeXml(formatEventDate(event.date, { hour: '2-digit', minute: '2-digit', hour12: false }))} h</text><text x="56" y="307" font-size="18" fill="#cec5de">${escapeXml(event.location)}</text><path d="M56 352H844" stroke="#c5a5ff" stroke-dasharray="5 7" opacity=".4"/><text x="56" y="404" font-size="22">${escapeXml(pass.name)}</text><text x="56" y="440" font-size="15" fill="#cec5de">${pass.companions ? `+ ${pass.companions} acompañante` : 'Pase individual'} · ${escapeXml(pass.id)}</text><text x="56" y="500" font-size="12" fill="#a395bc">PASE DE DEMOSTRACIÓN · SIN VALIDEZ PARA ACCESO REAL</text></g></svg>`;
    downloadFile(svg, `supernova-pase-${event.id}.svg`, 'image/svg+xml');
  }

  return <NativeDialog labelledBy="registration-title" onClose={onClose} className={pass ? 'pass-dialog' : 'event-dialog'}>
    <motion.div ref={ref} className={`registration-modal ${pass ? 'registration-success' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .3 }}>
      <button className="modal-close" aria-label="Cerrar inscripción" onClick={onClose}><X size={20} /></button>
      {pass ? <div className="success-content">
        <div className="success-stars" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <motion.i key={i} initial={{ opacity: 0, x: 0, y: 0 }} animate={reducedMotion ? { opacity: 0 } : { opacity: [0, 1, 0], x: Math.cos(i * 2.4) * (110 + i * 9), y: Math.sin(i * 2.4) * (100 + i * 7) }} transition={{ duration: 1.8, delay: i * .025 }} />)}</div>
        <div className="pass-introduction"><motion.span className="success-emblem" initial={reducedMotion ? { scale: 1 } : { scale: .7 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: .3 }}><CheckCheck size={23} /></motion.span><div><span className="eyebrow">TU PRÓXIMO GRAN MOMENTO</span><h2 id="registration-title">Ya sos parte.</h2><p>Tu experiencia empieza acá.</p></div></div>
        <div className="pass-layout"><div className="pass-ticket-column"><PersonalTicket event={event} pass={pass} /></div><EventMonthCalendar event={event} /></div>
        <div className="pass-footer"><div className="success-actions"><button className="button primary" aria-label="Agregar a mi calendario" onClick={() => downloadCalendar(event)}><CalendarDays size={16} /><span className="pass-action-full">Agregar a mi calendario</span><span className="pass-action-short">Guardar fecha</span><ArrowUpRight size={16} /></button><button className="button secondary" onClick={downloadPass}><Download size={16} /> Descargar pase</button></div>
          <div className="pass-footer-meta"><p className="demo-pass-note">Pase de demostración. La inscripción se guarda en este navegador.</p><button className="cancel-registration" onClick={() => setCancelConfirm(true)}>No voy a poder asistir</button></div>
        </div>
        <AnimatePresence>{cancelConfirm && <motion.div className="cancel-confirm" role="alertdialog" aria-label="Cancelar inscripción" aria-describedby="cancel-confirmation-message" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }} transition={{ duration: reducedMotion ? 0 : .22 }}><span id="cancel-confirmation-message">¿Querés liberar tu lugar?</span><button onClick={() => { onCancel(pass); onClose(); }}>Sí, cancelar inscripción</button><button onClick={() => { setCancelConfirm(false); ref.current?.querySelector<HTMLButtonElement>('.cancel-registration')?.focus({ preventScroll: true }); }}>Conservar mi lugar</button></motion.div>}</AnimatePresence>
      </div> : <div className="registration-layout"><div className="registration-story">
        <div className="registration-art"><img src={publicAssetUrl(event.image)} alt="" /><span className="registration-art-shade" /><span className="registration-category">{event.category}</span><div><span className="eyebrow">TU PRÓXIMO GRAN MOMENTO</span><h2 id="registration-title">{event.title}</h2><p>{event.subtitle}</p></div><span className="registration-date"><strong>{formatEventDate(event.date, { day: '2-digit' })}</strong>{formatEventDate(event.date, { month: 'short' }).replace('.', '').toUpperCase()}</span></div>
        <div className="registration-content"><div className="registration-info"><div><CalendarDays size={18} /><span><small>CUÁNDO</small><strong>{formatEventDate(event.date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong><span>{formatEventDate(event.date, { hour: '2-digit', minute: '2-digit', hour12: false })} — {formatEventDate(event.endDate, { hour: '2-digit', minute: '2-digit', hour12: false })} h</span></span></div><div><MapPin size={18} /><span><small>DÓNDE</small><strong>{event.location}</strong><span>{event.mode} · Organiza {event.host}</span></span></div></div>
          <div className="about-event"><h3>Un poco de lo que te espera</h3>{event.description.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
        </div></div><aside className="registration-form-panel" aria-label="Tu inscripción"><div className="reservation-number" aria-hidden="true">01 / TU PRÓXIMA CONEXIÓN</div><div className="registration-form-heading"><span><Sparkles size={20} /><strong>Este momento<br />puede ser tuyo.</strong></span><span className={available < 20 ? 'low-capacity' : ''}><span className="live-dot" />{full ? 'Cupos completos' : `${available} lugares disponibles`}</span></div>
            {closed ? <p className="form-notice"><Clock3 size={17} />{event.status === 'draft' ? 'Vista previa de la experiencia.' : 'La inscripción para este evento está cerrada.'}</p> : full ? <p className="form-notice"><Users size={17} />Este evento llegó a su capacidad. Explorá otras experiencias.</p> : <form noValidate onSubmit={handleSubmit}>
              <div className="identity-fields"><label>Tu nombre<input value={name} onChange={e => { setName(e.target.value); setError(''); }} required autoComplete="name" maxLength={120} /></label><label>Email corporativo<input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required autoComplete="email" maxLength={254} /></label></div>
              {event.companions > 0 && <div className="companion-field"><span><Users size={16} /> ¿Venís con alguien?<small>Hasta {event.companions} acompañante{event.companions > 1 ? 's' : ''}.</small></span><div><button type="button" aria-label="Quitar acompañante" disabled={companions === 0} onClick={() => setCompanions(c => c - 1)}><Minus size={15} /></button><motion.strong key={companions} aria-live="polite" initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>{companions}</motion.strong><button type="button" aria-label="Agregar acompañante" disabled={companions >= maxCompanions} onClick={() => setCompanions(c => c + 1)}><Plus size={15} /></button></div></div>}
              {event.terms && <div className="terms-field"><label><input type="checkbox" checked={accepted} onChange={e => { setAccepted(e.target.checked); setError(''); }} />Acepto los términos y condiciones del evento.</label><details><summary>Leer términos <ChevronDown size={13} /></summary><p>{event.terms}</p></details></div>}
              <div className="reservation-total"><span>Tu reserva</span><strong>{companions + 1} {companions ? 'lugares' : 'lugar'}<small> · Sin costo</small></strong></div><button className="button primary confirm-registration" type="submit">Confirmar mi lugar <ArrowRight size={18} /></button><span className="registration-secure"><ShieldCheck size={14} /> Tu pase personal, listo al confirmar.</span>
            </form>}
          </aside></div>}
    </motion.div>
    <AnimatePresence>{error && <SupernovaToast key={toastVersion} message={error} tone="error" onDismiss={() => setError('')} />}</AnimatePresence>
  </NativeDialog>;
}
