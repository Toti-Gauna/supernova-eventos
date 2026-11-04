import { Building2, Check, Globe2, Ticket } from 'lucide-react';
import type { EventAccess } from '../../types';

export const accessModes = [
  { access: 'internal', icon: Building2, title: 'Personal interno', description: 'Solo colaboradores con cuenta corporativa.' },
  { access: 'all', icon: Globe2, title: 'Interno y externo', description: 'El equipo y sus invitados externos.' },
  { access: 'external', icon: Ticket, title: 'Personal externo', description: 'Solo invitados, proveedores o prensa.' },
] as const;

interface AccessPickerProps {
  access: EventAccess;
  onChange: (access: EventAccess) => void;
  /** `compact` is the one-row segmented version used in the first step of the creator. */
  variant?: 'cards' | 'compact';
  id?: string;
}

/**
 * Who can discover the event. A radiogroup of buttons: arrows move the choice, as in a
 * native radio group, and only the selected option is in the tab order.
 */
export default function AccessPicker({ access, onChange, variant = 'cards', id = 'event-access' }: AccessPickerProps) {
  const compact = variant === 'compact';
  function moveWith(key: string, index: number) {
    const step = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 0;
    if (!step) return false;
    const next = accessModes[(index + step + accessModes.length) % accessModes.length];
    onChange(next.access);
    window.requestAnimationFrame(() => document.getElementById(`${id}-${next.access}`)?.focus());
    return true;
  }
  return <div className={`access-mode-picker ${compact ? 'is-compact' : ''}`}>
    <h3 id={`${id}-label`}>¿Quiénes pueden verlo?</h3>
    <p id={`${id}-hint`}>{compact ? 'El servidor valida el permiso final.' : 'Define qué acceso descubre este evento en Órbita. El servidor valida el permiso final.'}</p>
    <div className="access-mode-options" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`}>
      {accessModes.map(({ access: value, icon: Icon, title, description }, index) => <button key={value} id={`${id}-${value}`} type="button" role="radio" aria-checked={access === value} tabIndex={access === value ? 0 : -1} title={compact ? description : undefined} className={`access-mode-option ${access === value ? 'is-selected' : ''}`} onClick={() => onChange(value)} onKeyDown={event => { if (moveWith(event.key, index)) event.preventDefault(); }}>
        <Icon size={compact ? 17 : 18} aria-hidden="true" />
        <span><strong>{title}</strong>{compact ? <span className="sr-only">. {description}</span> : <small>{description}</small>}</span>
        <span className="audience-radio" aria-hidden="true">{access === value && <Check size={12} />}</span>
      </button>)}
    </div>
  </div>;
}
