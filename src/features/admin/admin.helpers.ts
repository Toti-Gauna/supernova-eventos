import type { AudiencePerson, EmailTemplate, EventItem, Registration } from '../../types';

export const DRAFT_KEY = 'supernova:event-builder:v1';
export const categories: EventItem['category'][] = ['Música', 'Bienestar', 'Tecnología', 'Comunidad', 'Aprendizaje'];
export const statusLabels: Record<EventItem['status'], string> = { published: 'Publicado', draft: 'Borrador', ended: 'Finalizado' };
export const emailVariables = ['nombre', 'evento', 'fecha', 'ubicacion'] as const;
export const defaultEmail: EmailTemplate = {
  subject: '{{nombre}}, tu próxima experiencia te espera ✨',
  heading: 'Hay encuentros que lo cambian todo.',
  body: 'Hola {{nombre}},\n\nTe invitamos a {{evento}}. Un momento para conectar, descubrir y compartir algo extraordinario.\n\nNos encontramos el {{fecha}} en {{ubicacion}}.\n\nTu lugar en esta historia te está esperando.',
  buttonText: 'Quiero ser parte',
  accentColor: '#b998f5',
};

export function clearSavedDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY); }
  catch { /* Saving a session-only event still works when browser storage is unavailable. */ }
}

export function emailButtonTextColor(color: string): string {
  const hex = color.replace('#', '');
  if (!/^[\da-f]{6}$/i.test(hex)) return '#211432';
  const [red, green, blue] = [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16));
  return (red * 299 + green * 587 + blue * 114) / 1000 >= 145 ? '#211432' : '#ffffff';
}

export function newEvent(): EventItem {
  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    id: crypto.randomUUID(), title: '', subtitle: '', category: 'Comunidad', image: '/images/innovation.jpg',
    date: start.toISOString(), endDate: end.toISOString(), location: '', mode: 'Presencial', capacity: 150,
    registered: 0, description: '', host: 'Equipo Supernova', featured: false, isPrivate: false, status: 'draft',
    companions: 0, terms: '', audience: { mode: 'all', people: [] }, emailTemplate: { ...defaultEmail },
  };
}

export function formatEventDate(date: string, full = false): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return 'Fecha por definir';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: full ? 'long' : 'short', ...(full ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(value);
}

export function toLocalDateTime(date: string): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function fromLocalDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function renderEmailText(text: string, event: EventItem, personName = 'Sofía'): string {
  const values: Record<string, string> = {
    nombre: personName.split(' ')[0], evento: event.title || 'Tu próximo evento',
    fecha: formatEventDate(event.date, true), ubicacion: event.location || 'Un lugar extraordinario',
  };
  return text.replace(/\{\{(nombre|evento|fecha|ubicacion)\}\}/g, (_, key: string) => values[key]);
}

export function downloadFile(filename: string, contents: BlobPart, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportRegistrations(events: EventItem[], registrations: Registration[]): void {
  const csvCell = (value: unknown) => {
    const original = String(value ?? '');
    const safe = /^[=+\-@]/.test(original) ? `'${original}` : original;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = [['Evento', 'Nombre', 'Email', 'Acompañantes', 'Fecha de inscripción'], ...registrations.map(registration => [
    events.find(event => event.id === registration.eventId)?.title || registration.eventId,
    registration.name, registration.email, registration.companions, registration.createdAt,
  ])];
  downloadFile('supernova-inscripciones.csv', '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n'));
}

export interface AudienceImportResult { people: AudiencePerson[]; duplicates: number; issues: { row: number; reason: string }[] }

function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const firstLine = source.split(/\r?\n/, 1)[0];
  let quoted = false;
  const delimiterCounts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  for (let index = 0; index < firstLine.length; index += 1) {
    if (firstLine[index] === '"') quoted = !quoted;
    else if (!quoted && firstLine[index] in delimiterCounts) delimiterCounts[firstLine[index]] += 1;
  }
  const delimiter = Object.keys(delimiterCounts).sort((a, b) => delimiterCounts[b] - delimiterCounts[a])[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let closedQuote = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inQuotes) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') { inQuotes = false; closedQuote = true; }
      else cell += char;
    } else if (char === '"') {
      if (cell.trim() || closedQuote) throw new Error('El CSV tiene comillas fuera de lugar. Usá el modelo de ejemplo.');
      inQuotes = true;
    } else if (char === delimiter || char === '\r' || char === '\n') {
      row.push(cell.trim()); cell = ''; closedQuote = false;
      if (char !== delimiter) {
        if (row.some(value => value)) rows.push(row);
        row = [];
        if (char === '\r' && source[index + 1] === '\n') index += 1;
      }
    } else {
      if (closedQuote && char.trim()) throw new Error('El CSV tiene valores después de una comilla de cierre. Revisá el archivo.');
      cell += char;
    }
  }
  if (inQuotes) throw new Error('El CSV tiene una celda con comillas sin cerrar.');
  row.push(cell.trim());
  if (row.some(value => value)) rows.push(row);
  return rows;
}

