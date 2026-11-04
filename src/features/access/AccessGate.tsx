import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, BadgeCheck, Building2, CalendarPlus, Check, KeyRound, QrCode, ShieldCheck, Ticket, UsersRound } from 'lucide-react';
import type { AccessProfile } from '../../types';
import Brand from '../../components/Brand';
import { eventImageProps } from '../../lib/assets';
import { DEMO_INVITATION_CODE, EMAIL_PATTERN, INTERNAL_DEMO_PROFILE, initials } from './access';
import './access.css';

interface Props { onEnter: (profile: AccessProfile) => void; signedOut?: boolean }
type Field = 'name' | 'email' | 'code';
type Kind = AccessProfile['kind'];

const collage = [
  { image: '/images/concert.jpg', label: 'Música', tone: 'musica' },
  { image: '/images/workshop.jpg', label: 'Aprendizaje', tone: 'aprendizaje' },
  { image: '/images/wellness.jpg', label: 'Bienestar', tone: 'bienestar' },
];
const choices: { kind: Kind; label: string; detail: string; Icon: typeof Building2 }[] = [
  { kind: 'internal', label: 'Personal interno', detail: 'Con tu cuenta corporativa', Icon: Building2 },
  { kind: 'external', label: 'Personal externo', detail: 'Con un código de invitación', Icon: Ticket },
];

/**
 * Split screen: a brand stage on the left (a slim band on phones) and the access panel on the
 * right. Two large choices pick the door; only that door's form is shown, so everything fits
 * one screen. Both panels share one grid cell, so switching never moves the layout.
 */
