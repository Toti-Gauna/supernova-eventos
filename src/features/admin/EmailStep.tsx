import { useRef, useState } from 'react';
import { Braces, Download, Mail, RotateCcw } from 'lucide-react';
import type { EmailTemplate, EventItem } from '../../types';
import { defaultEmail, emailVariables } from './admin.helpers';
import { downloadEmailPreview } from './EmailPreview';
import SupernovaColorPicker from '../../components/ui/SupernovaColorPicker';

interface EmailStepProps {
  event: EventItem;
  onChange: (template: EmailTemplate) => void;
  errors: Record<string, string>;
}

export default function EmailStep({ event, onChange, errors }: EmailStepProps) {
  const template = event.emailTemplate || defaultEmail;
  const [activeField, setActiveField] = useState<'subject' | 'heading' | 'body'>('body');
  const subjectRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function updateField(key: keyof EmailTemplate, value: string) { onChange({ ...template, [key]: value }); }

  function insertVariable(variable: string) {
    const ref = activeField === 'subject' ? subjectRef : activeField === 'heading' ? headingRef : bodyRef;
    const input = ref.current;
    const value = template[activeField];
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    const token = `{{${variable}}}`;
    updateField(activeField, value.slice(0, start) + token + value.slice(end));
    window.requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + token.length, start + token.length); });
  }

  return <div className="wizard-step-content">
    <div className="wizard-section-heading"><span className="admin-eyebrow">UNA INVITACIÓN QUE SE SIENTE PERSONAL</span><h2>El primer encuentro es en su inbox.</h2><p>Creá un mensaje único para este evento. Las variables lo personalizan para cada persona.</p></div>
    <div className="email-editor-toolbar"><span><Braces size={17} /> Insertar en {activeField === 'body' ? 'el mensaje' : activeField === 'subject' ? 'el asunto' : 'el título'}</span><div>{emailVariables.map(variable => <button key={variable} type="button" onClick={() => insertVariable(variable)}>{`{{${variable}}}`}</button>)}</div></div>
    <div className="admin-form-field"><label htmlFor="email-subject">Asunto del email <span>*</span></label><input ref={subjectRef} id="email-subject" value={template.subject} maxLength={180} onFocus={() => setActiveField('subject')} onChange={change => updateField('subject', change.target.value)} aria-invalid={!!errors.subject} aria-describedby={errors.subject ? 'email-subject-error' : undefined} />{errors.subject ? <small id="email-subject-error" className="admin-field-error">{errors.subject}</small> : <small>El comienzo de algo bueno. Hacelo irresistible.</small>}</div>
    <div className="admin-form-field"><label htmlFor="email-heading">Título de la invitación <span>*</span></label><input ref={headingRef} id="email-heading" value={template.heading} maxLength={160} onFocus={() => setActiveField('heading')} onChange={change => updateField('heading', change.target.value)} aria-invalid={!!errors.heading} />{errors.heading && <small className="admin-field-error">{errors.heading}</small>}</div>
    <div className="admin-form-field"><label htmlFor="email-body">Mensaje <span>*</span></label><textarea ref={bodyRef} id="email-body" rows={11} maxLength={5000} value={template.body} onFocus={() => setActiveField('body')} onChange={change => updateField('body', change.target.value)} aria-invalid={!!errors.body} />{errors.body && <small className="admin-field-error">{errors.body}</small>}</div>
    <div className="admin-form-grid email-button-settings"><div className="admin-form-field"><label htmlFor="email-button">Texto del botón <span>*</span></label><input id="email-button" value={template.buttonText} maxLength={50} onChange={change => updateField('buttonText', change.target.value)} aria-invalid={!!errors.buttonText} />{errors.buttonText && <small className="admin-field-error">{errors.buttonText}</small>}</div><div className="admin-form-field"><label htmlFor="email-color">Color del botón</label><SupernovaColorPicker id="email-color" value={template.accentColor} onChange={value => updateField('accentColor', value)} /></div></div>
    <div className="email-editor-actions"><button className="admin-text-button" type="button" onClick={() => onChange({ ...defaultEmail })}><RotateCcw size={14} /> Usar plantilla Supernova</button><button className="admin-text-button" type="button" onClick={() => downloadEmailPreview(event)}><Download size={15} /> Descargar vista previa</button></div>
    <div className="admin-inline-note"><Mail size={16} /> La plantilla queda guardada con este evento. Esta demo no envía emails.</div>
  </div>;
}