export async function parseAudienceFile(file: File): Promise<AudienceImportResult> {
  if (!/\.(xlsx|csv)$/i.test(file.name)) throw new Error('Elegí un archivo Excel (.xlsx) o CSV.');
  if (file.size > 5 * 1024 * 1024) throw new Error('El archivo debe pesar menos de 5 MB.');
  let table: unknown[][];
  if (/\.csv$/i.test(file.name)) table = parseCsv(await file.text());
  else {
    try {
      const { readSheet } = await import('read-excel-file/browser');
      table = await readSheet(file);
    } catch { throw new Error('No pudimos abrir ese Excel. Revisá que sea un archivo .xlsx válido o probá con el modelo CSV.'); }
  }
  if (table.length < 2) throw new Error('El archivo no contiene personas. Incluí una fila de encabezados.');
  if (table.length > 5001) throw new Error('Podés importar hasta 5.000 personas por archivo.');
  const normalize = (key: string) => key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const headers = table[0].map(value => normalize(String(value ?? '')));
  const nameIndex = headers.findIndex(value => ['nombre', 'name', 'nombre completo'].includes(value));
  const emailIndex = headers.findIndex(value => ['email', 'correo', 'mail'].includes(value));
  const departmentIndex = headers.findIndex(value => ['area', 'departamento', 'department'].includes(value));
  if (nameIndex < 0 || emailIndex < 0) throw new Error('Incluí las columnas nombre y email en la primera fila. Podés descargar el modelo.');
  const seen = new Set<string>();
  const result: AudienceImportResult = { people: [], duplicates: 0, issues: [] };
  table.slice(1).forEach((row, index) => {
    if (row.every(cell => !String(cell ?? '').trim())) return;
    const email = String(row[emailIndex] ?? '').trim().toLowerCase();
    const name = String(row[nameIndex] ?? '').trim();
    const department = String(row[departmentIndex] ?? '').trim() || 'Sin área';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      result.issues.push({ row: index + 2, reason: !name ? 'Falta el nombre' : 'Email inválido o vacío' });
      return;
    }
    if (seen.has(email)) { result.duplicates += 1; return; }
    seen.add(email);
    result.people.push({ id: `import-${crypto.randomUUID()}`, name, email, department });
  });
  return result;
}

export async function downloadAudienceSample(): Promise<void> {
  downloadFile('supernova-modelo-invitados.csv', '\uFEFFnombre;email;area\r\nSofía Martínez;sofia.martinez@example.com;Tecnología\r\nLucas Fernández;lucas.fernandez@example.com;Marketing');
}

export function validateStep(event: EventItem, step: number): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (event.title.trim().length < 3) errors.title = 'Dale un nombre de al menos 3 caracteres.';
    if (!event.location.trim()) errors.location = 'Indicá la ubicación o el enlace de acceso.';
    if (event.description.trim().length < 20) errors.description = 'Contá un poco más: al menos 20 caracteres.';
    if (!event.date || Number.isNaN(Date.parse(event.date))) errors.date = 'Elegí una fecha de inicio válida.';
    if (!event.endDate || Number.isNaN(Date.parse(event.endDate)) || Date.parse(event.endDate) <= Date.parse(event.date)) errors.endDate = 'El fin debe ser posterior al inicio.';
    if (!Number.isInteger(event.capacity) || event.capacity < Math.max(1, event.registered) || event.capacity > 100000) errors.capacity = `El cupo debe ser entero, entre ${Math.max(1, event.registered)} y 100.000.`;
    if (!Number.isInteger(event.companions) || event.companions < 0 || event.companions > 5) errors.companions = 'Elegí entre 0 y 5 acompañantes.';
  }
  if (step === 1 && event.audience?.mode !== 'all' && !event.audience?.people.length) errors.audience = 'Seleccioná o importá al menos una persona para continuar.';
  if (step === 2) {
    if (!event.emailTemplate?.subject.trim()) errors.subject = 'Completá el asunto del email.';
    if (!event.emailTemplate?.heading.trim()) errors.heading = 'Agregá un título a la invitación.';
    if (!event.emailTemplate?.body.trim()) errors.body = 'Escribí el mensaje de la invitación.';
    if (!event.emailTemplate?.buttonText.trim()) errors.buttonText = 'Dale un texto al botón.';
  }
  return errors;
}
