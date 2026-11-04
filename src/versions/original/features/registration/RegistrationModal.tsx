import { downloadTicket } from '../../../../features/qr/ticketDownload';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCheck, ChevronDown, Clock3, Download, MapPin, Minus, Plus, Share2, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import type { EventItem, Registration } from '../../../../types';
import { downloadCalendar, formatEventDate } from '../../../../lib/calendar';
import { eventImageProps, publicAssetUrl } from '../../../../lib/assets';
import NativeDialog from '../../../../components/ui/NativeDialog';
import SupernovaToast from '../../../../components/ui/SupernovaToast';
import PersonalTicket, { CommercialPassTicket } from '../../../../features/registration/PersonalTicket';
import EventMonthCalendar from '../../../../features/registration/EventMonthCalendar';
import BackButton from '../../../../components/ui/BackButton';
import { PassQR, eventDeepLink } from '../../../../features/qr';
import { eventForSession, getEventSessions, getRegistrationSession, sameRegistrationSession } from '../../../../lib/eventSessions';
import EventSessionPicker from '../../../../features/registration/EventSessionPicker';
import { getEventPhase } from '../../../../lib/events';
import '../../../../features/registration/registration.css';
import { useAccessProfile } from '../../../../features/access/access';
import './theme.css';
import '../../../commercial/commercial-registration.css';

interface Props {
  event: EventItem; registration?: Registration; registrations?: Registration[]; initialSessionId?: string; onClose: () => void;
  onRegister: (event: EventItem, name: string, email: string, companions: number, sessionId?: string) => Registration | null;
  onCancel: (registration: Registration) => void;
}
type Notice = { message: string; tone: 'error' | 'success' | 'info' };

const hour = (date: string) => formatEventDate(date, { hour: '2-digit', minute: '2-digit', hour12: false });
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Copies with the async Clipboard API and falls back to a selection inside the dialog. */
async function copyText(text: string, host: HTMLElement | null) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* try the selection fallback */ }
  }
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const field = document.createElement('textarea');
  field.value = text; field.readOnly = true; field.className = 'sr-only';
  (host ?? document.body).append(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  previous?.focus({ preventScroll: true });
  if (!copied) throw new Error('Copy unavailable');
}

/** A short confetti burst for a fresh confirmation. It never renders with reduced motion. */
function Celebration() {
  // Fans out above and to the left of the emblem, away from the heading.
  return <span className="cx-celebration" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => {
    const angle = -Math.PI * (.08 + 1.08 * i / 17);
    const distance = 52 + (i % 4) * 18;
    return <motion.i key={i} className={`cx-confetti cx-confetti-${i % 4}`}
      initial={{ opacity: 0, x: 0, y: 0, scale: .3, rotate: 0 }}
      animate={{ opacity: [0, 1, 1, 0], x: Math.cos(angle) * distance, y: Math.sin(angle) * distance + 18, scale: 1, rotate: (i % 2 ? 1 : -1) * 150 }}
      transition={{ duration: 1.25, delay: .12 + i * .012, ease: [.22, 1, .36, 1] }} />;
  })}</span>;
}

