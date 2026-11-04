import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Camera, CheckCheck, ChevronDown, CircleAlert, CircleCheck, ClipboardPaste, History, ImageUp, Keyboard, QrCode, RotateCcw, X } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import NativeDialog from '../../components/ui/NativeDialog';
import { getEventSessions } from '../../lib/eventSessions';
import { formatEventDate } from '../../lib/calendar';
import { readCheckIns, registerPassEntry, validatePass, type PassValidation } from './passCheckIn';
import { scanQrImage } from './scanQr';
import PassCameraScanner from './PassCameraScanner';
import './pass-check-in.css';

type Method = 'camera' | 'image' | 'code';
const methods = [
  { id: 'camera', label: 'Cámara', icon: Camera },
  { id: 'image', label: 'Imagen', icon: ImageUp },
  { id: 'code', label: 'Código', icon: Keyboard },
] as const;
const hour = (date: string) => `${formatEventDate(date, { hour: '2-digit', minute: '2-digit', hour12: false })} h`;
const sessionLabel = (date: string) => `${formatEventDate(date, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, '')} · ${formatEventDate(date, { hour: '2-digit', minute: '2-digit', hour12: false })}`;

/**
 * Entrance check-in. Full screen on phones (app bar, the camera as the hero, a sticky
 * action bar), a centred dialog on wider screens. Demo only: it validates against the
 * reservations stored in this browser, never against a server.
 */
