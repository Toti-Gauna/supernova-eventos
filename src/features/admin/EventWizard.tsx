import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, Clock3, Eye, ImagePlus, MapPin, Rocket, Save, ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { EventItem } from '../../types';
import { writeStorage } from '../../lib/storage';
import { publicAssetUrl } from '../../lib/assets';
import AudienceStep from './AudienceStep';
import EmailStep from './EmailStep';
import EmailPreview from './EmailPreview';
import SupernovaSelect from '../../components/ui/SupernovaSelect';
import SupernovaDatePicker from '../../components/ui/SupernovaDatePicker';
import { categories, clearSavedDraft, defaultEmail, DRAFT_KEY, formatEventDate, fromLocalDateTime, toLocalDateTime, validateStep } from './admin.helpers';

export interface SavedEventDraft { event: EventItem; editing: boolean; savedAt: string; step: number }
interface EventWizardProps {
  initial: EventItem;
  editing: boolean;
  initialStep?: number;
  onClose: () => void;
  onSave: (event: EventItem, editing: boolean) => void;
  onPreview: (event: EventItem) => void;
}
interface FieldProps { id: string; label: string; required?: boolean; helper?: string; error?: string; children: ReactNode; className?: string }

const steps = [
  { title: 'Información general', detail: 'La experiencia' },
  { title: 'Audiencia', detail: 'Las personas' },
  { title: 'Plantilla de email', detail: 'La invitación' },
  { title: 'Revisar y publicar', detail: 'El gran comienzo' },
];
const coverPresets = [
  { src: '/images/innovation.jpg', label: 'Innovación' },
  { src: '/images/concert.jpg', label: 'Música' },
  { src: '/images/wellness.jpg', label: 'Bienestar' },
  { src: '/images/community.jpg', label: 'Comunidad' },
  { src: '/images/workshop.jpg', label: 'Aprendizaje' },
];

function Field({ id, label, required, helper, error, children, className = '' }: FieldProps) {
  return <div className={`admin-form-field ${className}`}><label htmlFor={id}>{label}{required && <span> *</span>}</label>{children}{error ? <small id={`${id}-error`} className="admin-field-error" role="alert">{error}</small> : helper && <small id={`${id}-helper`}>{helper}</small>}</div>;
}

function EventLivePreview({ event }: { event: EventItem }) {
  const month = new Date(event.date).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
  const day = new Date(event.date).getDate();
  return <div className="wizard-event-preview"><div className="wizard-preview-image"><img src={publicAssetUrl(event.image)} alt="Portada del evento" /><span className="wizard-preview-category">{event.category}</span><span className="wizard-preview-date"><strong>{Number.isNaN(day) ? '—' : day}</strong>{Number.isNaN(day) ? 'fecha' : month}</span><span className="wizard-preview-image-glow" /></div><div className="wizard-preview-content"><span className="admin-eyebrow">TU PRÓXIMA CONEXIÓN</span><h3>{event.title || 'El nombre de algo extraordinario.'}</h3><p>{event.subtitle || 'Hay momentos que se convierten en historias.'}</p><div><span><CalendarDays size={14} /> {formatEventDate(event.date, true)}</span><span><MapPin size={14} /> {event.location || 'Un lugar por descubrir'}</span><span><Users size={14} /> {event.capacity.toLocaleString('es-AR')} lugares · {event.mode}</span></div><span className="wizard-preview-button">Quiero ser parte <ArrowRight size={15} /></span></div></div>;
}

