import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Copy, Download, QrCode, X } from 'lucide-react';
import NativeDialog from '../../components/ui/NativeDialog';
import { generateQrSVG, qrDataURL } from './qr';
import './qr.css';

interface Props {
  title: string;
  subtitle: string;
  payload?: string;
  fileName: string;
  onClose: () => void;
  children?: ReactNode;
  link?: string;
  code?: string;
}

export default function QRDialog({ title, subtitle, payload, fileName, onClose, children, link, code }: Props) {
  const titleId = useId();
  const portalRoot = useRef<HTMLDivElement>(null);
  const [generated, setGenerated] = useState<{ payload: string; svg?: string; failed?: boolean }>();
  const [copiedLink, setCopiedLink] = useState<string>();
  const [copyFailed, setCopyFailed] = useState(false);
  const svg = generated?.payload === payload ? generated?.svg : undefined;
  const failed = generated?.payload === payload && generated?.failed;
  useEffect(() => {
    if (!payload) return;
    let active = true;
    void generateQrSVG(payload).then(
      result => { if (active) setGenerated({ payload, svg: result }); },
      () => { if (active) setGenerated({ payload, failed: true }); },
    );
    return () => { active = false; };
  }, [payload]);
  useLayoutEffect(() => {
    const root = portalRoot.current;
    const cancel = (event: Event) => {
      event.preventDefault(); event.stopPropagation(); onClose();
    };
    root?.addEventListener('cancel', cancel, true);
    return () => root?.removeEventListener('cancel', cancel, true);
  }, [onClose]);

  async function copyLink() {
    if (!link) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(link);
      setCopiedLink(link); setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  }

  // Portal prevents pass-layout selectors from affecting the QR. Cancel events also
  // stop here so Escape closes this modal without closing the underlying pass.
  return createPortal(<div ref={portalRoot}>
    <NativeDialog className={`qr-dialog ${link ? 'event-qr-dialog' : 'pass-qr-dialog'}`} labelledBy={titleId} onClose={onClose}>
    <div className="qr-dialog-content">
      <header className="qr-dialog-header">
        <span className="qr-dialog-eyebrow"><QrCode size={13} aria-hidden="true" /> SUPERNOVA · QR</span>
        <button type="button" className="qr-dialog-close" onClick={onClose} aria-label="Cerrar QR"><X size={18} /></button>
        <h2 id={titleId}>{title}</h2><p>{subtitle}</p>
      </header>
      {children}
      {payload && <div className="qr-image-frame" aria-busy={!svg && !failed}>
        {svg ? <img className="qr-image" src={qrDataURL(svg)} alt={title} width={224} height={224} />
          : <p role="status">{failed ? 'No pudimos generar el QR. Podés usar el código o enlace de abajo.' : 'Generando QR…'}</p>}
      </div>}
      {code && <div className="qr-pass-code"><span>CÓDIGO DEL PASE</span><code>{code}</code></div>}
      {link && <div className="qr-link-field"><label htmlFor={`${titleId}-link`}>Enlace al evento</label>
        <input id={`${titleId}-link`} readOnly value={link} onFocus={event => event.currentTarget.select()} />
        <button type="button" onClick={copyLink} className="qr-copy-link">{copiedLink === link ? <Check size={14} /> : <Copy size={14} />}{copiedLink === link ? 'Enlace copiado' : 'Copiar enlace'}</button>
        <span className="qr-copy-feedback" role="status">{copyFailed ? 'Seleccioná el enlace y copialo con el teclado.' : copiedLink === link ? 'El enlace está en tu portapapeles.' : ''}</span>
      </div>}
      {(payload || code || link) && <p className="qr-demo-note">Demo local · {link ? 'Abre el evento. No valida ingresos. Requiere acceso a esta app.' : 'Identifica tu reserva. Sin validez para ingresos reales.'}</p>}
      <footer className="qr-dialog-actions">
        <button type="button" className="button secondary" onClick={onClose}><ArrowLeft size={15} />Volver</button>
        {svg && <a className="button primary" href={qrDataURL(svg)} download={fileName}><Download size={15} />Descargar QR</a>}
      </footer>
    </div>
    </NativeDialog>
  </div>, document.body);
}
