import { useRef } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import type { EventItem, EventSession } from '../../types';
import { getEventSessions, withEventSessions } from '../../lib/eventSessions';
import SupernovaDatePicker from '../../components/ui/SupernovaDatePicker';
import { fromLocalDateTime, toLocalDateTime } from './admin.helpers';
import './event-sessions.css';

interface EventSessionsEditorProps {
  event: EventItem;
  errors: Record<string, string>;
  onChange: (event: EventItem) => void;
}

export default function EventSessionsEditor({ event, errors, onChange }: EventSessionsEditorProps) {
  const section = useRef<HTMLElement>(null);
  const sessions = getEventSessions(event);

  function updateSession(session: EventSession, changes: Partial<EventSession>) {
    onChange(withEventSessions(event, sessions.map(item => item.id === session.id ? { ...item, ...changes } : item)));
  }

  function addSession() {
    const last = sessions.at(-1)!;
    const date = new Date(last.date);
    if (Number.isNaN(date.getTime())) { date.setTime(Date.now()); date.setHours(18, 0, 0, 0); }
    date.setDate(date.getDate() + 1);
    const duration = Math.max(60 * 60 * 1000, Date.parse(last.endDate) - Date.parse(last.date) || 2 * 60 * 60 * 1000);
    const session: EventSession = {
      id: crypto.randomUUID(), name: `Función ${sessions.length + 1}`, date: date.toISOString(),
      endDate: new Date(date.getTime() + duration).toISOString(),
      doorsDate: new Date(date.getTime() - 60 * 60 * 1000).toISOString(), capacity: last.capacity, registered: 0,
    };
    onChange(withEventSessions(event, [...sessions, session]));
    window.requestAnimationFrame(() => section.current?.querySelector<HTMLInputElement>(`[data-session-id="${session.id}"] input`)?.focus({ preventScroll: false }));
  }

  function removeSession(session: EventSession, index: number) {
    if (sessions.length <= 1 || session.registered > 0) return;
    onChange(withEventSessions(event, sessions.filter(item => item.id !== session.id)));
    window.requestAnimationFrame(() => section.current?.querySelector<HTMLInputElement>(`[data-session-index="${Math.max(0, index - 1)}"] input`)?.focus({ preventScroll: true }));
  }

  return <section className="event-sessions-editor" aria-labelledby="event-sessions-heading" ref={section}>
    <div className="event-sessions-editor-heading"><span><CalendarDays size={19} aria-hidden="true" /><strong id="event-sessions-heading">Funciones y horarios</strong></span><p>Cada función tiene su fecha y su cupo.</p></div>
    {errors.sessions && <small className="admin-field-error" role="alert">{errors.sessions}</small>}
    {sessions.map((session, index) => {
      const first = index === 0;
      const prefix = first ? '' : `session.${session.id}.`;
      const idPrefix = first ? 'event' : `event-session-${session.id}`;
      const occupied = session.registered > 0;
      const error = (key: string) => errors[`${prefix}${key}`];
      // Visible labels stay short; the pickers keep their full accessible names.
      const fields = [
        { key: 'date', id: `${idPrefix}-start`, short: 'Inicio', label: first ? 'Fecha y hora de inicio' : `Fecha y hora de inicio · función ${index + 1}`, value: session.date, required: true },
        { key: 'endDate', id: `${idPrefix}-end`, short: 'Fin', label: first ? 'Fecha y hora de fin' : `Fecha y hora de fin · función ${index + 1}`, value: session.endDate, required: true },
        { key: 'doorsDate', id: `${idPrefix}-doors`, short: 'Apertura de puertas', label: `Apertura de puertas · función ${index + 1}`, value: session.doorsDate || '', required: false },
      ] as const;
      const capacityHelper = `${idPrefix}-capacity-${error('capacity') ? 'error' : 'helper'}`;
      return <fieldset className="event-session-fields" key={session.id} data-session-id={session.id} data-session-index={index}>
        <legend>Función {index + 1}</legend>
        <div className="event-session-title-row">
          <div className="admin-form-field event-session-name"><label htmlFor={`${idPrefix}-session-name`}>Nombre<span className="sr-only"> de la función {index + 1}</span></label><input id={`${idPrefix}-session-name`} placeholder={`Función ${index + 1}`} maxLength={80} value={session.name || ''} onChange={change => updateSession(session, { name: change.target.value })} aria-invalid={!!error('name')} /></div>
          <div className="admin-form-field event-session-capacity"><label htmlFor={`${idPrefix}-capacity`}>{first ? 'Cupo total' : `Cupo`}{!first && <span className="sr-only"> · función {index + 1}</span>} <span>*</span></label><input id={`${idPrefix}-capacity`} type="number" min={Math.max(1, session.registered)} max={100000} value={session.capacity} onChange={change => updateSession(session, { capacity: Number(change.target.value) })} aria-invalid={!!error('capacity')} aria-describedby={error('capacity') || occupied ? capacityHelper : undefined} />{error('capacity') ? <small id={`${idPrefix}-capacity-error`} className="admin-field-error" role="alert">{error('capacity')}</small> : occupied && <small id={`${idPrefix}-capacity-helper`}>{session.registered} lugares ocupados.</small>}</div>
          {sessions.length > 1 && <button type="button" className="event-session-remove icon-only" disabled={occupied} title={occupied ? 'Esta función ya tiene inscriptos.' : 'Quitar esta función'} aria-label={`Quitar función ${index + 1}`} onClick={() => removeSession(session, index)}><Trash2 size={17} aria-hidden="true" /></button>}
        </div>
        <div className="event-session-dates">{fields.map(field => <div className="admin-form-field" key={field.key}><label htmlFor={field.id}>{field.short}{field.required && <> <span>*</span></>}</label><SupernovaDatePicker id={field.id} label={field.label} mode="datetime" required={field.required} value={toLocalDateTime(field.value)} disabled={occupied} onChange={value => updateSession(session, field.key === 'doorsDate' ? { doorsDate: fromLocalDateTime(value) || undefined } : { [field.key]: fromLocalDateTime(value) })} aria-invalid={!!error(field.key)} aria-describedby={error(field.key) ? `${field.id}-error` : field.key === 'doorsDate' ? `${field.id}-helper` : undefined} />{error(field.key) ? <small id={`${field.id}-error`} className="admin-field-error" role="alert">{error(field.key)}</small> : field.key === 'doorsDate' && <small id={`${field.id}-helper`}>Opcional.</small>}</div>)}</div>
        {occupied && <p className="event-session-locked-note">Esta función tiene inscriptos: conservamos sus horarios y podés ampliar el cupo.</p>}
      </fieldset>;
    })}
    <div className="event-session-footer"><button type="button" className="admin-outline-button event-session-add" onClick={addSession} disabled={sessions.length >= 24}><Plus size={16} aria-hidden="true" /> Agregar función</button>{sessions.length > 1 && <p className="event-session-total">{sessions.length} funciones · {event.capacity.toLocaleString('es-AR')} lugares en total</p>}</div>
  </section>;
}
