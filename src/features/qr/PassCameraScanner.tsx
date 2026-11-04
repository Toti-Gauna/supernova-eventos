import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ImageUp, Keyboard, RotateCcw, Square } from 'lucide-react';
import { loadQrDecoder } from './scanQr';

interface Props {
  disabled?: boolean;
  onRead: (value: string) => void;
  onActivityChange: (active: boolean) => void;
  /** Hidden behind another input method: the camera stops and stays closed. */
  paused?: boolean;
  /** Each increment opens the camera again (used by «Registrar otro»). */
  startRequest?: number;
  /** A result is on screen: the viewport shrinks to a slim bar. */
  compact?: boolean;
  /** Offers the other input methods when the camera is not available. */
  onAlternative?: (method: 'image' | 'code') => void;
}
type CameraState = 'idle' | 'requesting' | 'scanning' | 'error';
const FRAME_INTERVAL_MS = 220;
const MAX_FRAME_SIDE = 720;

// One short line each: the viewport shows them as an inline banner.
function cameraFailure(failure: unknown): string {
  const name = failure instanceof Error ? failure.name : '';
  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(name)) return 'No tenemos permiso de cámara.';
  if (['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(name)) return 'No encontramos una cámara.';
  if (['NotReadableError', 'TrackStartError'].includes(name)) return 'Otra app está usando la cámara.';
  return 'No pudimos iniciar la cámara.';
}

/** Owns only the camera lifetime; validation and admission stay in the dialog. */
export default function PassCameraScanner({ disabled = false, onRead, onActivityChange, paused = false, startRequest = 0, compact = false, onAlternative }: Props) {
  const [state, setState] = useState<CameraState>('idle');
  const [message, setMessage] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const stopButton = useRef<HTMLButtonElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const frame = useRef(0);
  const focusFrame = useRef(0);
  const request = useRef(0);
  const mounted = useRef(true);
  const callbacks = useRef({ onRead, onActivityChange });
  callbacks.current = { onRead, onActivityChange };
  const active = state === 'requesting' || state === 'scanning';
  const stateRef = useRef(state);
  stateRef.current = state;

  const release = useCallback(() => {
    request.current++;
    cancelAnimationFrame(frame.current);
    cancelAnimationFrame(focusFrame.current);
    frame.current = 0;
    focusFrame.current = 0;
    const current = stream.current;
    stream.current = null;
    current?.getTracks().forEach(track => track.stop());
    if (video.current) video.current.srcObject = null;
  }, []);

  function fail(message: string) {
    release();
    if (!mounted.current) return;
    setState('error');
    setMessage(message);
    callbacks.current.onActivityChange(false);
  }

  async function openCamera(focusStop = false) {
    release();
    setMessage('');
    if (!window.isSecureContext) {
      fail('La cámara necesita HTTPS.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      fail('El navegador no ofrece acceso a la cámara.');
      return;
    }
    const current = ++request.current;
    setState('requesting');
    callbacks.current.onActivityChange(true);
    if (focusStop) focusFrame.current = requestAnimationFrame(() => stopButton.current?.focus({ preventScroll: true }));
    try {
      const camera = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!mounted.current || current !== request.current || document.hidden) {
        camera.getTracks().forEach(track => track.stop());
        return;
      }
      if (!camera.getVideoTracks().length) {
        camera.getTracks().forEach(track => track.stop());
        fail('No encontramos una cámara.');
        return;
      }
      stream.current = camera;
      setState('scanning');
    } catch (failure) {
      if (mounted.current && current === request.current) fail(cameraFailure(failure));
    }
  }

  function stopCamera() {
    release();
    setState('idle');
    setMessage('Cámara detenida.');
    callbacks.current.onActivityChange(false);
    focusFrame.current = requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    mounted.current = true;
    const hidden = () => {
      if (!document.hidden || (stateRef.current !== 'requesting' && stateRef.current !== 'scanning')) return;
      release();
      setState('idle');
      setMessage('Se detuvo al salir de la pestaña.');
      callbacks.current.onActivityChange(false);
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      mounted.current = false;
      release();
      callbacks.current.onActivityChange(false);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [release]);

  // Another method took over: close the camera, keep an error visible for later.
  useEffect(() => {
    if (!paused || (stateRef.current !== 'requesting' && stateRef.current !== 'scanning')) return;
    release();
    setState('idle');
    setMessage('');
    callbacks.current.onActivityChange(false);
  }, [paused, release]);

  // «Registrar otro» from the camera: open it again right away.
  const lastStart = useRef(startRequest);
  const latest = useRef({ openCamera, paused, disabled });
  latest.current = { openCamera, paused, disabled };
  useEffect(() => {
    if (startRequest === lastStart.current) return;
    lastStart.current = startRequest;
    if (!latest.current.paused && !latest.current.disabled) void latest.current.openCamera(true);
  }, [startRequest]);

  useEffect(() => {
    if (state !== 'scanning' || !video.current || !stream.current) return;
    const element = video.current;
    const camera = stream.current;
    const current = request.current;
    let cancelled = false;
    const stale = () => cancelled || !mounted.current || current !== request.current;
    const lost = () => { if (!stale()) fail('La cámara dejó de transmitir.'); };
    camera.getVideoTracks().forEach(track => track.addEventListener('ended', lost));
    element.srcObject = camera;
    void (async () => {
      try {
        await element.play();
        const decode = await loadQrDecoder();
        if (stale()) return;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) { fail('No pudimos preparar el lector.'); return; }
        let lastRead = -Infinity;
        const read = (timestamp: number) => {
          if (stale() || document.hidden) return;
          frame.current = requestAnimationFrame(read);
          if (timestamp - lastRead < FRAME_INTERVAL_MS || element.readyState < 2 || !element.videoWidth || !element.videoHeight) return;
          lastRead = timestamp;
          const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(element.videoWidth, element.videoHeight));
          const width = Math.max(1, Math.round(element.videoWidth * scale));
          const height = Math.max(1, Math.round(element.videoHeight * scale));
          if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
          try {
            context.drawImage(element, 0, 0, width, height);
            const value = decode(context.getImageData(0, 0, width, height));
            if (!value) return;
            release();
            setState('idle');
            setMessage('QR leído. Revisá el pase.');
            callbacks.current.onActivityChange(false);
            callbacks.current.onRead(value);
          } catch { if (!stale()) fail('No pudimos leer el video de la cámara.'); }
        };
        frame.current = requestAnimationFrame(read);
      } catch (failure) { if (!stale()) fail(cameraFailure(failure)); }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      camera.getVideoTracks().forEach(track => track.removeEventListener('ended', lost));
      element.srcObject = null;
    };
  }, [state, release]);

  const status = message || (state === 'requesting' ? 'Aceptá el permiso de cámara para empezar.' : state === 'scanning' ? 'Apuntá al QR del pase' : 'Se activa solo cuando la abrís.');
  return <section className={`pass-camera ${compact ? 'is-compact' : ''}`} aria-label="Lector QR con cámara" data-camera-state={state}>
    <div className="pass-camera-view">
      {active && <video ref={video} muted playsInline autoPlay aria-label="Vista de la cámara para leer QR" />}
      <span className="pass-camera-frame" aria-hidden="true"><i /><i /><i /><i />{state === 'scanning' && <span className="pass-camera-scanline" />}</span>
      {!active && state !== 'error' && <span className="pass-camera-idle-icon icon-only" aria-hidden="true"><Camera size={28} /></span>}
      <div className="pass-camera-overlay">
        {state === 'error' && <span className="pass-camera-banner-icon icon-only" aria-hidden="true"><CameraOff size={18} /></span>}
        <p className="pass-camera-message" role={state === 'error' ? 'alert' : 'status'} aria-live="polite">{status}</p>
        {active
          ? <button ref={stopButton} type="button" className="pass-camera-stop" onClick={stopCamera}><Square size={14} aria-hidden="true" />Detener cámara</button>
          : <button ref={trigger} type="button" className={state === 'error' ? 'pass-camera-retry' : 'pass-camera-start'} disabled={disabled} aria-label={state === 'error' ? 'Reintentar cámara' : undefined} onClick={() => { void openCamera(); }}>{state === 'error' ? <><RotateCcw size={15} aria-hidden="true" />Reintentar</> : <><Camera size={18} aria-hidden="true" />Abrir cámara</>}</button>}
      </div>
      {state === 'error' && onAlternative && !compact && <div className="pass-camera-alternatives">
        <button type="button" onClick={() => onAlternative('image')}><ImageUp size={15} aria-hidden="true" />Usar una imagen</button>
        <button type="button" onClick={() => onAlternative('code')}><Keyboard size={15} aria-hidden="true" />Escribir el código</button>
      </div>}
    </div>
  </section>;
}
