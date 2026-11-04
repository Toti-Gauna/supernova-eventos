import { useId, useRef, useState } from 'react';
import { Moon, Settings, Sun, X } from 'lucide-react';
import type { Theme } from '../../hooks/useTheme';
import VersionList from '../../versions/VersionSwitcher';
import './settings-menu.css';

interface Props { theme: Theme; onThemeToggle: () => void }

/** One compact header menu for the two demo-wide settings: theme and version. */
export default function SettingsMenu({ theme, onThemeToggle }: Props) {
  const id = `header-settings-${useId().replace(/:/g, '')}`;
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const dark = theme === 'dark';

  function close() {
    popover.current?.hidePopover();
    trigger.current?.focus({ preventScroll: true });
  }

  return <>
    <button ref={trigger} type="button" className="header-icon-button settings-trigger icon-only" aria-label="Ajustes" title="Tema y versión" aria-expanded={open} aria-controls={id} popoverTarget={id}>
      <Settings size={19} aria-hidden="true" />
    </button>
    <div ref={popover} id={id} className="header-popover settings-popover" popover="auto" aria-labelledby={`${id}-title`} onToggle={event => setOpen((event.nativeEvent as ToggleEvent).newState === 'open')}>
      <div className="popover-heading"><h2 id={`${id}-title`}>Ajustes</h2><button type="button" className="popover-close icon-only" aria-label="Cerrar ajustes" onClick={close}><X size={16} aria-hidden="true" /></button></div>
      <button type="button" role="switch" aria-checked={dark} className="settings-theme" onClick={onThemeToggle}>
        <span className="settings-theme-icon" aria-hidden="true">{dark ? <Moon size={18} /> : <Sun size={18} />}</span>
        <span className="settings-theme-copy"><strong>Modo oscuro</strong><small aria-hidden="true">{dark ? 'Activado' : 'Desactivado'}</small></span>
        <span className="settings-switch" aria-hidden="true"><i /></span>
      </button>
      <h3 className="settings-label">Versión</h3>
      <VersionList />
    </div>
  </>;
}
