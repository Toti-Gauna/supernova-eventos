import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Bell, Check, ChevronDown, Heart, LayoutGrid, LogOut, Moon, Settings2, Sun, Ticket, UserRound, X } from 'lucide-react';
import type { AppView, Registration } from '../types';
import type { Theme } from '../hooks/useTheme';
import Brand from './Brand';

interface Props {
  view: AppView;
  onNavigate: (view: AppView) => void;
  registrations: Registration[];
  favoriteCount: number;
  onLogout: () => void;
  theme: Theme;
  onThemeToggle: () => void;
}
const navigation = [
  { view: 'explore' as const, label: 'Explorar', Icon: LayoutGrid },
  { view: 'registrations' as const, label: 'Mis eventos', Icon: Ticket },
  { view: 'favorites' as const, label: 'Favoritos', Icon: Heart },
  { view: 'admin' as const, label: 'Admin', Icon: Settings2 },
];

export default function Header({ view, onNavigate, registrations, favoriteCount, onLogout, theme, onThemeToggle }: Props) {
  const [scrolled, setScrolled] = useState(window.scrollY > 45);
  const notifications = useRef<HTMLDivElement>(null);
  const profile = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 45);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  function navigate(next: AppView) {
    notifications.current?.hidePopover();
    profile.current?.hidePopover();
    onNavigate(next);
  }

  return <header className={`site-header ${scrolled ? 'header-floating' : ''}`}>
    <div className="header-inner">
      <motion.div className="header-surface" aria-hidden="true" initial={false} animate={{ opacity: scrolled ? 1 : 0, scaleX: scrolled ? 1 : .985, y: scrolled ? 0 : -3 }} transition={{ duration: .5, ease: [.22, 1, .36, 1] }} />
      <button className="brand-button" onClick={() => navigate('explore')} aria-label="Supernova, ir a inicio"><Brand /></button>
      <nav className="main-nav" aria-label="Navegación principal">
        {navigation.map(({ view: destination, label, Icon }) => {
          const count = destination === 'registrations' ? registrations.length : destination === 'favorites' ? favoriteCount : 0;
          return <button key={destination} className={`${view === destination ? 'active' : ''} ${destination === 'admin' ? 'mobile-admin-tab' : ''}`} aria-label={destination === 'admin' ? 'Administrar' : undefined} aria-current={view === destination ? 'page' : undefined} onClick={() => navigate(destination)}>
            {view === destination && <motion.span className="nav-active-surface" layoutId="header-active-tab" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
            <Icon size={15} /><span>{label}</span>{count > 0 && <span className="nav-count" aria-label={`${count} ${destination === 'registrations' ? 'inscripciones' : 'guardados'}`}>{count}</span>}
          </button>;
        })}
      </nav>
      <div className="header-actions">
        <button className={`admin-link ${view === 'admin' ? 'active' : ''}`} aria-label="Administrar" aria-current={view === 'admin' ? 'page' : undefined} onClick={() => navigate('admin')}><Settings2 size={16} /><span>Administrar</span></button>
        <span className="header-divider" aria-hidden="true" />
        <button className="theme-toggle" type="button" onClick={onThemeToggle} aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} aria-pressed={theme === 'light'}>
          <AnimatePresence mode="wait" initial={false}><motion.span key={theme} initial={{ opacity: 0, rotate: -45, scale: .8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 45, scale: .8 }} transition={{ duration: .14 }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</motion.span></AnimatePresence>
        </button>
        <button className="notification-button" aria-label="Notificaciones" popoverTarget="header-notifications"><Bell size={18} />{registrations.length > 0 && <span />}</button>
        <button className="profile-button" aria-label="Abrir perfil de Alex García" popoverTarget="header-profile"><span>AG</span><ChevronDown size={13} /></button>
      </div>
    </div>
    <div ref={notifications} id="header-notifications" className="header-popover notifications-popover" popover="auto">
      <div className="popover-heading"><h3>Notificaciones</h3><button className="popover-close" popoverTarget="header-notifications" popoverTargetAction="hide" aria-label="Cerrar panel"><X size={16} /></button></div>
      <div className="notification-item"><span>{registrations.length ? <Check size={16} /> : <Bell size={16} />}</span><div><strong>{registrations.length ? `${registrations.length} experiencia${registrations.length > 1 ? 's' : ''} confirmada${registrations.length > 1 ? 's' : ''}` : 'Todo al día'}</strong><p>{registrations.length ? 'Tus pases ya están en tu agenda.' : 'Tus próximas conexiones empiezan en Explorar.'}</p></div></div>
      <button className="popover-action" onClick={() => navigate(registrations.length ? 'registrations' : 'explore')}>{registrations.length ? 'Ver mis eventos' : 'Explorar experiencias'}<ArrowUpRight size={15} /></button>
    </div>
    <div ref={profile} id="header-profile" className="header-popover profile-popover" popover="auto">
      <div className="profile-identity"><span className="profile-large">AG</span><div><strong>Alex García</strong><small>Telefónica · Demo</small></div><button className="popover-close" popoverTarget="header-profile" popoverTargetAction="hide" aria-label="Cerrar panel"><X size={16} /></button></div>
      <div className="profile-menu">
        <button className="popover-action" onClick={() => navigate('profile')}><UserRound size={16} /><span>Ver mi perfil</span><ArrowUpRight size={14} /></button>
        <button className="popover-action logout-action" onClick={() => { profile.current?.hidePopover(); onLogout(); }}><LogOut size={16} /><span>Cerrar sesión</span></button>
      </div>
    </div>
  </header>;
}
