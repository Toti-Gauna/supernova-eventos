import { useEffect, useId, useRef, useState } from 'react';
import { CheckCheck, QrCode, Upload, X } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import NativeDialog from '../../components/ui/NativeDialog';
import { getEventSessions } from '../../lib/eventSessions';
import { formatEventDate } from '../../lib/calendar';
import { readCheckIns, registerPassEntry, validatePass, type PassValidation } from './passCheckIn';
import { scanQrImage } from './scanQr';
import PassCameraScanner from './PassCameraScanner';
import './pass-check-in.css';

export default function PassCheckInDialog({ events, registrations, onClose }: { events: EventItem[]; registrations: Registration[]; onClose: () => void }) {
  const id = useId();
  const titleId = `${id}-title`;
  const availableEvents = events.filter(event => event.status !== 'draft');
  const [eventId, setEventId] = useState(availableEvents.find(event => event.status === 'published')?.id ?? availableEvents[0]?.id ?? '');
  const event = availableEvents.find(item => item.id === eventId);
  const sessions = event ? getEventSessions(event) : [];
  const [selectedSession, setSelectedSession] = useState('');
  const sessionId = sessions.some(session => session.id === selectedSession) ? selectedSession : sessions[0]?.id ?? '';
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PassValidation>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const focusResult = useRef(false);
  const imageRequest = useRef(0);
  const mounted = useRef(true);
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
    focusResult.current = true;
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
      inputRef.current?.focus({ preventScroll: true });
    } catch (failure) {
      if (mounted.current && request === imageRequest.current) setError(failure instanceof Error ? failure.message : 'No pudimos leer el QR.');
    } finally { if (mounted.current && request === imageRequest.current) setBusy(false); }
  }
  async function admit() {
    setBusy(true); setError('');
    try {
      const next = await registerPassEntry(input, eventId, sessionId, events, registrations);
      if (mounted.current) setResult(next);
    } catch { if (mounted.current) setError('No pudimos guardar el ingreso. Reintentá.'); }
    finally { if (mounted.current) setBusy(false); }
  }

  return <NativeDialog labelledBy={titleId} className="pass-check-dialog" onClose={onClose}>
    <div className="pass-check-content">
      <header><span><QrCode size={22} /><h2 id={titleId}>Registrar pase</h2></span><button type="button" aria-label="Cerrar registro de pase" onClick={onClose}><X size={20} /></button></header>
      <p>Validá el QR o el código del pase antes de registrar el ingreso.</p>
      <form onSubmit={submit => { submit.preventDefault(); validate(); }}>
        <div className="pass-check-selects">
          <label htmlFor={`${id}-event`}>Evento<select id={`${id}-event`} value={eventId} onChange={change => { setEventId(change.target.value); setSelectedSession(''); setResult(undefined); }} disabled={busy || cameraActive}><option value="" disabled>Elegí un evento</option>{availableEvents.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label htmlFor={`${id}-session`}>Función<select id={`${id}-session`} value={sessionId} onChange={change => { setSelectedSession(change.target.value); setResult(undefined); }} disabled={busy || cameraActive || !sessions.length}>{sessions.map(session => <option key={session.id} value={session.id}>{session.name ? `${session.name} · ` : ''}{formatEventDate(session.date)} · {formatEventDate(session.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h</option>)}</select></label>
        </div>
        <PassCameraScanner disabled={busy || !eventId || !sessionId} onRead={cameraRead} onActivityChange={cameraActivity} />
        <label className="pass-check-upload" htmlFor={`${id}-image`}><Upload size={18} /><span>{busy ? 'Leyendo el pase…' : 'Leer QR de una imagen'}</span><input id={`${id}-image`} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy || cameraActive} onChange={change => { void readImage(change.target.files?.[0]); change.target.value = ''; }} /></label>
        <label htmlFor={`${id}-code`}>QR o código del pase<textarea ref={inputRef} id={`${id}-code`} rows={3} maxLength={4096} placeholder="Pegá el contenido del QR o el código SN-…" value={input} disabled={busy || cameraActive} onChange={change => { setInput(change.target.value); setResult(undefined); setError(''); }} /></label>
        <button className="button primary" type="submit" disabled={busy || cameraActive || !eventId || !sessionId || !input.trim()}><QrCode size={17} />Validar pase</button>
      </form>
      {error && <p className="pass-check-error" role="alert">{error}</p>}
      {result && <section ref={resultRef} className={`pass-check-result pass-check-${result.kind}`} role="status" aria-live="polite">
        <h3 ref={resultHeading} tabIndex={-1}>{result.kind === 'invalid' ? 'Pase no válido' : result.message}</h3>
        {result.kind === 'invalid' ? <p>{result.message}</p> : <>
          <dl className="pass-check-details">
            <div><dt>Titular</dt><dd>{result.pass.name}</dd></div>
            <div><dt>Email</dt><dd>{result.pass.email}</dd></div>
            <div><dt>Evento</dt><dd>{result.event.title}</dd></div>
            <div><dt>Función</dt><dd>{result.session.name || 'Función única'}</dd></div>
            <div><dt>Fecha</dt><dd>{formatEventDate(result.session.date, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</dd></div>
            <div><dt>Horario</dt><dd>{formatEventDate(result.session.date, { hour:'2-digit', minute:'2-digit', hour12:false })} — {formatEventDate(result.session.endDate, { hour:'2-digit', minute:'2-digit', hour12:false })} h</dd></div>
            <div className="pass-check-detail-wide"><dt>Ubicación</dt><dd>{result.event.location} · {result.event.mode}</dd></div>
            <div><dt>Acompañantes</dt><dd>{result.pass.companions} acompañante{result.pass.companions !== 1 ? 's' : ''}</dd></div>
            <div><dt>Lugares</dt><dd>{1 + result.pass.companions} lugar{result.pass.companions ? 'es' : ''}</dd></div>
            <div className="pass-check-detail-wide"><dt>Código</dt><dd>{result.pass.id}</dd></div>
            <div><dt>Estado</dt><dd>{result.entry ? 'Ingreso registrado' : 'Confirmado · Ingreso pendiente'}</dd></div>
            <div><dt>Ingreso</dt><dd>{result.entry ? `${formatEventDate(result.entry.admittedAt)} · ${formatEventDate(result.entry.admittedAt, { hour:'2-digit', minute:'2-digit', hour12:false })} h` : 'Todavía no registrado'}</dd></div>
          </dl>
          {result.kind === 'valid' && <button type="button" className="button primary" disabled={busy || cameraActive} onClick={() => { void admit(); }}><CheckCheck size={18} />Registrar ingreso</button>}
        </>}
      </section>}
      <p className="pass-check-note">Demo local: los datos provienen de las reservas guardadas en este navegador. Leer el QR no registra el ingreso.</p>
    </div>
  </NativeDialog>;
}