export default function EventWizard({ initial, editing, initialStep = 0, onClose, onSave, onPreview }: EventWizardProps) {
  const [event, setEvent] = useState<EventItem>(() => ({ ...initial, audience: initial.audience || { mode: initial.isPrivate ? 'payroll' : 'all', people: [] }, emailTemplate: initial.emailTemplate || { ...defaultEmail } }));
  const [step, setStep] = useState(Math.min(3, Math.max(0, initialStep)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverError, setCoverError] = useState('');
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed'>('saving');
  const [previewPerson, setPreviewPerson] = useState('Sofía Martínez');
  const [publishing, setPublishing] = useState(false);
  const [termsEnabled, setTermsEnabled] = useState(Boolean(initial.terms.trim()));
  const [termsDraft, setTermsDraft] = useState(initial.terms);
  const [direction, setDirection] = useState(1);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const reducedMotion = useReducedMotion();
  const pendingFocus = useRef<'heading' | 'error' | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => { sectionRef.current?.querySelector<HTMLElement>('.studio-heading h1')?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      const saved = writeStorage(DRAFT_KEY, { event, editing, savedAt: new Date().toISOString(), step } satisfies SavedEventDraft);
      setSaveState(saved ? 'saved' : 'failed');
      if (saved) setSavedAt(new Date());
    }, 600);
    return () => window.clearTimeout(timer);
  }, [event, step, editing]);

  function focusStep() {
    if (!pendingFocus.current) return;
    const selector = pendingFocus.current === 'error' ? '[aria-invalid="true"], [role="alert"]' : '.wizard-section-heading h2';
    const target = sectionRef.current?.querySelector<HTMLElement>(selector);
    if (target) { if (!target.matches('input, select, textarea, button')) target.tabIndex = -1; target.focus({ preventScroll: pendingFocus.current !== 'error' }); }
    pendingFocus.current = null;
  }

  function updateField<K extends keyof EventItem>(key: K, value: EventItem[K]) {
    setEvent(current => ({ ...current, [key]: value }));
    if (errors[key]) setErrors(current => ({ ...current, [key]: '' }));
  }

  function goToStep(target: number) {
    if (target === step) return;
    setDirection(target > step ? 1 : -1);
    if (target > step) {
      for (let index = 0; index < target; index += 1) {
        const nextErrors = validateStep(event, index);
        if (Object.keys(nextErrors).length) {
          setErrors(nextErrors);
          pendingFocus.current = 'error';
          setStep(index);
          if (index === step) window.requestAnimationFrame(focusStep);
          return;
        }
      }
    }
    setErrors({});
    pendingFocus.current = 'heading';
    setStep(target);
    sectionRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setCoverError('Elegí una imagen JPG, PNG o WebP.'); return; }
    if (file.size > 2 * 1024 * 1024) { setCoverError('Elegí una imagen de hasta 2 MB para poder guardar el mockup.'); return; }
    const reader = new FileReader();
    reader.onload = () => { updateField('image', String(reader.result)); setCoverError(''); };
    reader.onerror = () => setCoverError('No pudimos leer la imagen. Volvé a intentarlo.');
    reader.readAsDataURL(file);
  }

  function saveDraft() {
    clearSavedDraft();
    onSave({ ...event, title: event.title.trim() || 'Evento sin título', status: 'draft' }, editing);
  }

  function publishEvent() {
    for (let index = 0; index < 3; index += 1) {
      const nextErrors = validateStep(event, index);
      if (Object.keys(nextErrors).length) { setErrors(nextErrors); pendingFocus.current = 'error'; setStep(index); return; }
    }
    if (Date.parse(event.endDate) <= Date.now()) { setErrors({ endDate: 'Para publicar, elegí una fecha de finalización futura.' }); pendingFocus.current = 'error'; setStep(0); return; }
    setPublishing(true);
    clearSavedDraft();
    onSave({ ...event, title: event.title.trim(), isPrivate: event.audience?.mode !== 'all', status: 'published' }, editing);
  }

  const audienceLabel = event.audience?.mode === 'all' ? 'Toda la compañía' : `${event.audience?.people.length || 0} personas seleccionadas`;
  const capacityLabel = `${event.capacity.toLocaleString('es-AR')} lugares`;
  const completedSections = [0, 1, 2].filter(index => !Object.keys(validateStep(event, index)).length).length;

  return <motion.div className="event-wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} ref={sectionRef}>
    <header className="studio-header">
      <button className="admin-back-button studio-back" type="button" aria-label="Volver a eventos" title="Volver a eventos" onClick={onClose}><ArrowLeft size={19} /><span>Volver a eventos</span></button>
      <nav className="wizard-stepper studio-stepper" aria-label="Pasos para crear el evento">{steps.map((item, index) => <button type="button" key={item.title} className={`wizard-step ${index === step ? 'is-current' : ''} ${index < step ? 'is-completed' : ''}`} onClick={() => goToStep(index)} aria-current={index === step ? 'step' : undefined}>{index === step && <motion.span className="wizard-step-highlight" layoutId="wizard-active-step" transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 35 }} />}<span className="wizard-step-number">{index < step ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span><span className="studio-step-label"><strong>{item.title}</strong><small>{item.detail}</small></span></button>)}</nav>
      <span className={`wizard-save-status studio-save-status ${saveState === 'failed' ? 'has-error' : ''}`} role="status" title={savedAt ? `Guardado local a las ${savedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'El borrador se guarda en este navegador'}>{saveState === 'saved' ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}<span>{saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Borrador guardado' : 'No se pudo guardar'}</span></span>
    </header>
    <div className="studio-content">
      <div className="wizard-heading studio-heading"><div><span className="admin-eyebrow">ESTUDIO DE EXPERIENCIAS</span><h1 tabIndex={-1}>{editing ? 'Editar experiencia' : 'Crear experiencia'}</h1><p>{editing ? `Cada detalle cuenta en ${initial.title}.` : 'Dale forma a un momento que conecte personas.'}</p></div><span className="studio-stage" aria-label={`Paso ${step + 1} de 4`}><span>{String(step + 1).padStart(2, '0')}</span><span>/ 04</span></span></div>
    <div className={`wizard-workspace ${step === 3 ? 'is-review' : ''}`}>
      <div className="wizard-main-panel">
        <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: reducedMotion ? 0 : direction * 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reducedMotion ? 0 : direction * -12 }} transition={{ duration: reducedMotion ? 0 : 0.22 }} onAnimationComplete={focusStep}>
          {step === 0 && <div className="wizard-step-content">
            <div className="wizard-section-heading"><span className="admin-eyebrow">LOS DETALLES HACEN LA MAGIA</span><h2>Todo empieza con una idea.</h2><p>Contanos qué vamos a vivir. Los campos con * son obligatorios.</p></div>
            <div className="admin-form-field"><label>Portada de la experiencia</label><button type="button" className="wizard-cover-upload" onClick={() => coverInput.current?.click()}><img src={publicAssetUrl(event.image)} alt="Portada seleccionada" /><span><ImagePlus size={25} /><strong>Elegí la primera impresión</strong><small>Subí una imagen · JPG, PNG o WebP · Hasta 2 MB</small></span></button><input ref={coverInput} className="admin-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir portada del evento" onChange={change => { void uploadCover(change.target.files?.[0]); change.target.value = ''; }} />{coverError && <small className="admin-field-error" role="alert">{coverError}</small>}<div className="wizard-cover-presets">{coverPresets.map(cover => <button key={cover.src} type="button" aria-label={`Usar portada de ${cover.label}`} aria-pressed={event.image === cover.src} className={event.image === cover.src ? 'is-selected' : ''} onClick={() => updateField('image', cover.src)}><img src={publicAssetUrl(cover.src)} alt="" /><span>{cover.label}</span>{event.image === cover.src && <Check size={13} />}</button>)}</div></div>
            <Field id="event-title" label="Nombre del evento" required helper={`${event.title.length}/100 caracteres · Claro, breve y memorable.`} error={errors.title}><input id="event-title" placeholder="Un nombre que invite a ser parte" maxLength={100} value={event.title} onChange={change => updateField('title', change.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'event-title-error' : 'event-title-helper'} /></Field>
            <Field id="event-subtitle" label="Una frase para inspirar" helper="La bajada que va a acompañar el nombre." ><input id="event-subtitle" aria-describedby="event-subtitle-helper" placeholder="Pequeños encuentros. Grandes conexiones." maxLength={180} value={event.subtitle} onChange={change => updateField('subtitle', change.target.value)} /></Field>
            <div className="admin-form-grid"><Field id="event-category" label="Categoría" required><SupernovaSelect id="event-category" label="Categoría" required value={event.category} options={categories.map(category => ({ value: category, label: category }))} onChange={value => updateField('category', value as EventItem['category'])} /></Field><Field id="event-mode" label="Modalidad" required><SupernovaSelect id="event-mode" label="Modalidad" required value={event.mode} options={['Presencial', 'Online', 'Híbrido'].map(mode => ({ value: mode, label: mode }))} onChange={value => updateField('mode', value as EventItem['mode'])} /></Field></div>
            <Field id="event-location" label={event.mode === 'Online' ? 'Enlace de acceso o plataforma' : 'Ubicación del evento'} required error={errors.location}><input id="event-location" placeholder={event.mode === 'Online' ? 'https://… o nombre de la plataforma' : 'Lugar, dirección y ciudad'} maxLength={250} value={event.location} onChange={change => updateField('location', change.target.value)} aria-invalid={!!errors.location} aria-describedby={errors.location ? 'event-location-error' : undefined} /></Field>
            <div className="admin-form-grid"><Field id="event-start" label="Fecha y hora de inicio" required error={errors.date}><SupernovaDatePicker id="event-start" label="Fecha y hora de inicio" mode="datetime" required value={toLocalDateTime(event.date)} onChange={value => updateField('date', fromLocalDateTime(value))} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'event-start-error' : undefined} /></Field><Field id="event-end" label="Fecha y hora de fin" required error={errors.endDate}><SupernovaDatePicker id="event-end" label="Fecha y hora de fin" mode="datetime" required value={toLocalDateTime(event.endDate)} onChange={value => updateField('endDate', fromLocalDateTime(value))} aria-invalid={!!errors.endDate} aria-describedby={errors.endDate ? 'event-end-error' : undefined} /></Field></div>
            <div className="admin-form-grid"><Field id="event-capacity" label="Cupo total" required error={errors.capacity}><input id="event-capacity" type="number" min={Math.max(1, event.registered)} max={100000} value={event.capacity} onChange={change => updateField('capacity', Number(change.target.value))} aria-invalid={!!errors.capacity} aria-describedby={errors.capacity ? 'event-capacity-error' : undefined} /></Field><Field id="event-companions" label="Acompañantes por persona" helper="0 para inscripciones individuales." error={errors.companions}><input id="event-companions" type="number" min={0} max={5} value={event.companions} onChange={change => updateField('companions', Number(change.target.value))} aria-invalid={!!errors.companions} aria-describedby={errors.companions ? 'event-companions-error' : undefined} /></Field></div>
            <Field id="event-description" label="Acerca de la experiencia" required error={errors.description}><textarea id="event-description" rows={5} placeholder="¿Qué hace especial a este encuentro? Contá qué van a vivir, descubrir o compartir." maxLength={5000} value={event.description} onChange={change => updateField('description', change.target.value)} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'event-description-error' : undefined} /></Field>
            <Field id="event-host" label="Organiza"><input id="event-host" placeholder="Equipo Supernova" value={event.host} maxLength={100} onChange={change => updateField('host', change.target.value)} /></Field>
            <div className="wizard-terms-setting"><label className="admin-feature-toggle wizard-terms-toggle"><span><ShieldCheck size={18} /><span><strong>Términos y condiciones</strong><small>{termsEnabled ? 'La inscripción requiere aceptar tus condiciones.' : 'Activá esta opción si la experiencia necesita condiciones.'}</small></span></span><input type="checkbox" role="switch" aria-label="Activar términos y condiciones" checked={termsEnabled} onChange={change => { setTermsEnabled(change.target.checked); updateField('terms', change.target.checked ? termsDraft : ''); }} /><span className="admin-switch" /></label>{termsEnabled && <Field id="event-terms" label="Condiciones de participación" helper="Las personas deberán aceptarlas antes de inscribirse."><textarea id="event-terms" aria-describedby="event-terms-helper" rows={3} placeholder="Condiciones de participación, cancelaciones o información importante…" maxLength={5000} value={event.terms} onChange={change => { setTermsDraft(change.target.value); updateField('terms', change.target.value); }} /></Field>}</div>
            <label className="admin-feature-toggle"><span><Sparkles size={18} /><span><strong>Que brille en la home</strong><small>Destacar esta experiencia entre los próximos eventos.</small></span></span><input type="checkbox" checked={event.featured} onChange={change => updateField('featured', change.target.checked)} /><span className="admin-switch" /></label>
          </div>}
          {step === 1 && <AudienceStep audience={event.audience!} error={errors.audience} onChange={audience => { setEvent(current => ({ ...current, audience, isPrivate: audience.mode !== 'all' })); setErrors({}); }} />}
          {step === 2 && <EmailStep event={event} errors={errors} onChange={emailTemplate => { updateField('emailTemplate', emailTemplate); setErrors({}); }} />}
          {step === 3 && <div className="wizard-step-content wizard-review-content"><div className="wizard-review-icon"><Rocket size={31} /><span /></div><div className="wizard-section-heading"><span className="admin-eyebrow">TODO LISTO PARA CONECTAR</span><h2>Una idea. Muchas historias por venir.</h2><p>Revisá los últimos detalles antes de darle vida a esta experiencia.</p></div><div className="wizard-review-summary"><h3>{event.title}</h3><p>{event.description}</p><div className="wizard-review-grid"><span><CalendarDays size={19} /><small>CUÁNDO</small><strong>{formatEventDate(event.date, true)}</strong><span>Hasta {formatEventDate(event.endDate, true)}</span></span><span><MapPin size={19} /><small>DÓNDE</small><strong>{event.location}</strong><span>{event.mode}</span></span><span><Users size={19} /><small>PARA QUIÉNES</small><strong>{audienceLabel}</strong><span>{capacityLabel} · {event.companions ? `${event.companions} acompañantes por persona` : 'Inscripción individual'}</span></span><span><ShieldCheck size={19} /><small>PARTICIPACIÓN</small><strong>{event.isPrivate ? 'Evento privado' : 'Evento abierto'}</strong><span>{event.terms ? 'Con aceptación de términos' : 'Sin términos adicionales'}</span></span></div></div><div className="wizard-review-email"><span className="wizard-review-mini-icon"><Sparkles size={19} /></span><div><small>SU PRIMERA INVITACIÓN</small><strong>{event.emailTemplate?.subject}</strong><span>Plantilla personalizada guardada para este evento.</span></div><button type="button" onClick={() => goToStep(2)}>Editar <ArrowRight size={14} /></button></div><button className="admin-outline-button wizard-preview-action" type="button" onClick={() => onPreview({ ...event, status: 'draft' })}><Eye size={17} /> Ver como participante <ArrowUpRightIcon /></button><div className="wizard-publish-note"><CheckCircle2 size={17} /><p>Al publicar, el evento estará disponible en esta demo. <strong>Los emails se enviarán cuando esté conectado el backend.</strong></p></div></div>}
        </motion.div></AnimatePresence>
        <div className="wizard-actions"><span className="wizard-actions-context">{String(step + 1).padStart(2, '0')} / 04</span><div>{step > 0 && <button className="admin-back-button" type="button" onClick={() => goToStep(step - 1)}><ArrowLeft size={16} /> Atrás</button>}<button className="admin-text-button" type="button" onClick={saveDraft}><Save size={15} /> Guardar borrador</button></div><button className="admin-primary-button" type="button" disabled={publishing} onClick={step === 3 ? publishEvent : () => goToStep(step + 1)}>{step === 3 ? <><Rocket size={16} /> {publishing ? 'Publicando…' : editing ? 'Publicar cambios' : 'Publicar evento'}</> : <>Continuar <ArrowRight size={17} /></>}</button></div>
      </div>
      <aside className="wizard-preview-panel" aria-label={step === 2 ? 'Vista previa del email' : 'Vista previa del evento'}><div className="wizard-preview-label"><span className="admin-live-dot" /><strong>{step === 2 ? 'Tu invitación, en vivo' : 'Así se ve tu experiencia'}</strong><small>VISTA PREVIA</small></div>{step === 2 ? <><div className="email-preview-person-selector"><label htmlFor="preview-person">Personalizar para</label><SupernovaSelect id="preview-person" label="Personalizar para" value={previewPerson} onChange={setPreviewPerson} options={['Sofía Martínez', ...(event.audience?.people.filter(person => person.name !== 'Sofía Martínez').slice(0, 30).map(person => person.name) || [])].map(name => ({ value: name, label: name }))} /></div><EmailPreview event={event} name={previewPerson} /></> : <><EventLivePreview event={event} /><div className="wizard-preview-note"><Sparkles size={17} /><p>Los detalles crean la experiencia.<br /><strong>Cada uno cuenta.</strong></p></div>{step === 3 && <div className="wizard-review-audience"><Users size={17} /><span><small>AUDIENCIA</small><strong>{audienceLabel}</strong></span></div>}</>}<div className="wizard-readiness"><div><span>Tu experiencia toma forma</span><strong>{completedSections}/3</strong></div>{steps.slice(0, 3).map((item, index) => { const ready = !Object.keys(validateStep(event, index)).length; return <button key={item.title} type="button" onClick={() => goToStep(index)} className={ready ? 'is-ready' : ''}><span>{ready ? <Check size={13} /> : index + 1}</span>{item.title}<ArrowUpRight size={14} /></button>; })}</div></aside>
    </div>
    </div>
  </motion.div>;
}

function ArrowUpRightIcon() { return <ArrowUpRight size={14} />; }
