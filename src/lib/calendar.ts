import type { EventItem } from '../types';

export function formatEventDate(date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', ...options }).format(new Date(date));
}
export function eventLocalDay(date: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date));
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function downloadFile(content: string, fileName: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const icsEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r/g, '');
export function downloadCalendar(event: EventItem) {
  const stamp = (date: string) => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const content = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Supernova//Eventos//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${event.id}@supernova.demo`, `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.date)}`, `DTEND:${stamp(event.endDate)}`, `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.subtitle)}`, `LOCATION:${icsEscape(event.location)}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
  downloadFile(content, `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`, 'text/calendar;charset=utf-8');
}
