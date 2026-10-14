import type { EventItem, Registration } from '../../types';
import { downloadFile, formatEventDate } from '../../lib/calendar';
import { getRegistrationSession } from '../../lib/eventSessions';
import { generateQrSVG, passPayload } from './qr';

const escapeXml = (text: string) => text.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[character]!));
function line(text: string, limit: number) {
  const characters = Array.from(text);
  return characters.length > limit ? characters.slice(0, limit - 1).join('') + '…' : text;
}

/** The exported ticket contains the same scannable, identifier-only QR as the UI. */
export async function downloadTicket(event: EventItem, pass: Registration) {
  const session = getRegistrationSession(event, pass);
  const date = session?.date ?? event.date;
  const qr = (await generateQrSVG(passPayload(event, pass))).replace('width="512" height="512"', 'x="882" y="330" width="250" height="250"');
  const title = Array.from(event.title);
  const first = title.length > 35 ? title.slice(0, 35).join('') : event.title;
  const second = title.length > 35 ? line(title.slice(35).join(''), 35) : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720"><title>${escapeXml(event.title)} · ${escapeXml(pass.id)}</title><defs><radialGradient id="ticket-gradient" cx=".5" cy=".4" r=".8"><stop stop-color="#60439d"/><stop offset="1" stop-color="#161020"/></radialGradient></defs><rect width="1200" height="720" rx="36" fill="url(#ticket-gradient)"/><g fill="none" stroke="#c5a5ff" stroke-opacity=".14"><circle cx="1100" cy="60" r="290"/><circle cx="1100" cy="60" r="220"/></g><g font-family="Arial,sans-serif" fill="#f7f5fb"><text x="64" y="88" font-size="36">supernova</text><text x="64" y="168" font-size="15" letter-spacing="4" fill="#d6c2f4">TU PRÓXIMO GRAN MOMENTO</text><text x="64" y="246" font-size="40">${escapeXml(first)}</text>${second ? `<text x="64" y="298" font-size="40">${escapeXml(second)}</text>` : ''}<text x="64" y="370" font-size="24">${escapeXml(formatEventDate(date))} · ${escapeXml(formatEventDate(date, { hour: '2-digit', minute: '2-digit', hour12: false }))} h</text><text x="64" y="411" font-size="20" fill="#ded4ec">${escapeXml(line(event.location, 56))}</text>${session?.name ? `<text x="64" y="448" font-size="17" fill="#ded4ec">${escapeXml(line(session.name, 58))}</text>` : ''}<path d="M64 480H824" stroke="#c5a5ff" stroke-dasharray="5 7" opacity=".4"/><text x="64" y="530" font-size="24">${escapeXml(line(pass.name, 46))}</text><text x="64" y="566" font-size="17" fill="#ded4ec">${pass.companions ? `Vos + ${pass.companions} acompañante${pass.companions > 1 ? 's' : ''}` : 'Pase individual'}</text><text x="64" y="610" font-size="15" fill="#ded4ec">${escapeXml(pass.id)}</text><text x="882" y="610" font-size="15" fill="#ded4ec">QR DE TU PASE</text><text x="64" y="676" font-size="13" fill="#c0b2d6">PASE DE DEMOSTRACIÓN · VALIDACIÓN LOCAL, SIN AUTORIZACIÓN DE ACCESO REAL</text></g>${qr}</svg>`;
  downloadFile(svg, `supernova-pase-${event.id}-${pass.id}.svg`, 'image/svg+xml');
}
