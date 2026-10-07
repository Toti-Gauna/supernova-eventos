import { useEffect, useId, useRef, useState } from 'react';
import type { AriaAttributes, KeyboardEvent } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import './controls.css';

export interface SupernovaDatePickerProps extends Pick<AriaAttributes, 'aria-invalid' | 'aria-describedby'> {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  mode?: 'date' | 'datetime';
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');
const dayValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const validDay = (value: string) => {
  const result = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!result) return null;
  const date = new Date(Number(result[1]), Number(result[2]) - 1, Number(result[3]), 12);
  return dayValue(date) === value ? date : null;
};
function parseText(value: string, mode: 'date' | 'datetime'): string | null {
  if (!value.trim()) return '';
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?$/.exec(value.trim());
  const local = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})(?:[, ]+(\d{1,2}):(\d{2}))?$/.exec(value.trim());
  if (!parts && !local) return null;
  const date = parts ? `${parts[1]}-${parts[2]}-${parts[3]}` : `${local![3]}-${pad(Number(local![2]))}-${pad(Number(local![1]))}`;
  if (!validDay(date)) return null;
  if (mode === 'date') return date;
  const hour = Number((parts || local)![4] || 0), minute = Number((parts || local)![5] || 0);
  return hour < 24 && minute < 60 ? `${date}T${pad(hour)}:${pad(minute)}` : null;
}
function displayValue(value: string, mode: 'date' | 'datetime') {
  const date = validDay(value.slice(0, 10));
  if (!date) return value;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}${mode === 'datetime' ? ` · ${value.slice(11, 16) || '00:00'}` : ''}`;
}

export default function SupernovaDatePicker({ id, label = 'Fecha', value, onChange, mode = 'date', className = '', disabled, required, ...aria }: SupernovaDatePickerProps) {
  const generatedId = useId();
  const controlId = id || `supernova-date-${generatedId}`;
  const calendarId = `${controlId}-calendar`;
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(displayValue(value, mode));
  const [invalidText, setInvalidText] = useState(false);
  const [open, setOpen] = useState(false);
  const initialDay = validDay(value.slice(0, 10)) || new Date();
  const [month, setMonth] = useState(() => new Date(initialDay.getFullYear(), initialDay.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(dayValue(initialDay));
  const [focusDay, setFocusDay] = useState(dayValue(initialDay));
  const [hour, setHour] = useState(value.slice(11, 13) || '18');
  const [minute, setMinute] = useState(value.slice(14, 16) || '00');

  useEffect(() => { if (document.activeElement !== input.current) setText(displayValue(value, mode)); }, [value, mode]);
  function positionCalendar() {
    const rect = container.current?.getBoundingClientRect();
    if (!rect || !popover.current) return;
    const width = Math.min(326, window.innerWidth - 24);
    const measuredHeight = popover.current.matches(':popover-open') ? popover.current.getBoundingClientRect().height : 0;
    const height = Math.min(measuredHeight || (mode === 'datetime' ? 455 : 365), window.innerHeight - 24);
    const below = window.innerHeight - rect.bottom - 12;
    const above = below < height && rect.top > below;
    popover.current.style.width = `${width}px`;
    popover.current.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    popover.current.style.top = above ? 'auto' : `${Math.max(12, Math.min(rect.bottom + 7, window.innerHeight - height - 12))}px`;
    popover.current.style.bottom = above ? `${Math.max(12, Math.min(window.innerHeight - rect.top + 7, window.innerHeight - height - 12))}px` : 'auto';
    popover.current.style.maxHeight = `${window.innerHeight - 24}px`;
  }
  function close(restoreFocus = true) { popover.current?.hidePopover(); setOpen(false); if (restoreFocus) trigger.current?.focus({ preventScroll: true }); }
  function show() {
    if (disabled) return;
    const date = validDay(value.slice(0, 10)) || new Date();
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDay(value.slice(0, 10) || dayValue(date));
    setFocusDay(dayValue(date));
    setHour(value.slice(11, 13) || '18');
    setMinute(value.slice(14, 16) || '00');
    positionCalendar(); popover.current?.showPopover(); setOpen(true);
    popover.current?.querySelector<HTMLElement>(`[data-day="${dayValue(date)}"]`)?.focus({ preventScroll: true });
    window.requestAnimationFrame(() => { positionCalendar(); if (!popover.current?.contains(document.activeElement)) popover.current?.querySelector<HTMLElement>(`[data-day="${dayValue(date)}"]`)?.focus({ preventScroll: true }); });
  }
  useEffect(() => {
    if (!open) return;
    const update = () => positionCalendar();
    window.addEventListener('resize', update); window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open, mode]);

  function commit(day = selectedDay) {
    const next = mode === 'date' ? day : `${day}T${pad(Math.max(0, Math.min(23, Number(hour) || 0)))}:${pad(Math.max(0, Math.min(59, Number(minute) || 0)))}`;
    onChange(next); setText(displayValue(next, mode)); setInvalidText(false); close();
  }
  function selectDay(day: string) { setSelectedDay(day); setFocusDay(day); if (mode === 'date') commit(day); }
  function changeMonth(amount: number) { const next = new Date(month.getFullYear(), month.getMonth() + amount, 1); setMonth(next); setFocusDay(dayValue(next)); }
  function moveDay(event: KeyboardEvent<HTMLButtonElement>, day: Date) {
    const amounts: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const next = new Date(day);
    if (event.key in amounts) next.setDate(next.getDate() + amounts[event.key]);
    else if (event.key === 'Home') next.setDate(next.getDate() - ((next.getDay() + 6) % 7));
    else if (event.key === 'End') next.setDate(next.getDate() + 6 - ((next.getDay() + 6) % 7));
    else if (event.key === 'PageUp' || event.key === 'PageDown') next.setMonth(next.getMonth() + (event.key === 'PageUp' ? -1 : 1));
    else return;
    event.preventDefault(); setFocusDay(dayValue(next)); setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    window.requestAnimationFrame(() => popover.current?.querySelector<HTMLElement>(`[data-day="${dayValue(next)}"]`)?.focus({ preventScroll: true }));
  }

  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const rows = Math.ceil((days + offset) / 7);
  const today = dayValue(new Date());
  const monthLabel = month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return <div ref={container} className={`supernova-date ${className}`}>
    <div className="supernova-date-field"><input ref={input} id={controlId} type="text" inputMode="text" autoComplete="off" className="supernova-control" aria-label={label} aria-invalid={invalidText || aria['aria-invalid']} aria-describedby={aria['aria-describedby']} required={required} disabled={disabled} value={text} placeholder={mode === 'date' ? 'dd/mm/aaaa' : 'dd/mm/aaaa · hh:mm'} onChange={event => { const next = event.target.value; setText(next); const parsed = parseText(next.replace(' · ', ' '), mode); setInvalidText(false); onChange(parsed ?? ''); }} onBlur={() => { const parsed = parseText(text.replace(' · ', ' '), mode); setInvalidText(parsed === null); if (parsed !== null) { onChange(parsed); setText(displayValue(parsed, mode)); } }} onKeyDown={event => { if ((event.altKey && event.key === 'ArrowDown') || event.key === 'F4') { event.preventDefault(); show(); } }} /><button ref={trigger} className="supernova-calendar-trigger" type="button" disabled={disabled} aria-label={`Abrir calendario de ${label.toLocaleLowerCase('es')}`} aria-expanded={open} aria-controls={calendarId} aria-haspopup="dialog" onClick={() => open ? close() : show()}><CalendarDays size={17} /></button></div>
    <div ref={popover} id={calendarId} className="supernova-calendar supernova-control-popover" popover="auto" role="dialog" aria-label={`Calendario de ${label.toLocaleLowerCase('es')}`} onToggle={event => setOpen(event.newState === 'open')} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } }}>
      <div className="supernova-calendar-head"><strong aria-live="polite">{monthLabel}</strong><button type="button" aria-label="Mes anterior" onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></button><button type="button" aria-label="Mes siguiente" onClick={() => changeMonth(1)}><ChevronRight size={17} /></button></div>
      <table aria-label={monthLabel}><thead><tr>{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <th key={day} scope="col">{day}</th>)}</tr></thead><tbody>{Array.from({ length: rows }, (_, week) => <tr key={week}>{Array.from({ length: 7 }, (_, weekday) => { const number = week * 7 + weekday - offset + 1; if (number < 1 || number > days) return <td key={weekday} />; const date = new Date(month.getFullYear(), month.getMonth(), number, 12); const day = dayValue(date); return <td key={weekday}><button type="button" data-day={day} tabIndex={focusDay === day ? 0 : -1} aria-label={date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={selectedDay === day} aria-current={day === today ? 'date' : undefined} onFocus={() => setFocusDay(day)} onKeyDown={event => moveDay(event, date)} onClick={() => selectDay(day)} className={selectedDay === day ? 'is-selected' : ''}>{number}</button></td>; })}</tr>)}</tbody></table>
      {mode === 'datetime' && <div className="supernova-time"><span>Hora del encuentro</span><div>{([{ name: 'Hora', value: hour, setter: setHour, max: 23 }, { name: 'Minutos', value: minute, setter: setMinute, max: 59 }] as const).map(part => <div className="supernova-time-part" key={part.name}><button type="button" aria-label={`Reducir ${part.name.toLowerCase()}`} onClick={() => part.setter(pad((Number(part.value) - 1 + part.max + 1) % (part.max + 1)))}><Minus size={13} /></button><input type="text" inputMode="numeric" aria-label={part.name} maxLength={2} value={part.value} onChange={event => part.setter(event.target.value.replace(/\D/g, ''))} onBlur={() => part.setter(pad(Math.max(0, Math.min(part.max, Number(part.value) || 0))))} /><button type="button" aria-label={`Aumentar ${part.name.toLowerCase()}`} onClick={() => part.setter(pad((Number(part.value) + 1) % (part.max + 1)))}><Plus size={13} /></button></div>)}</div></div>}
      <div className="supernova-calendar-footer"><button type="button" onClick={() => { const date = new Date(); setSelectedDay(dayValue(date)); setFocusDay(dayValue(date)); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); if (mode === 'date') commit(dayValue(date)); }}>Hoy</button><button type="button" onClick={() => { onChange(''); setText(''); close(); }}>Limpiar</button>{mode === 'datetime' && <button type="button" className="supernova-calendar-confirm" onClick={() => commit()}><Check size={13} /> Aplicar</button>}</div>
    </div>
  </div>;
}
