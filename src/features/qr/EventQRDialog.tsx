import { useId, useState } from 'react';
import type { EventItem } from '../../types';
import { formatEventDate } from '../../lib/calendar';
import { getEventSessions } from '../../lib/eventSessions';
import QRDialog from './QRDialog';
import { currentExperienceVersion, eventDeepLink, qrDownloadName } from './qr';

export interface EventQRDialogProps { event: EventItem; onClose: () => void }

export default function EventQRDialog({ event, onClose }: EventQRDialogProps) {
  const selectId = useId();
  const sessions = getEventSessions(event);
  const [chosenId, setChosenId] = useState(sessions[0]?.id);
  const session = sessions.find(item => item.id === chosenId) ?? sessions[0];
  // The link opens the event in the version that generated it, Comercial included.
  const version = currentExperienceVersion();
  const link = event.status === 'draft' ? undefined : eventDeepLink(event.id, session?.id, version);
  return <QRDialog title={`QR de ${event.title}`} subtitle={event.status === 'draft' ? 'Publicá la experiencia para compartirla.' : 'Compartí el evento y su función.'} payload={link} link={link} category={event.category}
    fileName={qrDownloadName('evento', `${event.id}-${session?.id ?? 'main'}`)} onClose={onClose}>
    {event.status === 'draft' ? <p className="qr-draft-note">Publicá el evento para compartir su QR.</p>
      : <div className="qr-session-select"><label htmlFor={selectId}>Función del QR</label><select id={selectId} value={session?.id} onChange={change => setChosenId(change.target.value)}>
        {sessions.map(item => <option key={item.id} value={item.id}>{item.name ? `${item.name} · ` : ''}{formatEventDate(item.date)} · {formatEventDate(item.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h</option>)}
      </select></div>}
  </QRDialog>;
}
