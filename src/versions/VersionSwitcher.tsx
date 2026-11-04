import { Check } from 'lucide-react';
import { versionHref, type ExperienceVersion } from './catalog';
import './version-switcher.css';

export const experienceVersions: { value: ExperienceVersion; label: string; description: string }[] = [
  { value: 'original', label: 'Original', description: 'El recorrido clásico' },
  { value: '3d', label: '3D', description: 'Planetas y nave en 3D' },
  { value: 'hybrid', label: '2D + 3D', description: 'Arte ilustrado y cámara espacial' },
  { value: 'commercial', label: 'Comercial', description: 'Estética Personal, sin espacio' },
];

export function currentExperienceVersion() {
  return experienceVersions.find(version => version.value === document.documentElement.dataset.experience) ?? experienceVersions[1];
}

/** The four versions as links. Lives inside the header settings menu; the session and
    the saved data travel with the browser storage, so switching keeps them. */
export default function VersionList() {
  const current = currentExperienceVersion();
  return <nav className="version-list" aria-label="Versiones de Órbita">
    {experienceVersions.map(version => <a key={version.value} className={`version-option version-option-${version.value}`} href={versionHref(version.value)} aria-current={version.value === current.value ? 'page' : undefined}>
      <span className="version-swatch" aria-hidden="true" />
      <span className="version-copy"><strong>{version.label}</strong><small>{version.description}</small></span>
      {version.value === current.value && <Check size={16} aria-hidden="true" />}
    </a>)}
  </nav>;
}
