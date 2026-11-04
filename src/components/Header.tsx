import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Bell, Compass, Heart, LayoutDashboard, Ticket } from 'lucide-react';
import type { AppView, EventItem, Registration } from '../types';
import type { Theme } from '../hooks/useTheme';
import { initials, useAccessProfile } from '../features/access/access';
import Brand from './Brand';
import SettingsMenu from './ui/SettingsMenu';
import { NotificationsPopover, ProfilePopover, consumeHeaderFocus, findNextPass, hasHeaderFocusRequest, plural, requestHeaderFocus, type NextPass } from './HeaderPopovers';
import './header-shell.css';

interface Props {
  view: AppView;
  onNavigate: (view: AppView) => void;
  registrations: Registration[];
  favoriteCount: number;
  onLogout: () => void;
  theme: Theme;
  onThemeToggle: () => void;
  /** Optional: with the events, the notifications show the next pass and open it. */
  events?: EventItem[];
  onOpenEvent?: (event: EventItem, sessionId?: string) => void;
}
const navigation = [
  { view: 'explore' as const, label: 'Explorar', Icon: Compass },
  { view: 'registrations' as const, label: 'Mis eventos', Icon: Ticket },
  { view: 'favorites' as const, label: 'Favoritos', Icon: Heart },
  { view: 'admin' as const, label: 'Admin', Icon: LayoutDashboard },
];

export default function Header({ view, onNavigate, registrations, favoriteCount, onLogout, theme, onThemeToggle, events, onOpenEvent }: Props) {
  const access = useAccessProfile();
  const internal = access.kind === 'internal';
  const [scrolled, setScrolled] = useState(() => window.scrollY > 45);
  const [open, setOpen] = useState<'notifications' | 'profile' | null>(null);
  const notifications = useRef<HTMLDivElement>(null);
  const profile = useRef<HTMLDivElement>(null);
  const notificationsTrigger = useRef<HTMLButtonElement>(null);
  const nextPass = findNextPass(events, registrations, access);
  const items = navigation.filter(item => internal || item.view !== 'admin');
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 45);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!hasHeaderFocusRequest()) return;
    const frame = requestAnimationFrame(() => { if (consumeHeaderFocus()) notificationsTrigger.current?.focus({ preventScroll: true }); });
    return () => cancelAnimationFrame(frame);
  }, []);
  function closePopovers() {
    notifications.current?.hidePopover();
    profile.current?.hidePopover();
  }
  function navigate(next: AppView) {
    closePopovers();
    onNavigate(next);
  }
  function openPass(pass: NextPass) {
    closePopovers();
    requestHeaderFocus();
    onOpenEvent?.(pass.event, pass.sessionId);
  }
  const toggled = (name: 'notifications' | 'profile') => (isOpen: boolean) => setOpen(current => isOpen ? name : current === name ? null : current);

  return <header className={`site-header ${scrolled ? 'header-floating' : ''}`}>
    <div className="header-inner">
      <motion.div className="header-surface" aria-hidden="true" initial={false} animate={{ opacity: scrolled ? 1 : 0, scaleX: scrolled ? 1 : .985, y: scrolled ? 0 : -3 }} transition={{ duration: .4, ease: [.22, 1, .36, 1] }} />
      <button type="button" className="brand-button" data-universe-target="section:explore" onClick={() => navigate('explore')} aria-label="Órbita, ir a inicio"><Brand /></button>
      <nav className="main-nav" aria-label="Navegación principal" style={{ '--nav-tabs': items.length } as CSSProperties}>
        {items.map(({ view: destination, label, Icon }) => {
          const count = destination === 'registrations' ? registrations.length : destination === 'favorites' ? favoriteCount : 0;
          const active = view === destination;
          return <button key={destination} type="button" data-universe-target={`section:${destination}`} className={`${active ? 'active' : ''} ${destination === 'admin' ? 'mobile-admin-tab' : ''}`} aria-label={destination === 'admin' ? 'Administrar' : undefined} aria-current={active ? 'page' : undefined} onClick={() => navigate(destination)}>
            {active && <motion.span className="nav-active-surface" layoutId="header-active-tab" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
            <span className="nav-icon" aria-hidden="true"><Icon size={17} />{count > 0 && <span className="nav-count num-pill">{count > 99 ? '99+' : count}</span>}</span>
            <span className="nav-label">{label}</span>
            {count > 0 && <span className="sr-only"> ({destination === 'registrations' ? plural(count, 'pase', 'pases') : plural(count, 'guardado', 'guardados')})</span>}
          </button>;
        })}
      </nav>
      <div className="header-actions">
        {internal && <button type="button" className={`admin-link ${view === 'admin' ? 'active' : ''}`} data-universe-target="section:admin" aria-label="Administrar" aria-current={view === 'admin' ? 'page' : undefined} onClick={() => navigate('admin')}><LayoutDashboard size={17} aria-hidden="true" /><span>Administrar</span></button>}
        {internal && <span className="header-divider" aria-hidden="true" />}
        <SettingsMenu theme={theme} onThemeToggle={onThemeToggle} />
        <button ref={notificationsTrigger} type="button" className="header-icon-button notification-button icon-only" aria-label="Notificaciones" aria-expanded={open === 'notifications'} aria-controls="header-notifications" popoverTarget="header-notifications">
          <Bell size={19} aria-hidden="true" />{nextPass && <span className="notification-dot" aria-hidden="true" />}
        </button>
        <button type="button" className={`profile-button ${view === 'profile' ? 'is-current' : ''}`} aria-label={`Abrir perfil de ${access.name}`} aria-expanded={open === 'profile'} aria-controls="header-profile" popoverTarget="header-profile">
          <span className="account-avatar num-pill" aria-hidden="true">{initials(access.name)}</span>
        </button>
      </div>
    </div>
    <NotificationsPopover popover={notifications} registrations={registrations} nextPass={nextPass} onNavigate={navigate} onOpenPass={onOpenEvent ? openPass : undefined} onToggle={toggled('notifications')} universeTargets />
    <ProfilePopover popover={profile} access={access} onNavigate={navigate} onLogout={() => { profile.current?.hidePopover(); onLogout(); }} onToggle={toggled('profile')} universeTargets />
  </header>;
}
