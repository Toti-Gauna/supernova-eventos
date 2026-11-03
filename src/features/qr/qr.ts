import type { EventItem, Registration } from '../../types';
import { getRegistrationSession } from '../../lib/eventSessions';
import { versionHref, type ExperienceVersion } from '../../versions/catalog';

export function currentExperienceVersion(): ExperienceVersion {
  const version = document.documentElement.dataset.experience;
  return version === 'original' || version === 'hybrid' ? version : '3d';
}

/** An event QR opens its event and function in the current local presentation. */
export function eventDeepLink(eventId: string, sessionId?: string, version = currentExperienceVersion(), origin = location.origin): string {
  const url = new URL(versionHref(version), origin);
  url.searchParams.set('evento', eventId);
  if (sessionId) url.searchParams.set('funcion', sessionId);
  return url.href;
}

/** Demo identifiers only: names, email addresses and audience lists never enter the QR. */
export function passPayload(event: EventItem, pass: Registration): string {
  return JSON.stringify({
    type: 'supernova-demo-pass', version: 1,
    passId: pass.id, eventId: event.id,
    sessionId: getRegistrationSession(event, pass)?.id ?? pass.sessionId ?? `${event.id}:main`,
  });
}

/** Keep the generator outside the initial UI bundle and preserve a four-module quiet zone. */
export async function generateQrSVG(payload: string): Promise<string> {
  const { default: QRCode } = await import('qrcode');
  const { modules } = QRCode.create(payload, { errorCorrectionLevel: 'Q' });
  const margin = 4;
  const size = modules.size + margin * 2;
  const strokes: string[] = [];
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (!modules.data[y * modules.size + x]) continue;
      const start = x;
      while (x + 1 < modules.size && modules.data[y * modules.size + x + 1]) x++;
      const width = x - start + 1;
      strokes.push(`M${start + margin} ${y + margin}h${width}v1h-${width}z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="512" height="512" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${strokes.join('')}" fill="#09090b"/></svg>`;
}

export function qrDataURL(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function qrDownloadName(kind: 'evento' | 'pase', id: string): string {
  return `orbita-${kind}-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}-qr.svg`;
}
