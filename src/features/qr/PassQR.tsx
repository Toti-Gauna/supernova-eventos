import { useState } from 'react';
import { QrCode } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import { formatEventDate } from '../../lib/calendar';
import { getRegistrationSession } from '../../lib/eventSessions';
import QRDialog from './QRDialog';
import { passPayload, qrDownloadName } from './qr';

export interface PassQRProps { event: EventItem; pass: Registration; className?: string }

export default function PassQR({ event, pass, className = '' }: PassQRProps) {
  const [open, setOpen] = useState(false);
  const session = getRegistrationSession(event, pass);
  const date = session?.date ?? event.date;
  return <>
    <button type="button" className={`button secondary pass-qr-button ${className}`} onClick={() => setOpen(true)}><QrCode size={16} />Ver mi QR</button>
    {open && <QRDialog title="Mi QR de acceso" subtitle={event.title} payload={passPayload(event, pass)} code={pass.id}
      fileName={qrDownloadName('pase', pass.id)} onClose={() => setOpen(false)}>
      <p className="qr-session-summary">{formatEventDate(date)} · {formatEventDate(date, { hour: '2-digit', minute: '2-digit', hour12: false })} h{session?.name && <span>{session.name}</span>}</p>
    </QRDialog>}
  </>;
}
