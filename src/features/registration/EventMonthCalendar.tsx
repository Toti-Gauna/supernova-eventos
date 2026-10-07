import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import type { EventItem } from '../../types';
import { eventLocalDay, formatEventDate } from '../../lib/calendar';

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const fullWeekDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** A display calendar: its highlighted day always represents the event, never a new reservation date. */
export default function EventMonthCalendar({ event }: { event: EventItem }) {
  const [eventYear, eventMonth, eventDay] = eventLocalDay(event.date).split('-').map(Number);
  const [month, setMonth] = useState(() => ({ year: eventYear, month: eventMonth - 1 }));
  const reducedMotion = useReducedMotion();
  const firstDay = new Date(Date.UTC(month.year, month.month, 1));
  const firstWeekday = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
  const rowCount = Math.ceil((firstWeekday + daysInMonth) / 7);
  const monthLabel = monthFormatter.format(firstDay);
  const isEventMonth = month.year === eventYear && month.month === eventMonth - 1;
  const today = eventLocalDay(new Date().toISOString());

  function navigateMonth(offset: number) {
    const next = new Date(Date.UTC(month.year, month.month + offset, 1));
    setMonth({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  }

  return <section className="event-calendar" aria-label="Fecha de tu experiencia">
    <div className="calendar-intro"><span className="eyebrow">GUARDÁ ESTE MOMENTO</span><h3>Nos vemos en órbita.</h3><p>Un día para salir de la rutina.</p></div>
    <div className="calendar-month-bar"><h4 id="event-calendar-month" aria-live="polite">{monthLabel}</h4><div><button type="button" aria-label="Mes anterior" onClick={() => navigateMonth(-1)}><ChevronLeft size={17} /></button><button type="button" aria-label="Mes siguiente" onClick={() => navigateMonth(1)}><ChevronRight size={17} /></button><button type="button" className="calendar-reset" aria-label="Ir a la fecha del evento" disabled={isEventMonth} onClick={() => setMonth({ year: eventYear, month: eventMonth - 1 })}><CalendarDays size={15} /></button></div></div>
    <motion.div key={`${month.year}-${month.month}`} className="calendar-table-wrap" initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .22 }}>
      <table className="calendar-table" aria-labelledby="event-calendar-month">
        <caption className="sr-only">Calendario de {monthLabel}. La fecha de tu experiencia es el {formatEventDate(event.date, { day: 'numeric', month: 'long', year: 'numeric' })}.</caption>
        <thead><tr>{weekDays.map((day, index) => <th key={day} scope="col"><abbr title={fullWeekDays[index]}>{day}</abbr></th>)}</tr></thead>
        <tbody>{Array.from({ length: rowCount }, (_, row) => <tr key={row}>{Array.from({ length: 7 }, (_, column) => {
          const day = row * 7 + column - firstWeekday + 1;
          if (day < 1 || day > daysInMonth) return <td key={column} className="calendar-empty" />;
          const date = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const selected = isEventMonth && day === eventDay;
          return <td key={column} className={`${selected ? 'calendar-event-day' : ''} ${date === today ? 'calendar-today' : ''}`}>
            <time dateTime={date} aria-current={date === today ? 'date' : undefined} aria-label={selected ? `${day}, fecha de tu experiencia` : undefined}><span>{day}</span>{selected && <i aria-hidden="true" />}</time>
          </td>;
        })}</tr>)}</tbody>
      </table>
    </motion.div>
    <div className="calendar-legend"><span><i /> Tu experiencia</span></div>
    <div className="calendar-event-summary"><span className="calendar-event-icon"><CalendarDays size={19} /></span><div><strong>{formatEventDate(event.date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong><span><Clock3 size={13} />{formatEventDate(event.date, { hour: '2-digit', minute: '2-digit', hour12: false })} — {formatEventDate(event.endDate, { hour: '2-digit', minute: '2-digit', hour12: false })} h</span></div></div>
  </section>;
}
