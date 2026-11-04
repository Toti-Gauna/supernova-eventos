import { useEffect, useRef, useState } from 'react';
import { ACCESS_LABELS } from '../../../../features/access/access';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, Clock3, Eye, ImagePlus, MapPin, Rocket, Save, ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { EventItem } from '../../../../types';
import { writeStorage } from '../../../../lib/storage';
import { publicAssetUrl } from '../../../../lib/assets';
import AudienceStep from '../../../../features/admin/AudienceStep';
import AccessPicker from '../../../../features/admin/AccessPicker';
import EmailStep from '../../../../features/admin/EmailStep';
import EmailPreview from '../../../../features/admin/EmailPreview';
import SupernovaSelect from '../../../../components/ui/SupernovaSelect';
import EventSessionsEditor from '../../../../features/admin/EventSessionsEditor';
import FeaturedBanner from '../../../../features/explore/FeaturedBanner';
import { getEventSessions } from '../../../../lib/eventSessions';
import { categories, clearSavedDraft, defaultEmail, DRAFT_KEY, formatEventDate, validateStep, withAccess } from '../../../../features/admin/admin.helpers';

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
  { title: 'Información general', shortTitle: 'Datos', detail: 'La experiencia' },
  { title: 'Audiencia', shortTitle: 'Audiencia', detail: 'Las personas' },
  { title: 'Plantilla de email', shortTitle: 'Email', detail: 'La invitación' },
  { title: 'Revisar y publicar', shortTitle: 'Publicar', detail: 'El gran comienzo' },
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

/** The draft as the home banner can draw it: placeholders for empty fields and a valid date. */
function bannerEvent(event: EventItem): EventItem {
  const valid = (value?: string) => Boolean(value) && !Number.isNaN(Date.parse(value!));
  const fallback = new Date(Date.now() + 14 * 864e5).toISOString();
  return {
    ...event,
    title: event.title.trim() || 'El nombre de tu experiencia',
    subtitle: event.subtitle.trim() || 'Una frase que invite a ser parte.',
    location: event.location.trim() || 'Lugar a definir',
    date: valid(event.date) ? event.date : fallback,
    sessions: event.sessions?.map(session => valid(session.date) ? session : { ...session, date: fallback }),
  };
}

