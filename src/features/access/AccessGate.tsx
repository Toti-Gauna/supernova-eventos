import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, BadgeCheck, Building2, Check, KeyRound, ShieldCheck, Ticket } from 'lucide-react';
import type { AccessProfile } from '../../types';
import Brand from '../../components/Brand';
import { DEMO_INVITATION_CODE, EMAIL_PATTERN, INTERNAL_DEMO_PROFILE, initials } from './access';
import './access.css';

interface Props { onEnter: (profile: AccessProfile) => void; signedOut?: boolean }
type Field = 'name' | 'email' | 'code';

/**
 * Both doors fit one screen in a glass panel over the version's background. On desktop
 * they sit side by side; on phones a toggle shows one at a time so nothing needs scrolling.
 */
export default function AccessGate({ onEnter, signedOut = false }: Props) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const fields = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), code: useRef<HTMLInputElement>(null) };
  const [guest, setGuest] = useState({ name: '', email: '', organization: '', code: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [choice, setChoice] = useState<AccessProfile['kind']>('internal');
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

  return <section className="access-gate section-container" aria-labelledby={`${id}-title`}>
    <div className="access-shell">
      <div className="access-intro">
        <Brand />
        {signedOut && <p className="access-notice" role="status"><Check size={15} /> Cerraste sesión. Te esperamos en la próxima órbita.</p>}
        <h1 id={`${id}-title`} ref={heading} tabIndex={-1}>¿Cómo entrás <span>hoy?</span></h1>
        <p className="access-lead">Elegí tu acceso. Cada uno abre los eventos pensados para vos.</p>
      </div>
      <div className="access-switch" role="group" aria-label="Tipo de acceso">
        <button type="button" aria-pressed={choice === 'internal'} onClick={() => setChoice('internal')}><Building2 size={15} aria-hidden="true" /> Personal interno</button>
        <button type="button" aria-pressed={choice === 'external'} onClick={() => setChoice('external')}><Ticket size={15} aria-hidden="true" /> Personal externo</button>
      </div>
      <div className="access-options" data-choice={choice}>
        <article className="access-card access-card-internal" aria-labelledby={`${id}-internal`}>
          <span className="access-pill"><Building2 size={15} aria-hidden="true" /> Personal interno</span>
          <h2 id={`${id}-internal`}>Soy parte del equipo</h2>
          <p>Para colaboradoras y colaboradores con cuenta corporativa.</p>
          <ul className="access-benefits" aria-label="Qué incluye el acceso interno">
            <li><BadgeCheck size={15} aria-hidden="true" /> Eventos internos y abiertos</li>
            <li><BadgeCheck size={15} aria-hidden="true" /> Tus datos corporativos</li>
            <li><BadgeCheck size={15} aria-hidden="true" /> Administración según tu rol</li>
          </ul>
          <div className="access-credential" aria-label="Cuenta corporativa de demostración" role="group">
            <span className="access-credential-avatar" aria-hidden="true">{initials(INTERNAL_DEMO_PROFILE.name)}</span>
            <span><strong>{INTERNAL_DEMO_PROFILE.name}</strong><small>{INTERNAL_DEMO_PROFILE.email}</small></span>
            <span className="access-credential-sso"><ShieldCheck size={14} aria-hidden="true" /> SSO demo</span>
          </div>
          <button type="button" className="button primary" onClick={() => onEnter(INTERNAL_DEMO_PROFILE)}>Ingresar con cuenta corporativa <ArrowUpRight size={17} /></button>
        </article>
        <article className="access-card access-card-external" aria-labelledby={`${id}-external`}>
          <span className="access-pill"><Ticket size={15} aria-hidden="true" /> Personal externo</span>
          <h2 id={`${id}-external`}>Vengo con una invitación</h2>
          <p>Invitados, proveedores, prensa y equipos externos.</p>
          <form className="access-form" onSubmit={enterAsGuest} noValidate>
            <div className="access-field">
              <label htmlFor={`${id}-name`}>Nombre y apellido</label>
              <input ref={fields.name} id={`${id}-name`} value={guest.name} onChange={event => update('name', event.target.value)} autoComplete="name" maxLength={120} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('name')} />
              {errors.name && <span className="access-error" id={`${id}-name-error`}>{errors.name}</span>}
            </div>
            <div className="access-field">
              <label htmlFor={`${id}-email`}>Email</label>
              <input ref={fields.email} id={`${id}-email`} type="email" value={guest.email} onChange={event => update('email', event.target.value)} autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy('email')} />
              {errors.email && <span className="access-error" id={`${id}-email-error`}>{errors.email}</span>}
            </div>
            <div className="access-field access-field-half">
              <label htmlFor={`${id}-organization`}>Organización <small>(opcional)</small></label>
              <input id={`${id}-organization`} value={guest.organization} onChange={event => update('organization', event.target.value)} autoComplete="organization" maxLength={120} />
            </div>
            <div className="access-field access-field-half">
              <label htmlFor={`${id}-code`}>Código de invitación</label>
              <div className="access-code-field"><KeyRound size={16} aria-hidden="true" /><input ref={fields.code} id={`${id}-code`} value={guest.code} onChange={event => update('code', event.target.value)} autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} maxLength={40} aria-invalid={Boolean(errors.code)} aria-describedby={describedBy('code', `${id}-code-hint`)} /></div>
              {errors.code && <span className="access-error" id={`${id}-code-error`}>{errors.code}</span>}
            </div>
            <p className="access-hint" id={`${id}-code-hint`}>Para esta demo, el código es <strong>{DEMO_INVITATION_CODE}</strong>.</p>
            <button type="submit" className="button primary">Ingresar como invitado <ArrowUpRight size={17} /></button>
          </form>
        </article>
      </div>
      <small className="access-footnote">Acceso de demostración.<span className="access-footnote-detail"> En producción, el ingreso interno usa la cuenta corporativa y el externo una invitación validada por el servidor.</span></small>
    </div>
  </section>;
}
