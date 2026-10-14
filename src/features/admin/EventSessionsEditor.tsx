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
    <div className="event-sessions-editor-heading"><span><CalendarDays size={19} /><strong id="event-sessions-heading">Funciones y horarios</strong></span><p>Una experiencia puede tener varias fechas. Cada función tiene su propio cupo.</p></div>
    {errors.sessions && <small className="admin-field-error" role="alert">{errors.sessions}</small>}
    {sessions.map((session, index) => {
      const first = index === 0;
      const prefix = first ? '' : `session.${session.id}.`;
      const idPrefix = first ? 'event' : `event-session-${session.id}`;
      const occupied = session.registered > 0;
      const fields = [
        { key: 'date', id: `${idPrefix}-start`, label: first ? 'Fecha y hora de inicio' : `Fecha y hora de inicio · función ${index + 1}`, value: session.date, required: true },
        { key: 'endDate', id: `${idPrefix}-end`, label: first ? 'Fecha y hora de fin' : `Fecha y hora de fin · función ${index + 1}`, value: session.endDate, required: true },
        { key: 'doorsDate', id: `${idPrefix}-doors`, label: `Apertura de puertas · función ${index + 1}`, value: session.doorsDate || '', required: false },
      ] as const;
      return <fieldset className="event-session-fields" key={session.id} data-session-id={session.id} data-session-index={index}>
        <legend>Función {index + 1}</legend>
        <div className="event-session-title-row"><div className="admin-form-field"><label htmlFor={`${idPrefix}-session-name`}>Nombre de la función {index + 1}</label><input id={`${idPrefix}-session-name`} placeholder={`Función ${index + 1}`} maxLength={80} value={session.name || ''} onChange={change => updateSession(session, { name: change.target.value })} aria-invalid={!!errors[`${prefix}name`]} /></div>{sessions.length > 1 && <button type="button" className="admin-back-button event-session-remove" disabled={occupied} title={occupied ? 'Esta función ya tiene inscriptos.' : 'Quitar esta función'} aria-label={`Quitar función ${index + 1}`} onClick={() => removeSession(session, index)}><Trash2 size={16} /><span>Quitar</span></button>}</div>
        <div className="admin-form-grid">{fields.slice(0, 2).map(field => <div className="admin-form-field" key={field.key}><label htmlFor={field.id}>{field.label} <span>*</span></label><SupernovaDatePicker id={field.id} label={field.label} mode="datetime" required value={toLocalDateTime(field.value)} disabled={occupied} onChange={value => updateSession(session, { [field.key]: fromLocalDateTime(value) })} aria-invalid={!!errors[`${prefix}${field.key}`]} aria-describedby={errors[`${prefix}${field.key}`] ? `${field.id}-error` : undefined} />{errors[`${prefix}${field.key}`] && <small id={`${field.id}-error`} className="admin-field-error" role="alert">{errors[`${prefix}${field.key}`]}</small>}</div>)}</div>
        <div className="admin-form-grid"><div className="admin-form-field"><label htmlFor={fields[2].id}>{fields[2].label}</label><SupernovaDatePicker id={fields[2].id} label={fields[2].label} mode="datetime" value={toLocalDateTime(session.doorsDate || '')} disabled={occupied} onChange={value => updateSession(session, { doorsDate: fromLocalDateTime(value) || undefined })} aria-invalid={!!errors[`${prefix}doorsDate`]} aria-describedby={errors[`${prefix}doorsDate`] ? `${fields[2].id}-error` : `${fields[2].id}-helper`} />{errors[`${prefix}doorsDate`] ? <small id={`${fields[2].id}-error`} className="admin-field-error" role="alert">{errors[`${prefix}doorsDate`]}</small> : <small id={`${fields[2].id}-helper`}>Opcional, antes del inicio del show.</small>}</div><div className="admin-form-field"><label htmlFor={`${idPrefix}-capacity`}>{first ? 'Cupo total' : `Cupo · función ${index + 1}`} <span>*</span></label><input id={`${idPrefix}-capacity`} type="number" min={Math.max(1, session.registered)} max={100000} value={session.capacity} onChange={change => updateSession(session, { capacity: Number(change.target.value) })} aria-invalid={!!errors[`${prefix}capacity`]} aria-describedby={`${idPrefix}-capacity-${errors[`${prefix}capacity`] ? 'error' : 'helper'}`} />{errors[`${prefix}capacity`] ? <small id={`${idPrefix}-capacity-error`} className="admin-field-error" role="alert">{errors[`${prefix}capacity`]}</small> : <small id={`${idPrefix}-capacity-helper`}>{session.registered ? `${session.registered} lugares ocupados en esta función.` : 'Lugares disponibles para esta función.'}</small>}</div></div>
        {occupied && <p className="event-session-locked-note">Esta función tiene inscriptos: conservamos sus horarios y podés ampliar el cupo.</p>}
      </fieldset>;
    })}
    <button type="button" className="admin-outline-button event-session-add" onClick={addSession} disabled={sessions.length >= 24}><Plus size={16} /> Agregar función</button>
    {sessions.length > 1 && <p className="event-session-total">{sessions.length} funciones · {event.capacity.toLocaleString('es-AR')} lugares en total</p>}
  </section>;
}