export default function AccessGate({ onEnter, signedOut = false }: Props) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const fields = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), code: useRef<HTMLInputElement>(null) };
  const [guest, setGuest] = useState({ name: '', email: '', organization: '', code: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [choice, setChoice] = useState<Kind>('internal');
  useEffect(() => { if (signedOut) heading.current?.focus({ preventScroll: true }); }, [signedOut]);

  function update(field: keyof typeof guest, value: string) {
    setGuest(current => ({ ...current, [field]: value }));
    if (field in errors) setErrors(current => ({ ...current, [field]: undefined }));
  }
  function enterAsGuest(event: FormEvent) {
    event.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (!guest.name.trim()) next.name = 'Completá tu nombre y apellido.';
    if (!EMAIL_PATTERN.test(guest.email.trim())) next.email = 'Ingresá un email válido.';
    if (guest.code.trim().toUpperCase() !== DEMO_INVITATION_CODE) next.code = 'El código no coincide con una invitación vigente.';
    setErrors(next);
    const firstInvalid = (['name', 'email', 'code'] as const).find(field => next[field]);
    if (firstInvalid) { fields[firstInvalid].current?.focus(); return; }
    onEnter({ kind: 'external', name: guest.name.trim(), email: guest.email.trim(), organization: guest.organization.trim() || 'Invitación externa' });
  }
  const describedBy = (field: Field, hint?: string) => [hint, errors[field] ? `${id}-${field}-error` : ''].filter(Boolean).join(' ') || undefined;
  const panelState = (kind: Kind) => ({ 'data-active': choice === kind, inert: choice !== kind });

  return <section className="access-gate" aria-labelledby={`${id}-title`}>
    <div className="access-stage" aria-hidden="true">
      <Brand />
      <div className="access-stage-copy">
        <span className="access-stage-eyebrow"><span>✦</span> EVENTOS QUE NOS CONECTAN</span>
        <p className="access-stage-title">Lo que nos conecta, en un solo lugar.</p>
      </div>
      <div className="access-collage">
        {collage.map(({ image, label, tone }) => <figure key={label} className={`access-collage-tile tone-${tone}`}>
          <img {...eventImageProps(image, '(max-width: 800px) 96px, 240px')} alt="" decoding="async" />
          <figcaption>{label}</figcaption>
        </figure>)}
      </div>
      <ul className="access-stage-perks">
        <li><QrCode size={15} /> Pase con QR</li>
        <li><CalendarPlus size={15} /> Directo a tu calendario</li>
        <li><UsersRound size={15} /> Abierto a invitados</li>
      </ul>
    </div>

    <div className="access-panel">
      <div className="access-intro">
        {signedOut && <p className="access-notice" role="status"><Check size={15} /> Cerraste sesión. Te esperamos en la próxima órbita.</p>}
        <h1 id={`${id}-title`} ref={heading} tabIndex={-1}>¿Cómo entrás <span>hoy?</span></h1>
        <p className="access-lead">Elegí tu acceso. Cada uno abre los eventos pensados para vos.</p>
      </div>

      <div className="access-choice" role="group" aria-label="Tipo de acceso">
        {choices.map(({ kind, label, detail, Icon }) => <button key={kind} type="button" className={`access-choice-tile is-${kind}`} aria-label={label} aria-describedby={`${id}-${kind}-detail`} aria-pressed={choice === kind} onClick={() => setChoice(kind)}>
          <span className="access-choice-icon" aria-hidden="true"><Icon size={20} /></span>
          <span className="access-choice-copy"><strong>{label}</strong><small id={`${id}-${kind}-detail`}>{detail}</small></span>
          <span className="access-choice-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
        </button>)}
      </div>

      <div className="access-options" data-choice={choice}>
        <article className="access-card access-card-internal" aria-labelledby={`${id}-internal`} {...panelState('internal')}>
          <div className="access-card-head"><h2 id={`${id}-internal`}>Soy parte del equipo</h2><p>Para colaboradoras y colaboradores con cuenta corporativa.</p></div>
          <div className="access-credential" aria-label="Cuenta corporativa de demostración" role="group">
            <span className="access-credential-avatar num-pill" aria-hidden="true">{initials(INTERNAL_DEMO_PROFILE.name)}</span>
            <span className="access-credential-copy"><strong>{INTERNAL_DEMO_PROFILE.name}</strong><small>{INTERNAL_DEMO_PROFILE.email}</small></span>
            <span className="access-credential-sso"><ShieldCheck size={14} aria-hidden="true" /> SSO demo</span>
          </div>
          <ul className="access-benefits" aria-label="Qué incluye el acceso interno">
            <li><BadgeCheck size={16} aria-hidden="true" /> Eventos internos y abiertos</li>
            <li><BadgeCheck size={16} aria-hidden="true" /> Tus datos corporativos</li>
            <li><BadgeCheck size={16} aria-hidden="true" /> Administración según tu rol</li>
          </ul>
          <button type="button" className="button primary access-cta" onClick={() => onEnter(INTERNAL_DEMO_PROFILE)}>Ingresar con cuenta corporativa <ArrowUpRight size={18} /></button>
        </article>

        <article className="access-card access-card-external" aria-labelledby={`${id}-external`} {...panelState('external')}>
          <div className="access-card-head"><h2 id={`${id}-external`}>Vengo con una invitación</h2><p>Invitados, proveedores, prensa y equipos externos.</p></div>
          <form className="access-form" onSubmit={enterAsGuest} noValidate>
            <div className="access-field">
              <label htmlFor={`${id}-name`}>Nombre y apellido</label>
              <input ref={fields.name} id={`${id}-name`} value={guest.name} onChange={event => update('name', event.target.value)} autoComplete="name" maxLength={120} placeholder="Dana Prueba" aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('name')} />
              {errors.name && <span className="access-error" id={`${id}-name-error`}>{errors.name}</span>}
            </div>
            <div className="access-field">
              <label htmlFor={`${id}-email`}>Email</label>
              <input ref={fields.email} id={`${id}-email`} type="email" value={guest.email} onChange={event => update('email', event.target.value)} autoComplete="email" maxLength={254} placeholder="nombre@empresa.com" aria-invalid={Boolean(errors.email)} aria-describedby={describedBy('email')} />
              {errors.email && <span className="access-error" id={`${id}-email-error`}>{errors.email}</span>}
            </div>
            <div className="access-field access-field-half">
              <label htmlFor={`${id}-organization`}>Organización <small>(opcional)</small></label>
              <input id={`${id}-organization`} value={guest.organization} onChange={event => update('organization', event.target.value)} autoComplete="organization" maxLength={120} placeholder="Tu empresa" />
            </div>
            <div className="access-field access-field-half">
              <label htmlFor={`${id}-code`}>Código de invitación</label>
              <div className="access-code-field"><KeyRound size={16} aria-hidden="true" /><input ref={fields.code} id={`${id}-code`} value={guest.code} onChange={event => update('code', event.target.value)} autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} maxLength={40} placeholder="Tu código" aria-invalid={Boolean(errors.code)} aria-describedby={describedBy('code', `${id}-code-hint`)} /></div>
              {errors.code && <span className="access-error" id={`${id}-code-error`}>{errors.code}</span>}
            </div>
            <p className="access-hint" id={`${id}-code-hint`}>Para esta demo, el código es <strong>{DEMO_INVITATION_CODE}</strong>.</p>
            <button type="submit" className="button primary access-cta">Ingresar como invitado <ArrowUpRight size={18} /></button>
          </form>
        </article>
      </div>

      <small className="access-footnote"><ShieldCheck size={13} aria-hidden="true" /> Acceso de demostración.<span className="access-footnote-detail"> En producción, el ingreso interno usa la cuenta corporativa y el externo una invitación validada por el servidor.</span></small>
    </div>
  </section>;
}
