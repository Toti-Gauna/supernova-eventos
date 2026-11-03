import { useId, useRef, useState } from 'react';
import { Check, ChevronDown, Layers, X } from 'lucide-react';
import { versionHref, type ExperienceVersion } from './catalog';
import './version-switcher.css';

const versions: { value: ExperienceVersion; label: string; description: string }[] = [
  { value: 'original', label: 'Original', description: 'El recorrido clásico' },
  { value: '3d', label: '3D', description: 'Planetas y nave en 3D' },
  { value: 'hybrid', label: '2D + 3D', description: 'Arte ilustrado y cámara espacial' },
  { value: 'commercial', label: 'Comercial', description: 'Estética Personal, sin espacio' },
];

export default function VersionSwitcher() {
  const id = `version-switcher-${useId().replace(/:/g, '')}`;
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const current = versions.find(version => version.value === document.documentElement.dataset.experience) ?? versions[1];

  function close() {
    popover.current?.hidePopover();
    trigger.current?.focus({ preventScroll: true });
  }

  return <div className="version-switcher">
    <button ref={trigger} type="button" className="version-switcher-button" aria-label="Cambiar versión" title={`Versión ${current.label} · Cambiar versión`} aria-expanded={open} aria-controls={id} popoverTarget={id}>
      <Layers size={17} /><span>{current.label}</span><ChevronDown size={12} className="version-switcher-chevron" />
    </button>
    <div ref={popover} id={id} className="version-switcher-popover" popover="auto" onToggle={event => setOpen((event.nativeEvent as ToggleEvent).newState === 'open')}>
      <div className="version-switcher-heading"><h2>Elegí tu versión</h2><button type="button" aria-label="Cerrar versiones" onClick={close}><X size={16} /></button></div>
      <nav aria-label="Versiones de Órbita">
        {versions.map(version => <a key={version.value} href={versionHref(version.value)} aria-current={version.value === current.value ? 'page' : undefined}>
          <span><strong>{version.label}</strong><small>{version.description}</small></span>{version.value === current.value && <Check size={16} aria-hidden="true" />}
        </a>)}
      </nav>
    </div>
  </div>;
}