export default function RegistrationModal({ event, registration, registrations = [], initialSessionId, onClose, onRegister, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const commercial = document.documentElement.dataset.experience === 'commercial';
  const allPasses = registrations.length ? registrations : registration ? [registration] : [];
  const sessions = getEventSessions(event);
  const [selectedSessionId, setSelectedSessionId] = useState(() => initialSessionId || (registration && getRegistrationSession(event, registration)?.id) || sessions.find(session => new Date(session.endDate).getTime() > Date.now() && session.registered < session.capacity)?.id || sessions[0].id);
  const selectedSession = sessions.find(session => session.id === selectedSessionId) || sessions[0];
  const [newPass, setNewPass] = useState<Registration>();
  const [browsingFunctions, setBrowsingFunctions] = useState(false);
  const existingPass = allPasses.find(item => sameRegistrationSession(event, item, selectedSession.id)) || (newPass && sameRegistrationSession(event, newPass, selectedSession.id) ? newPass : undefined);
  const pass = browsingFunctions ? undefined : existingPass;
  const passSession = pass ? getRegistrationSession(event, pass) : undefined;
  const displayEvent = eventForSession(event, pass ? passSession : selectedSession);
  const access = useAccessProfile();
  const [name, setName] = useState(access.name);
  const [email, setEmail] = useState(access.email);
  const [companions, setCompanions] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const [noticeVersion, setNoticeVersion] = useState(0);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const available = selectedSession.capacity - selectedSession.registered;
  const closed = event.status !== 'published' || getEventPhase(displayEvent) === 'ended';
  const full = available <= 0;
  const maxCompanions = Math.min(event.companions, Math.max(0, available - 1));
  const celebrate = commercial && !reducedMotion && !!pass && pass.id === newPass?.id;
  useEffect(() => {
    if (pass) {
      ref.current?.scrollTo({ top: 0, behavior: 'instant' });
      ref.current?.querySelector<HTMLElement>('.modal-close')?.focus({ preventScroll: true });
    }
  }, [pass]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), 6500);
    return () => window.clearTimeout(timer);
  }, [notice, noticeVersion]);
  useEffect(() => {
    if (cancelConfirm) ref.current?.querySelector<HTMLButtonElement>('.cancel-confirm button')?.focus({ preventScroll: true });
  }, [cancelConfirm]);

  function notify(message: string, tone: Notice['tone'] = 'error') {
    setNotice({ message, tone });
    setNoticeVersion(version => version + 1);
  }
  const clearNotice = () => setNotice(undefined);

  function chooseSession(id: string) {
    const next = sessions.find(session => session.id === id)!;
    setSelectedSessionId(id); setBrowsingFunctions(true); setCancelConfirm(false); clearNotice();
    setCompanions(value => Math.min(value, event.companions, Math.max(0, next.capacity - next.registered - 1)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (closed || full) { notify('La inscripción a este evento no está disponible.'); return; }
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { notify('Completá tu nombre y un email válido.'); return; }
    if (event.terms && !accepted) { notify('Aceptá los términos del evento para continuar.'); return; }
    const result = onRegister(event, name.trim(), email.trim(), companions, selectedSession.id);
    if (result) { setNewPass(result); setBrowsingFunctions(false); clearNotice(); }
    else notify('No hay suficientes lugares disponibles. Probá sin acompañantes.');
  }
  async function downloadPass() {
    if (!pass) return;
    try { await downloadTicket(event, pass); }
    catch { notify('No pudimos descargar el pase. Volv' + String.fromCharCode(233) + ' a intentarlo.'); }
  }
  /** Shares the event (not the pass): the native sheet when there is one, otherwise the link is copied. */
  async function shareEvent() {
    if (!pass) return;
    const url = eventDeepLink(event.id, passSession?.id ?? pass.sessionId, 'commercial');
    const data = { title: event.title, text: `${event.title} · ${capitalize(formatEventDate(displayEvent.date, { weekday: 'long', day: 'numeric', month: 'long' }))}`, url };
    if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
      try { await navigator.share(data); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    try {
      await copyText(url, ref.current);
      notify('Copiamos el link del evento. Pegalo donde quieras.', 'success');
    } catch {
      notify('No pudimos copiar el link. Probá desde «Ver mi QR».');
    }
  }
  function addToCalendar() {
    if (pass) downloadCalendar(displayEvent, pass.sessionId || passSession?.id);
  }
  const askCancel = () => setCancelConfirm(true);
  const browseFunctions = () => { setBrowsingFunctions(true); setCancelConfirm(false); };

  const cancelDialog = <AnimatePresence>{cancelConfirm && pass && <motion.div className="cancel-confirm" role="alertdialog" aria-label="Cancelar inscripción" aria-describedby="cancel-confirmation-message" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }} transition={{ duration: reducedMotion ? 0 : .22 }}><span id="cancel-confirmation-message">¿Querés liberar tu lugar?</span><button onClick={() => { onCancel(pass); onClose(); }}>Sí, cancelar inscripción</button><button onClick={() => { setCancelConfirm(false); ref.current?.querySelector<HTMLButtonElement>('.cancel-registration')?.focus({ preventScroll: true }); }}>Conservar mi lugar</button></motion.div>}</AnimatePresence>;

  const companionField = event.companions > 0 && <div className="companion-field"><span><Users size={16} /> ¿Venís con alguien?<small>Hasta {event.companions} acompañante{event.companions > 1 ? 's' : ''}.</small></span><div><button type="button" aria-label="Quitar acompañante" disabled={companions === 0} onClick={() => setCompanions(c => c - 1)}><Minus size={15} /></button><motion.strong key={companions} aria-live="polite" initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>{companions}</motion.strong><button type="button" aria-label="Agregar acompañante" disabled={companions >= maxCompanions} onClick={() => setCompanions(c => c + 1)}><Plus size={15} /></button></div></div>;
  const termsField = event.terms && <div className="terms-field"><label><input type="checkbox" checked={accepted} onChange={e => { setAccepted(e.target.checked); clearNotice(); }} />Acepto los términos y condiciones del evento.</label><details><summary>Leer términos <ChevronDown size={13} /></summary><p>{event.terms}</p></details></div>;
  const identityFields = <div className="identity-fields"><label>Tu nombre<input value={name} onChange={e => { setName(e.target.value); clearNotice(); }} required autoComplete="name" maxLength={120} /></label><label>{access.kind === 'internal' ? 'Email corporativo' : 'Email'}<input type="email" value={email} onChange={e => { setEmail(e.target.value); clearNotice(); }} required autoComplete="email" maxLength={254} /></label></div>;
  const sessionPicker = (legend?: string, hint?: string | null) => <EventSessionPicker event={event} selectedId={selectedSession.id} registrations={allPasses} onChange={chooseSession} legend={legend} hint={hint} />;

  const slug = event.category.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const seats = `${companions + 1} ${companions ? 'lugares' : 'lugar'}`;

  const commercialPass = pass && <div className={`cx-pass category-${slug}`}>
    <header className="cx-pass-head">
      <span className="cx-pass-emblem"><motion.span initial={reducedMotion ? false : { scale: .6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: .45, duration: .6 }}><CheckCheck size={24} aria-hidden="true" /></motion.span>{celebrate && <Celebration />}</span>
      <div><h2 id="registration-title">Ya sos parte.</h2><p>Mostrá este QR al llegar.</p></div>
    </header>
    <CommercialPassTicket event={displayEvent} pass={pass} session={passSession} />
    <div className="cx-pass-actions">
      <button type="button" className="button primary cx-pass-calendar" aria-label="Agregar a mi calendario" onClick={addToCalendar}><CalendarDays size={18} aria-hidden="true" /><span className="cx-label-full">Agregar a mi calendario</span><span className="cx-label-short" aria-hidden="true">Calendario</span></button>
      <button type="button" className="button secondary" aria-label="Descargar pase" onClick={downloadPass}><Download size={18} aria-hidden="true" /><span className="cx-label-full">Descargar pase</span><span className="cx-label-short" aria-hidden="true">Descargar</span></button>
      <button type="button" className="button secondary" aria-label="Compartir evento" onClick={shareEvent}><Share2 size={18} aria-hidden="true" /><span className="cx-label-full">Compartir evento</span><span className="cx-label-short" aria-hidden="true">Compartir</span></button>
      <PassQR event={event} pass={pass} className="cx-pass-qr" />
    </div>
    <footer className="cx-pass-foot">
      <p className="demo-pass-note">Pase de demostración · guardado en este navegador.</p>
      <div className="pass-footer-links">{sessions.length > 1 && <button type="button" className="pass-function-switch" onClick={browseFunctions}>Elegir otra función</button>}<button type="button" className="cancel-registration" onClick={askCancel}>No voy a poder asistir</button></div>
    </footer>
    {cancelDialog}
  </div>;

  const commercialCheckout = <div className={`cx-checkout category-${slug}`}>
    <div className="cx-checkout-main">
      <section className="cx-event-banner">
        <div className="cx-event-copy">
          <span className="cx-event-eyebrow"><span aria-hidden="true">✦</span> {event.category.toUpperCase()} · {event.mode.toUpperCase()}</span>
          <h2 id="registration-title">{event.title}</h2>
          <p>{event.subtitle}</p>
          <ul className="cx-event-facts">
            <li><CalendarDays size={15} aria-hidden="true" />{capitalize(formatEventDate(displayEvent.date, { weekday: 'long', day: 'numeric', month: 'long' }))}</li>
            <li><Clock3 size={15} aria-hidden="true" />{hour(displayEvent.date)} – {hour(displayEvent.endDate)} h</li>
            <li><MapPin size={15} aria-hidden="true" />{event.location}</li>
          </ul>
        </div>
        <div className="cx-event-art" aria-hidden="true">
          <span className="cx-event-block" />
          <img {...eventImageProps(event.image, '(max-width: 700px) 100vw, 360px')} alt="" onError={image => { image.currentTarget.style.opacity = '0'; }} />
          <span className="cx-event-date"><strong>{formatEventDate(displayEvent.date, { day: '2-digit' })}</strong>{formatEventDate(displayEvent.date, { month: 'short' }).replace('.', '').toUpperCase()}</span>
        </div>
      </section>
      {sessionPicker(sessions.length > 1 ? 'Elegí tu función' : 'Tu función', null)}
      <details className="cx-event-about"><summary>Sobre la experiencia <ChevronDown size={16} aria-hidden="true" /></summary><div>{event.description.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}<p className="cx-event-host">Organiza {event.host}</p></div></details>
    </div>
    <aside className="cx-summary" aria-label="Tu inscripción">
      <div className="cx-summary-head"><h3>Tu entrada</h3><span className={`cx-places ${!full && available < 20 ? 'is-low' : ''} ${full ? 'is-full' : ''}`}><span className="live-dot" aria-hidden="true" />{full ? 'Cupos completos' : `${available} lugares disponibles`}</span></div>
      {existingPass ? <div className="cx-summary-note is-pass"><p>Ya tenés tu lugar en esta función.</p><button type="button" className="button primary cx-cta" onClick={() => setBrowsingFunctions(false)}>Ver mi pase <ArrowRight size={18} aria-hidden="true" /></button></div>
        : closed ? <p className="cx-summary-note"><Clock3 size={18} aria-hidden="true" />{event.status === 'draft' ? 'Vista previa de la experiencia.' : 'La inscripción para esta función está cerrada.'}</p>
        : full ? <p className="cx-summary-note"><Users size={18} aria-hidden="true" />Esta función está completa. Podés elegir otro horario.</p>
        : <form noValidate onSubmit={handleSubmit} className="cx-form">
          {identityFields}
          {companionField}
          {termsField}
          <dl className="cx-summary-lines">
            <div><dt>Función</dt><dd>{capitalize(formatEventDate(selectedSession.date, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, ''))} · {hour(selectedSession.date)} h</dd></div>
            <div><dt>Lugares</dt><dd>{seats}</dd></div>
          </dl>
          <div className="cx-checkout-bar">
            <p className="cx-total"><span>Total</span><strong>Sin costo</strong><small>{seats}</small></p>
            <button className="button primary cx-cta" type="submit">Confirmar mi lugar <ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </form>}
    </aside>
  </div>;

  return <NativeDialog labelledBy="registration-title" onClose={onClose} className={pass ? 'pass-dialog' : 'event-dialog'}>
    <motion.div ref={ref} className={`registration-modal ${pass ? 'registration-success' : ''} ${commercial ? 'cx-modal' : ''}`.replace(/\s+/g, ' ').trim()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .3 }}>
      <BackButton onBack={onClose} label="Volver" className="registration-back" />
      <button className="modal-close" aria-label="Cerrar inscripción" onClick={onClose}><X size={20} /></button>
      {commercial ? (pass ? commercialPass : commercialCheckout) : pass ? <div className="success-content">
        <div className="success-stars" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <motion.i key={i} initial={{ opacity: 0, x: 0, y: 0 }} animate={reducedMotion ? { opacity: 0 } : { opacity: [0, 1, 0], x: Math.cos(i * 2.4) * (110 + i * 9), y: Math.sin(i * 2.4) * (100 + i * 7) }} transition={{ duration: 1.8, delay: i * .025 }} />)}</div>
        <div className="pass-introduction"><motion.span className="success-emblem" initial={reducedMotion ? { scale: 1 } : { scale: .7 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: .3 }}><CheckCheck size={23} /></motion.span><div><span className="eyebrow">TU PRÓXIMO GRAN MOMENTO</span><h2 id="registration-title">Ya sos parte.</h2><p>Tu experiencia empieza acá.</p></div></div>
        <div className="pass-layout"><div className="pass-ticket-column"><PersonalTicket event={displayEvent} pass={pass} /></div><EventMonthCalendar event={displayEvent} /></div>
        <div className="pass-footer"><div className="success-actions"><button className="button primary" aria-label="Agregar a mi calendario" onClick={addToCalendar}><CalendarDays size={16} /><span className="pass-action-full">Agregar a mi calendario</span><span className="pass-action-short">Guardar fecha</span><ArrowUpRight size={16} /></button><button className="button secondary" onClick={downloadPass}><Download size={16} /> Descargar pase</button><PassQR event={event} pass={pass} /></div>
          <div className="pass-footer-meta"><p className="demo-pass-note">Pase de demostración. La inscripción se guarda en este navegador.</p><div className="pass-footer-links">{sessions.length > 1 && <button type="button" className="pass-function-switch" onClick={browseFunctions}>Elegir otra función</button>}<button className="cancel-registration" onClick={askCancel}>No voy a poder asistir</button></div></div>
        </div>
        {cancelDialog}
      </div> : <div className="registration-layout"><div className="registration-story">
        <div className="registration-art"><img src={publicAssetUrl(event.image)} alt="" /><span className="registration-art-shade" /><span className="registration-category">{event.category}</span><div><span className="eyebrow">TU PRÓXIMO GRAN MOMENTO</span><h2 id="registration-title">{event.title}</h2><p>{event.subtitle}</p></div><span className="registration-date"><strong>{formatEventDate(displayEvent.date, { day: '2-digit' })}</strong>{formatEventDate(displayEvent.date, { month: 'short' }).replace('.', '').toUpperCase()}</span></div>
        <div className="registration-content"><div className="registration-info"><div><CalendarDays size={18} /><span><small>CUÁNDO</small><strong>{formatEventDate(displayEvent.date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong><span>{hour(displayEvent.date)} — {hour(displayEvent.endDate)} h</span></span></div><div><MapPin size={18} /><span><small>DÓNDE</small><strong>{event.location}</strong><span>{event.mode} · Organiza {event.host}</span></span></div></div>
          <div className="about-event"><h3>Un poco de lo que te espera</h3>{event.description.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
        </div></div><aside className="registration-form-panel" aria-label="Tu inscripción"><div className="reservation-number" aria-hidden="true">01 / TU PRÓXIMA CONEXIÓN</div><div className="registration-form-heading"><span><Sparkles size={20} /><strong>Este momento<br />puede ser tuyo.</strong></span><span className={available < 20 ? 'low-capacity' : ''}><span className="live-dot" />{full ? 'Cupos completos' : `${available} lugares disponibles`}</span></div>
            {sessionPicker()}
            {existingPass ? <div className="existing-session-pass"><p>Ya tenés tu lugar en esta función.</p><button type="button" className="button primary" onClick={() => setBrowsingFunctions(false)}>Ver mi pase <ArrowRight size={16} /></button></div> : closed ? <p className="form-notice"><Clock3 size={17} />{event.status === 'draft' ? 'Vista previa de la experiencia.' : 'La inscripción para esta función está cerrada.'}</p> : full ? <p className="form-notice"><Users size={17} />Esta función está completa. Podés elegir otro horario.</p> : <form noValidate onSubmit={handleSubmit}>
              {identityFields}
              {companionField}
              {termsField}
              <div className="reservation-total"><span>Tu reserva</span><strong>{seats}<small> · Sin costo</small></strong></div><button className="button primary confirm-registration" type="submit">Confirmar mi lugar <ArrowRight size={18} /></button><span className="registration-secure"><ShieldCheck size={14} /> Tu pase personal, listo al confirmar.</span>
            </form>}
          </aside></div>}
    </motion.div>
    <AnimatePresence>{notice && <SupernovaToast key={noticeVersion} message={notice.message} tone={notice.tone} onDismiss={clearNotice} />}</AnimatePresence>
  </NativeDialog>;
}