/** The real home banner, inert: it shows the draft exactly as the home will. */
function BannerPreview({ event }: { event: EventItem }) {
  return <div className="wizard-banner-preview" inert>
    <FeaturedBanner event={bannerEvent(event)} joined={false} onOpen={() => undefined} label={event.featured ? 'DESTACADO' : 'PRÓXIMAMENTE'} className="wizard-banner" headingId="wizard-banner-preview-title" />
  </div>;
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
  const pendingFocus = useRef<'heading' | 'error' | 'access' | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const latestDraft = useRef({ event, editing, step });
  const draftFinished = useRef(false);
  latestDraft.current = { event, editing, step };
  const access = event.access ?? 'internal';
  const customCover = !coverPresets.some(cover => cover.src === event.image);

  function persistDraft() {
    if (draftFinished.current) return true;
    return writeStorage(DRAFT_KEY, { ...latestDraft.current, savedAt: new Date().toISOString() } satisfies SavedEventDraft);
  }

  function closeWizard() {
    if (!persistDraft()) { setSaveState('failed'); return; }
    onClose();
  }

  useEffect(() => { sectionRef.current?.querySelector<HTMLElement>('.studio-heading h1')?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      const saved = persistDraft();
      setSaveState(saved ? 'saved' : 'failed');
      if (saved) setSavedAt(new Date());
    }, 600);
    return () => window.clearTimeout(timer);
  }, [event, step, editing]);

  useEffect(() => {
    const flush = () => { persistDraft(); };
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, []);

  function focusStep() {
    if (!pendingFocus.current) return;
    const intent = pendingFocus.current;
    const selector = intent === 'error' ? '[aria-invalid="true"], [role="alert"]' : intent === 'access' ? '.access-mode-option[aria-checked="true"]' : '.wizard-section-heading h2';
    const target = sectionRef.current?.querySelector<HTMLElement>(selector);
    if (target) { if (!target.matches('input, select, textarea, button')) target.tabIndex = -1; target.focus({ preventScroll: intent === 'heading' }); }
    pendingFocus.current = null;
    if (intent === 'heading') sectionRef.current?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    if (intent === 'access') target?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'center' });
  }

  function updateField<K extends keyof EventItem>(key: K, value: EventItem[K]) {
    setEvent(current => ({ ...current, [key]: value }));
    if (errors[key]) setErrors(current => ({ ...current, [key]: '' }));
  }

  function goToStep(target: number, focus: 'heading' | 'access' = 'heading') {
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
    pendingFocus.current = focus;
    setStep(target);
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
    if (draftFinished.current) return;
    draftFinished.current = true;
    clearSavedDraft();
    onSave({ ...event, title: event.title.trim() || 'Evento sin título', status: 'draft' }, editing);
  }

  function publishEvent() {
    if (draftFinished.current) return;
    for (let index = 0; index < 3; index += 1) {
      const nextErrors = validateStep(event, index);
      if (Object.keys(nextErrors).length) { setErrors(nextErrors); pendingFocus.current = 'error'; setStep(index); return; }
    }
    if (Date.parse(event.endDate) <= Date.now()) { setErrors({ endDate: 'Para publicar, elegí una fecha de finalización futura.' }); pendingFocus.current = 'error'; setStep(0); return; }
    setPublishing(true);
    draftFinished.current = true;
    clearSavedDraft();
    onSave({ ...event, title: event.title.trim(), isPrivate: event.audience?.mode !== 'all', status: 'published' }, editing);
  }

  const audienceLabel = event.audience?.mode === 'all' ? 'Toda la compañía' : `${event.audience?.people.length || 0} personas seleccionadas`;
  const capacityLabel = `${getEventSessions(event).length > 1 ? `${getEventSessions(event).length} funciones · ` : ''}${event.capacity.toLocaleString('es-AR')} lugares`;
  const completedSections = [0, 1, 2].filter(index => !Object.keys(validateStep(event, index)).length).length;

  return <motion.div className="event-wizard is-compact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} ref={sectionRef}>
    <header className="studio-header">
      <button className="admin-back-button studio-back" type="button" aria-label="Volver a eventos" title="Volver a eventos" onClick={closeWizard}><ArrowLeft size={19} aria-hidden="true" /><span>Volver a eventos</span></button>
      <nav className="wizard-stepper studio-stepper" aria-label="Pasos para crear el evento">{steps.map((item, index) => <button type="button" key={item.title} className={`wizard-step ${index === step ? 'is-current' : ''} ${index < step ? 'is-completed' : ''}`} onClick={() => goToStep(index)} aria-label={`${item.shortTitle === item.title ? item.title : `${item.shortTitle}: ${item.title}`}. ${item.detail}`} title={item.title} aria-current={index === step ? 'step' : undefined}>{index === step && <motion.span className="wizard-step-highlight" layoutId="wizard-active-step" transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 35 }} />}<span className="wizard-step-number num-pill" aria-hidden="true">{index < step ? <Check size={14} /> : index + 1}</span><span className="studio-step-label"><strong>{item.shortTitle}</strong></span></button>)}</nav>
      <span className={`wizard-save-status studio-save-status ${saveState === 'failed' ? 'has-error' : ''}`} role="status" title={savedAt ? `Guardado local a las ${savedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'El borrador se guarda en este navegador'}>{saveState === 'saved' ? <CheckCircle2 size={15} aria-hidden="true" /> : <Clock3 size={15} aria-hidden="true" />}<span>{saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Borrador guardado' : 'No se pudo guardar'}</span></span>
    </header>
    <div className="studio-content">
      <div className="wizard-heading studio-heading"><h1 tabIndex={-1}>{editing ? 'Editar experiencia' : 'Crear experiencia'}</h1><span className="studio-stage">Paso {step + 1} de 4</span></div>
    <div className={`wizard-workspace ${step === 3 ? 'is-review' : ''}`}>
      <div className="wizard-main-panel">
        <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: reducedMotion ? 0 : direction * 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reducedMotion ? 0 : direction * -12 }} transition={{ duration: reducedMotion ? 0 : 0.22 }} onAnimationComplete={definition => { if (typeof definition === 'object' && 'opacity' in definition && definition.opacity === 1) focusStep(); }}>
          {step === 0 && <div className="wizard-step-content wizard-idea-step">
            <div className="wizard-section-heading"><h2>Todo empieza con una idea.</h2><p>Los campos con * son obligatorios.</p></div>
            <div className="admin-form-grid">
              <Field id="event-title" label="Nombre del evento" required helper={`${event.title.length}/100`} error={errors.title}><input id="event-title" placeholder="Un nombre que invite a ser parte" maxLength={100} value={event.title} onChange={change => updateField('title', change.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'event-title-error' : 'event-title-helper'} /></Field>
              <Field id="event-subtitle" label="Una frase para inspirar"><input id="event-subtitle" placeholder="Pequeños encuentros. Grandes conexiones." maxLength={180} value={event.subtitle} onChange={change => updateField('subtitle', change.target.value)} /></Field>
            </div>
            <AccessPicker variant="compact" access={access} onChange={next => setEvent(current => withAccess(current, next))} />
            <div className="admin-form-field wizard-cover-field">
              <span className="wizard-field-label" id="event-cover-label">Portada</span>
              <div className="wizard-cover-row" role="group" aria-labelledby="event-cover-label" aria-describedby="event-cover-helper">
                <button type="button" className={`wizard-cover-tile wizard-cover-add ${customCover ? 'is-selected' : ''}`} onClick={() => coverInput.current?.click()}>{customCover && <img src={publicAssetUrl(event.image)} alt="" />}<span><ImagePlus size={18} aria-hidden="true" /><span className="wizard-cover-add-label">{customCover ? 'Cambiar' : 'Subir'}</span></span></button>
                {coverPresets.map(cover => <button key={cover.src} type="button" aria-label={`Usar portada de ${cover.label}`} aria-pressed={event.image === cover.src} className={`wizard-cover-tile ${event.image === cover.src ? 'is-selected' : ''}`} onClick={() => updateField('image', cover.src)}><img src={publicAssetUrl(cover.src)} alt="" /><span>{cover.label}</span></button>)}
              </div>
              <input ref={coverInput} className="admin-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir portada del evento" onChange={change => { void uploadCover(change.target.files?.[0]); change.target.value = ''; }} />
              {coverError ? <small className="admin-field-error" role="alert">{coverError}</small> : <small id="event-cover-helper">Elegí una foto o subí la tuya: JPG, PNG o WebP de hasta 2 MB.</small>}
            </div>
            <div className="admin-form-grid is-three">
              <Field id="event-category" label="Categoría" required><SupernovaSelect id="event-category" label="Categoría" required value={event.category} options={categories.map(category => ({ value: category, label: category }))} onChange={value => updateField('category', value as EventItem['category'])} /></Field>
              <Field id="event-mode" label="Modalidad" required><SupernovaSelect id="event-mode" label="Modalidad" required value={event.mode} options={['Presencial', 'Online', 'Híbrido'].map(mode => ({ value: mode, label: mode }))} onChange={value => updateField('mode', value as EventItem['mode'])} /></Field>
              <Field id="event-companions" label="Acompañantes por persona" helper="0 para inscripción individual." error={errors.companions}><input id="event-companions" type="number" min={0} max={5} value={event.companions} onChange={change => updateField('companions', Number(change.target.value))} aria-invalid={!!errors.companions} aria-describedby={errors.companions ? 'event-companions-error' : 'event-companions-helper'} /></Field>
            </div>
            <div className="admin-form-grid is-wide-first">
              <Field id="event-location" label={event.mode === 'Online' ? 'Enlace de acceso o plataforma' : 'Ubicación del evento'} required error={errors.location}><input id="event-location" placeholder={event.mode === 'Online' ? 'https://… o nombre de la plataforma' : 'Lugar, dirección y ciudad'} maxLength={250} value={event.location} onChange={change => updateField('location', change.target.value)} aria-invalid={!!errors.location} aria-describedby={errors.location ? 'event-location-error' : undefined} /></Field>
              <Field id="event-host" label="Organiza"><input id="event-host" placeholder="Equipo Órbita" value={event.host} maxLength={100} onChange={change => updateField('host', change.target.value)} /></Field>
            </div>
            <EventSessionsEditor event={event} errors={errors} onChange={value => { setEvent(value); setErrors({}); }} />
            <Field id="event-description" label="Acerca de la experiencia" required error={errors.description}><textarea id="event-description" rows={4} placeholder="¿Qué hace especial a este encuentro? Contá qué van a vivir, descubrir o compartir." maxLength={5000} value={event.description} onChange={change => updateField('description', change.target.value)} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'event-description-error' : undefined} /></Field>
            <div className="wizard-toggle-grid">
              <label className="admin-feature-toggle wizard-terms-toggle"><span><ShieldCheck size={18} aria-hidden="true" /><span><strong>Términos y condiciones</strong><small>{termsEnabled ? 'Se aceptan al inscribirse.' : 'Pedilos solo si hacen falta.'}</small></span></span><input type="checkbox" role="switch" aria-label="Activar términos y condiciones" checked={termsEnabled} onChange={change => { setTermsEnabled(change.target.checked); updateField('terms', change.target.checked ? termsDraft : ''); }} /><span className="admin-switch" /></label>
              <label className="admin-feature-toggle"><span><Sparkles size={18} aria-hidden="true" /><span><strong>Que brille en la home</strong><small>Destacarla entre los próximos eventos.</small></span></span><input type="checkbox" role="switch" checked={event.featured} onChange={change => updateField('featured', change.target.checked)} /><span className="admin-switch" /></label>
            </div>
            {termsEnabled && <Field id="event-terms" className="wizard-terms-field" label="Condiciones de participación" helper="Las personas deberán aceptarlas antes de inscribirse."><textarea id="event-terms" aria-describedby="event-terms-helper" rows={3} placeholder="Condiciones de participación, cancelaciones o información importante…" maxLength={5000} value={event.terms} onChange={change => { setTermsDraft(change.target.value); updateField('terms', change.target.value); }} /></Field>}
          </div>}
          {step === 1 && <AudienceStep audience={event.audience!} access={access} onAccessChange={next => setEvent(current => withAccess(current, next))} onEditAccess={() => goToStep(0, 'access')} error={errors.audience} onChange={audience => { setEvent(current => ({ ...current, audience, isPrivate: audience.mode !== 'all' })); setErrors({}); }} />}
          {step === 2 && <EmailStep event={event} errors={errors} onChange={emailTemplate => { updateField('emailTemplate', emailTemplate); setErrors({}); }} />}
          {step === 3 && <div className="wizard-step-content wizard-review-content"><div className="wizard-section-heading"><h2>Una idea. Muchas historias por venir.</h2><p>Revisá los últimos detalles antes de publicar.</p></div><div className="wizard-review-summary"><h3>{event.title}</h3><p>{event.description}</p><div className="wizard-review-grid"><span><CalendarDays size={18} aria-hidden="true" /><small>CUÁNDO</small><strong>{formatEventDate(event.date, true)}</strong><span>Hasta {formatEventDate(event.endDate, true)}</span></span><span><MapPin size={18} aria-hidden="true" /><small>DÓNDE</small><strong>{event.location}</strong><span>{event.mode}</span></span><span><Users size={18} aria-hidden="true" /><small>PARA QUIÉNES</small><strong>{audienceLabel}</strong><span>{capacityLabel} · {event.companions ? `${event.companions} acompañantes por persona` : 'Inscripción individual'}</span></span><span><ShieldCheck size={18} aria-hidden="true" /><small>PARTICIPACIÓN</small><strong>{event.isPrivate ? 'Evento privado' : 'Evento abierto'}</strong><span>{ACCESS_LABELS[access]} · {event.terms ? 'Con aceptación de términos' : 'Sin términos adicionales'}</span></span></div></div><div className="wizard-review-email"><span className="wizard-review-mini-icon icon-only" aria-hidden="true"><Sparkles size={18} /></span><div><small>SU PRIMERA INVITACIÓN</small><strong>{event.emailTemplate?.subject}</strong><span>Plantilla guardada para este evento.</span></div><button type="button" onClick={() => goToStep(2)}>Editar <ArrowRight size={14} aria-hidden="true" /></button></div><div className="wizard-publish-note"><CheckCircle2 size={17} aria-hidden="true" /><p>Al publicar, el evento queda disponible en esta demo. <strong>No se envían emails: el envío real necesita el backend.</strong></p></div></div>}
        </motion.div></AnimatePresence>
        <div className="wizard-actions"><div>{step > 0 && <button className="admin-back-button" type="button" onClick={() => goToStep(step - 1)}><ArrowLeft size={16} aria-hidden="true" /> Atrás</button>}<button className="admin-text-button" type="button" onClick={saveDraft}><Save size={15} aria-hidden="true" /> Guardar borrador</button></div><button className="admin-primary-button" type="button" disabled={publishing} onClick={step === 3 ? publishEvent : () => goToStep(step + 1)}>{step === 3 ? <><Rocket size={16} aria-hidden="true" /> {publishing ? 'Publicando…' : editing ? 'Publicar cambios' : 'Publicar evento'}</> : <>Continuar <ArrowRight size={17} aria-hidden="true" /></>}</button></div>
      </div>
      <aside className="wizard-preview-panel" aria-label={step === 2 ? 'Vista previa del email' : 'Vista previa del evento'}>
        {step === 2
          ? <><div className="wizard-preview-label"><span className="admin-live-dot" /><strong>Tu invitación, en vivo</strong></div><div className="email-preview-person-selector"><label htmlFor="preview-person">Personalizar para</label><SupernovaSelect id="preview-person" label="Personalizar para" value={previewPerson} onChange={setPreviewPerson} options={['Sofía Martínez', ...(event.audience?.people.filter(person => person.name !== 'Sofía Martínez').slice(0, 30).map(person => person.name) || [])].map(name => ({ value: name, label: name }))} /></div><EmailPreview event={event} name={previewPerson} /></>
          : <><div className="wizard-preview-label"><span className="admin-live-dot" /><strong>Así se ve en la home</strong><button type="button" className="wizard-preview-open" onClick={() => onPreview({ ...event, status: 'draft' })}><Eye size={15} aria-hidden="true" />Ver como participante</button></div><BannerPreview event={event} /></>}
        <div className="wizard-readiness"><div><span>Tu experiencia toma forma</span><strong>{completedSections}/3</strong></div>{steps.slice(0, 3).map((item, index) => { const ready = !Object.keys(validateStep(event, index)).length; return <button key={item.title} type="button" onClick={() => goToStep(index)} className={ready ? 'is-ready' : ''}><span className="icon-only" aria-hidden="true">{ready ? <Check size={13} /> : index + 1}</span>{item.title}<span className="sr-only">{ready ? ': completo' : ': pendiente'}</span><ArrowUpRight size={14} aria-hidden="true" /></button>; })}</div>
      </aside>
    </div>
    </div>
  </motion.div>;
}
