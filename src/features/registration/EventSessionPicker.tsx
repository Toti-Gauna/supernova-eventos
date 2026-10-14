import { Check, Clock3 } from 'lucide-react';
import type { EventItem, Registration } from '../../types';
import { formatEventDate } from '../../lib/calendar';
import { getEventSessions, sameRegistrationSession } from '../../lib/eventSessions';
import './session-picker.css';

interface Props { event: EventItem; selectedId: string; registrations: Registration[]; onChange: (id: string) => void }

export default function EventSessionPicker({ event, selectedId, registrations, onChange }: Props) {
  return <fieldset className="event-session-selector">
    <legend>Elegí una función</legend>
    <p>Una fecha, un horario y tu lugar.</p>
    <div className="event-session-options">{getEventSessions(event).map(session => {
      const reserved = registrations.some(pass => sameRegistrationSession(event, pass, session.id));
      const remaining = Math.max(0, session.capacity - session.registered);
      const ended = new Date(session.endDate).getTime() <= Date.now() || event.status === 'ended';
      return <label key={session.id} className={`event-session-option ${selectedId === session.id ? 'is-selected' : ''}`}>
        <input type="radio" name={`function-${event.id}`} value={session.id} checked={selectedId === session.id} onChange={() => onChange(session.id)}
          aria-label={`${session.name ? `${session.name} · ` : ''}${formatEventDate(session.date)} · ${formatEventDate(session.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h`} />
        <span className="session-date"><strong>{formatEventDate(session.date, { day: '2-digit' })}</strong><span>{formatEventDate(session.date, { month: 'short' }).replace('.', '')}</span></span>
        <span className="session-details">{session.name && <strong className="session-name">{session.name}</strong>}<span className="session-hours">{session.doorsDate && <span><small>Puertas</small><strong>{formatEventDate(session.doorsDate, { hour: '2-digit', minute: '2-digit', hour12: false })} h</strong></span>}<span><small>Inicio</small><strong>{formatEventDate(session.date, { hour: '2-digit', minute: '2-digit', hour12: false })} h</strong></span></span>
          <small className="session-availability">{reserved ? 'Ya tenés tu pase' : ended ? 'Finalizada' : !remaining ? 'Completa' : `${remaining} lugares · Sin costo`}</small></span>
        <span className="session-check" aria-hidden="true">{selectedId === session.id ? <Check size={15} /> : <Clock3 size={15} />}</span>
      </label>;
    })}</div>
  </fieldset>;
}