export default function PassCheckInDialog({ events, registrations, onClose }: { events: EventItem[]; registrations: Registration[]; onClose: () => void }) {
  const id = useId();
  const titleId = `${id}-title`;
  const availableEvents = events.filter(event => event.status !== 'draft');
  const [eventId, setEventId] = useState(availableEvents.find(event => event.status === 'published')?.id ?? availableEvents[0]?.id ?? '');
  const event = availableEvents.find(item => item.id === eventId);
  const sessions = event ? getEventSessions(event) : [];
  const [selectedSession, setSelectedSession] = useState('');
  const sessionId = sessions.some(session => session.id === selectedSession) ? selectedSession : sessions[0]?.id ?? '';
  const [method, setMethod] = useState<Method>('camera');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PassValidation>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStart, setCameraStart] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const focusResult = useRef(false);
  const imageRequest = useRef(0);
  const mounted = useRef(true);
  const canPaste = typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.readText);
  useEffect(() => {
    mounted.current = true;
    const changed = () => setResult(undefined);
    window.addEventListener('storage', changed);
    return () => { mounted.current = false; imageRequest.current++; window.removeEventListener('storage', changed); };
  }, []);
  useEffect(() => { setResult(undefined); }, [events, registrations]);
  useEffect(() => {
    if (!result) return;
    const frame = requestAnimationFrame(() => {
      if (focusResult.current) { resultHeading.current?.focus({ preventScroll: true }); focusResult.current = false; }
      resultRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [result]);

  function validate(value = input) {
    setError('');
    focusResult.current = true;
    setResult(validatePass(value, eventId, sessionId, events, registrations, readCheckIns()));
  }
  function cameraActivity(active: boolean) {
    if (!mounted.current) return;
    setCameraActive(active);
    if (active) { setResult(undefined); setError(''); }
  }
  function cameraRead(value: string) {
    if (!mounted.current) return;
    imageRequest.current++;
    setInput(value);
    validate(value);
  }
  async function readImage(file?: File) {
    if (!file) return;
    const request = ++imageRequest.current;
    setError(''); setResult(undefined); setBusy(true);
    try {
      const value = await scanQrImage(file);
      if (!mounted.current || request !== imageRequest.current) return;
      setInput(value);
      validate(value);
    } catch (failure) {
      if (mounted.current && request === imageRequest.current) setError(failure instanceof Error ? failure.message : 'No pudimos leer el QR.');
    } finally { if (mounted.current && request === imageRequest.current) setBusy(false); }
  }
  async function admit() {
    setBusy(true); setError('');
    try {
      const next = await registerPassEntry(input, eventId, sessionId, events, registrations);
      if (mounted.current) { focusResult.current = true; setResult(next); }
    } catch { if (mounted.current) setError('No pudimos guardar el ingreso. Reintentá.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function paste() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) { setError('El portapapeles está vacío.'); return; }
      setInput(text); setResult(undefined); setError('');
      inputRef.current?.focus();
    } catch { setError('No pudimos leer el portapapeles. Pegá el código a mano.'); }
  }
  function chooseMethod(next: Method, focusTab = false) {
    setMethod(next);
    if (focusTab) window.requestAnimationFrame(() => document.getElementById(`${id}-tab-${next}`)?.focus());
  }
  function tabKeys(keyboard: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = methods.length - 1;
    const target = keyboard.key === 'ArrowRight' ? (index + 1) % methods.length : keyboard.key === 'ArrowLeft' ? (index + last) % methods.length : keyboard.key === 'Home' ? 0 : keyboard.key === 'End' ? last : -1;
    if (target < 0) return;
    keyboard.preventDefault();
    chooseMethod(methods[target].id, true);
  }
  /** «Registrar otro»: clear the result and go back to the method in use. */
  function next() {
    imageRequest.current++;
    setResult(undefined); setInput(''); setError('');
    if (method === 'camera') setCameraStart(value => value + 1);
    else window.requestAnimationFrame(() => (method === 'code' ? inputRef.current : imageRef.current)?.focus());
  }

  const tone = !result ? undefined : result.kind === 'invalid' ? 'error' : result.kind === 'valid' ? 'ok' : result.admitted ? 'done' : 'warn';
  const people = result && result.kind !== 'invalid' ? 1 + result.pass.companions : 0;
  const subtitle = !result ? '' : result.kind === 'invalid' ? 'Revisá el evento, la función o el código.'
    : result.kind === 'valid' ? `Confirmá el ingreso de ${people} ${people === 1 ? 'persona' : 'personas'}.`
      : result.admitted ? `Registrado a las ${hour(result.entry!.admittedAt)}.` : `Ingresó a las ${result.entry ? hour(result.entry.admittedAt) : '—'}. No lo registres de nuevo.`;
  const ToneIcon = tone === 'error' ? CircleAlert : tone === 'warn' ? History : CircleCheck;

  return <NativeDialog labelledBy={titleId} className="pass-check-dialog" onClose={onClose}>
    <div className="pass-check-content">
      <header className="pass-check-bar">
        <span className="pass-check-title"><span className="pass-check-icon icon-only" aria-hidden="true"><QrCode size={21} /></span><span><h2 id={titleId}>Registrar pase</h2><small>Validá el QR antes del ingreso.</small></span></span>
        <button type="button" className="pass-check-close icon-only" aria-label="Cerrar registro de pase" onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>
      <form className="pass-check-form" onSubmit={submit => { submit.preventDefault(); validate(); }}>
        <div className={`pass-check-body ${result ? 'has-result' : ''}`}>
          <div className="pass-check-selects">
            <label className="pass-check-pick" htmlFor={`${id}-event`}><span>Evento</span><select id={`${id}-event`} value={eventId} onChange={change => { setEventId(change.target.value); setSelectedSession(''); setResult(undefined); }} disabled={busy || cameraActive}><option value="" disabled>Elegí un evento</option>{availableEvents.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>
            <label className="pass-check-pick" htmlFor={`${id}-session`}><span>Función</span><select id={`${id}-session`} value={sessionId} onChange={change => { setSelectedSession(change.target.value); setResult(undefined); }} disabled={busy || cameraActive || !sessions.length}>{sessions.map(session => <option key={session.id} value={session.id}>{sessionLabel(session.date)}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>
          </div>
          <div className="pass-check-methods" role="tablist" aria-label="Cómo leer el pase">
            {methods.map(({ id: value, label, icon: Icon }, index) => <button key={value} id={`${id}-tab-${value}`} type="button" role="tab" aria-selected={method === value} aria-controls={`${id}-panel-${value}`} tabIndex={method === value ? 0 : -1} className={method === value ? 'is-active' : ''} onClick={() => chooseMethod(value)} onKeyDown={keyboard => tabKeys(keyboard, index)}><Icon size={17} aria-hidden="true" />{label}</button>)}
          </div>
          <div id={`${id}-panel-camera`} role="tabpanel" aria-labelledby={`${id}-tab-camera`} className="pass-check-panel is-camera" hidden={method !== 'camera'}>
            <PassCameraScanner disabled={busy || !eventId || !sessionId} paused={method !== 'camera'} startRequest={cameraStart} compact={Boolean(result)} onRead={cameraRead} onActivityChange={cameraActivity} onAlternative={alternative => chooseMethod(alternative, true)} />
          </div>
          <div id={`${id}-panel-image`} role="tabpanel" aria-labelledby={`${id}-tab-image`} className="pass-check-panel is-image" hidden={method !== 'image'}>
            <label className="pass-check-upload" htmlFor={`${id}-image`}><span className="pass-check-upload-icon icon-only" aria-hidden="true"><ImageUp size={22} /></span><strong>{busy ? 'Leyendo el pase…' : 'Leer QR de una imagen'}</strong><small>Captura o foto del pase · PNG, JPG, WebP o SVG</small><input ref={imageRef} id={`${id}-image`} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy || cameraActive} onChange={change => { void readImage(change.target.files?.[0]); change.target.value = ''; }} /></label>
          </div>
          <div id={`${id}-panel-code`} role="tabpanel" aria-labelledby={`${id}-tab-code`} className="pass-check-panel is-code" hidden={method !== 'code'}>
            <label className="pass-check-code-label" htmlFor={`${id}-code`}>QR o código del pase</label>
            <div className="pass-check-code">
              <input ref={inputRef} id={`${id}-code`} type="text" inputMode="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={4096} placeholder="SN-… o el contenido del QR" aria-describedby={`${id}-code-hint`} value={input} disabled={busy || cameraActive} onChange={change => { setInput(change.target.value); setResult(undefined); setError(''); }} />
              {canPaste && <button type="button" className="pass-check-paste" aria-label="Pegar código" title="Pegar código" disabled={busy || cameraActive} onClick={() => { void paste(); }}><ClipboardPaste size={17} aria-hidden="true" /><span>Pegar</span></button>}
            </div>
            <small id={`${id}-code-hint`}>Está debajo del QR, en el pase de la persona.</small>
          </div>
          {error && <p className="pass-check-error" role="alert"><CircleAlert size={16} aria-hidden="true" />{error}</p>}
          {result && <section ref={resultRef} className={`pass-check-result pass-check-${result.kind} is-${tone}`} role="status" aria-live="polite">
            <div className="pass-check-result-heading">
              <span className="pass-check-result-icon icon-only" aria-hidden="true"><ToneIcon size={22} /></span>
              <div><h3 ref={resultHeading} tabIndex={-1}>{result.kind === 'invalid' ? 'Pase no válido' : result.message}</h3><p>{result.kind === 'invalid' ? result.message : subtitle}</p></div>
            </div>
            {result.kind !== 'invalid' && <>
              <span className="pass-check-perforation" aria-hidden="true" />
              <dl className="pass-check-details">
                <div className="pass-check-detail-holder"><dt>Titular</dt><dd><strong>{result.pass.name}</strong><span>{result.pass.email}</span></dd></div>
                <div className="pass-check-detail-wide"><dt>Evento</dt><dd>{result.event.title}</dd></div>
                <div><dt>Función</dt><dd>{result.session.name || 'Función única'}</dd></div>
                <div><dt>Horario</dt><dd>{formatEventDate(result.session.date, { hour:'2-digit', minute:'2-digit', hour12:false })} — {formatEventDate(result.session.endDate, { hour:'2-digit', minute:'2-digit', hour12:false })} h</dd></div>
                <div className="pass-check-detail-wide"><dt>Fecha</dt><dd>{formatEventDate(result.session.date, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</dd></div>
                <div className="pass-check-detail-wide"><dt>Ubicación</dt><dd>{result.event.location} · {result.event.mode}</dd></div>
                <div><dt>Acompañantes</dt><dd>{result.pass.companions} acompañante{result.pass.companions !== 1 ? 's' : ''}</dd></div>
                <div><dt>Lugares</dt><dd>{people} lugar{people !== 1 ? 'es' : ''}</dd></div>
                <div className="pass-check-detail-wide"><dt>Código</dt><dd className="pass-check-code-value">{result.pass.id}</dd></div>
                <div><dt>Estado</dt><dd>{result.entry ? 'Ingreso registrado' : 'Confirmado · Ingreso pendiente'}</dd></div>
                <div><dt>Ingreso</dt><dd>{result.entry ? `${formatEventDate(result.entry.admittedAt)} · ${hour(result.entry.admittedAt)}` : 'Todavía no registrado'}</dd></div>
              </dl>
            </>}
            <button type="button" className="pass-check-next" onClick={next}><RotateCcw size={16} aria-hidden="true" />Registrar otro</button>
          </section>}
          <p className="pass-check-note">Demo local: valida contra las reservas de este navegador. Leer el QR no registra el ingreso.</p>
        </div>
        <footer className="pass-check-footer">
          {result?.kind === 'valid'
            ? <button type="button" className="button primary pass-check-cta is-admit" disabled={busy || cameraActive} onClick={() => { void admit(); }}><CheckCheck size={18} aria-hidden="true" />Registrar ingreso</button>
            : <button type="submit" className="button primary pass-check-cta" disabled={busy || cameraActive || !eventId || !sessionId || !input.trim()}><QrCode size={18} aria-hidden="true" />Validar pase</button>}
        </footer>
      </form>
    </div>
  </NativeDialog>;
}
