import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import type { EventItem } from '../../types';
import { defaultEmail, downloadFile, emailButtonTextColor, formatEventDate, renderEmailText } from './admin.helpers';

interface EmailPreviewProps { event: EventItem; name?: string; compact?: boolean }

export function downloadEmailPreview(event: EventItem, name = 'Sofía'): void {
  const template = event.emailTemplate || defaultEmail;
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const text = (value: string) => escape(renderEmailText(value, event, name));
  const accent = /^#[\da-f]{6}$/i.test(template.accentColor) ? template.accentColor : '#b998f5';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text(template.subject)}</title></head><body style="margin:0;background:#eeedf2;padding:32px 12px;font-family:Arial,sans-serif;color:#201c32"><table role="presentation" width="100%" style="max-width:600px;margin:auto;border-collapse:collapse;background:white"><tr><td style="padding:32px;background:#151020;color:white;font-size:26px;letter-spacing:-1px">supernova<span style="color:${accent}"> ✧</span></td></tr><tr><td style="padding:32px"><p style="color:#8b6db9;font-size:12px;letter-spacing:2px">UNA NUEVA EXPERIENCIA</p><h1 style="font-size:32px;line-height:1.2">${text(template.heading)}</h1><p style="line-height:1.8;white-space:pre-line">${text(template.body)}</p><div style="padding:20px;background:#f7f5fa;border-radius:12px"><strong>${escape(event.title || 'Tu próximo evento')}</strong><p style="font-size:14px;margin-bottom:0">${escape(formatEventDate(event.date, true))}<br>${escape(event.location || 'Ubicación por definir')}</p></div><p style="margin:28px 0 0"><span style="display:inline-block;background:${accent};color:#211432;padding:15px 24px;border-radius:30px;font-weight:bold">${text(template.buttonText)}</span></p><p style="margin-top:32px;color:#918a9d;font-size:12px">Vista previa del prototipo. El backend incorporará el enlace de inscripción y el envío real.</p></td></tr></table></body></html>`;
  downloadFile('supernova-vista-previa-email.html', html, 'text/html;charset=utf-8');
}

export default function EmailPreview({ event, name = 'Sofía Martínez', compact = false }: EmailPreviewProps) {
  const template = event.emailTemplate || defaultEmail;
  return <div className={`admin-email-preview ${compact ? 'is-compact' : ''}`}>
    <div className="email-preview-envelope"><span>Para</span><strong>{name}</strong><span>Asunto</span><strong>{renderEmailText(template.subject, event, name)}</strong></div>
    <div className="email-preview-page">
      <div className="email-preview-brand"><span>supernova</span><Sparkles size={19} /><small>conectá sin límites</small></div>
      <div className="email-preview-body"><span className="email-preview-eyebrow">UNA NUEVA EXPERIENCIA</span><h3>{renderEmailText(template.heading, event, name)}</h3><p>{renderEmailText(template.body, event, name)}</p><div className="email-preview-event"><strong>{event.title || 'Tu próximo evento'}</strong><span><CalendarDays size={13} /> {formatEventDate(event.date, true)}</span><span><MapPin size={13} /> {event.location || 'Ubicación por definir'}</span></div><span className="email-preview-cta" style={{ backgroundColor: template.accentColor, color: emailButtonTextColor(template.accentColor) }}>{template.buttonText || 'Quiero ser parte'}<ArrowUpRight size={15} /></span><small className="email-preview-footer">Hecho para vos. Vivido entre todos.<br />Supernova · Experiencias que nos conectan</small></div>
    </div>
  </div>;
}
