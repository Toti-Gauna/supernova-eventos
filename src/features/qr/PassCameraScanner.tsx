import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Square } from 'lucide-react';
import { loadQrDecoder } from './scanQr';

interface Props {
  disabled?: boolean;
  onRead: (value: string) => void;
  onActivityChange: (active: boolean) => void;
}
type CameraState = 'idle' | 'requesting' | 'scanning' | 'error';
const FRAME_INTERVAL_MS = 220;
const MAX_FRAME_SIDE = 720;

function cameraFailure(failure: unknown): string {
  const name = failure instanceof Error ? failure.name : '';
  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(name)) return 'No tenemos permiso para usar la cámara. Habilitalo en tu navegador y reintentá, o usá una imagen o el código del pase.';
  if (['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(name)) return 'No encontramos una cámara disponible. Podés leer una imagen o pegar el código del pase.';
  if (['NotReadableError', 'TrackStartError'].includes(name)) return 'La cámara está ocupada o no puede abrirse. Cerrá la otra app que la esté usando y reintentá, o usá una imagen o el código.';
  return 'No pudimos iniciar la lectura con cámara. Reintentá o usá una imagen o el código del pase.';
}

/** Owns only the camera lifetime; validation and admission stay in the dialog. */
export default function PassCameraScanner({ disabled = false, onRead, onActivityChange }: Props) {
  const [state, setState] = useState<CameraState>('idle');
  const [message, setMessage] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const frame = useRef(0);
  const focusFrame = useRef(0);
  const request = useRef(0);
  const mounted = useRef(true);
  const callbacks = useRef({ onRead, onActivityChange });
  callbacks.current = { onRead, onActivityChange };
  const active = state === 'requesting' || state === 'scanning';

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

  async function openCamera() {
    release();
    setMessage('');
    if (!window.isSecureContext) {
      fail('Para usar la cámara desde el celular, abrí esta página con HTTPS. En localhost también funciona. Mientras tanto, podés usar una imagen o el código del pase.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      fail('Este navegador no ofrece acceso a la cámara. Podés usar una imagen o el código del pase.');
      return;
    }
    const current = ++request.current;
    setState('requesting');
    callbacks.current.onActivityChange(true);
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
        fail('No encontramos una cámara disponible. Podés leer una imagen o pegar el código del pase.');
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
      if (!document.hidden) return;
      release();
      setState('idle');
      setMessage('La lectura se detuvo al salir de la pestaña. Tocá Abrir cámara para retomarla.');
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

  useEffect(() => {
    if (state !== 'scanning' || !video.current || !stream.current) return;
    const element = video.current;
    const camera = stream.current;
    const current = request.current;
    let cancelled = false;
    const stale = () => cancelled || !mounted.current || current !== request.current;
    const lost = () => { if (!stale()) fail('La cámara dejó de transmitir. Abrila de nuevo o usá una imagen o el código del pase.'); };
    camera.getVideoTracks().forEach(track => track.addEventListener('ended', lost));
    element.srcObject = camera;
    void (async () => {
      try {
        await element.play();
        const decode = await loadQrDecoder();
        if (stale()) return;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) { fail('No pudimos preparar el lector de cámara. Usá una imagen o el código del pase.'); return; }
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
            setMessage('QR leído. Revisá los datos del pase antes de registrar el ingreso.');
            callbacks.current.onActivityChange(false);
            callbacks.current.onRead(value);
          } catch { if (!stale()) fail('No pudimos leer el video de la cámara. Reintentá o usá una imagen o el código del pase.'); }
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

  return <section className="pass-camera" aria-label="Lector QR con cámara" data-camera-state={state}>
    <div className="pass-camera-actions">
      <button ref={trigger} type="button" className="button secondary" disabled={disabled || active} onClick={() => { void openCamera(); }}><Camera size={18} />{state === 'error' ? 'Reintentar cámara' : state === 'requesting' ? 'Solicitando cámara…' : 'Abrir cámara'}</button>
      {active && <button type="button" className="button secondary" onClick={stopCamera}><Square size={15} />Detener cámara</button>}
    </div>
    {active && <div className="pass-camera-view"><video ref={video} muted playsInline autoPlay aria-label="Vista de la cámara para leer QR" /><span className="pass-camera-frame" aria-hidden="true" /></div>}
    <p className="pass-camera-message" role={state === 'error' ? 'alert' : 'status'} aria-live="polite">{message || (state === 'requesting' ? 'Aceptá el permiso de cámara para empezar.' : state === 'scanning' ? 'Apuntá al QR y mantenelo dentro del cuadro.' : 'La cámara se activa sólo cuando la abrís. También podés usar una imagen o pegar el código.')}</p>
  </section>;
}
