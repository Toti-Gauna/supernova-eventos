import { Bell, Building2, Heart, LogOut, Mail, Pause, Play, ShieldCheck, Ticket } from 'lucide-react';
import UniverseSurface from '../universe/UniverseSurface';
import type { UniverseStatus } from '../universe/contracts';
import BackButton from '../../components/ui/BackButton';
import { initials, useAccessProfile } from '../access/access';

interface Props { subscribed: boolean; registrations: number; favorites: number; onSubscribe: () => void; onLogout: () => void; motionPaused: boolean; onMotionToggle: () => void; universeStatus: UniverseStatus; onUniverseRetry: () => void; onBack?: () => void }

export default function Profile({ subscribed, registrations, favorites, onSubscribe, onLogout, motionPaused, onMotionToggle, universeStatus, onUniverseRetry, onBack }: Props) {
  const access = useAccessProfile();
  const internal = access.kind === 'internal';
  return <section className="profile-page section-container">
    {onBack && <BackButton onBack={onBack} />}
    <header className="profile-page-heading compact-section-heading planet-left">
      <UniverseSurface side="left" compact />
      <div className="compact-heading-content"><div className="compact-heading-copy"><h1>Mi perfil</h1><p>Tu espacio en Órbita.</p></div></div>
    </header>
    <div className="profile-page-grid"><div className="profile-details-card">
      <div className="profile-person"><span>{initials(access.name)}</span><div><h2>{access.name}</h2><p>{internal ? 'Personal interno' : 'Personal externo'} · Perfil de demostración</p></div></div>
      <dl><div><dt><Mail size={15} /> {internal ? 'Email corporativo' : 'Email'}</dt><dd>{access.email}</dd></div><div><dt><Building2 size={15} /> {internal ? 'Compañía' : 'Organización'}</dt><dd>{access.organization}</dd></div><div><dt><ShieldCheck size={15} /> Acceso</dt><dd>{internal ? 'Cuenta corporativa · demostración' : 'Invitación externa · demostración'}</dd></div></dl>
      <div className="profile-stats"><span><Ticket size={16} /><strong>{registrations}</strong> experiencias confirmadas</span><span><Heart size={16} /><strong>{favorites}</strong> favoritos</span></div>
    </div><div className="profile-preferences-card"><h2>A tu manera.</h2><p>Elegí cómo querés estar conectado.</p>
      <label className="profile-preference supernova-toggle"><span><Bell size={18} /><span><strong>Novedades de experiencias</strong><small>Tu preferencia se guarda en este navegador.</small></span></span><input type="checkbox" role="switch" aria-label="Recibir novedades de experiencias" checked={subscribed} onChange={onSubscribe} /></label>
      <div className="profile-motion-preference"><div><strong>El universo, a tu ritmo.</strong><small>Podés dejar el fondo quieto y seguir explorando.</small></div><button type="button" className="button secondary" aria-pressed={motionPaused} onClick={onMotionToggle}>{motionPaused ? <Play size={15} /> : <Pause size={15} />}{motionPaused ? 'Reanudar movimiento' : 'Pausar movimiento'}</button></div>
      {(universeStatus === 'fallback' || universeStatus === 'context-lost') && <div className="profile-motion-preference"><div><strong>El ambiente está en modo estático.</strong><small>Podés volver a cargarlo y seguir desde acá.</small></div><button type="button" className="button secondary" onClick={onUniverseRetry}>Reintentar ambiente</button></div>}
      <button className="profile-logout" onClick={onLogout}><LogOut size={16} /> Cerrar sesión</button>
    </div></div>
  </section>;
}
