import { Bell, Building2, Heart, LogOut, Mail, ShieldCheck, Ticket } from 'lucide-react';
import BackButton from '../../../../components/ui/BackButton';
import { initials, useAccessProfile } from '../../../../features/access/access';

interface Props { subscribed: boolean; registrations: number; favorites: number; onSubscribe: () => void; onLogout: () => void; onBack?: () => void }

export default function Profile({ subscribed, registrations, favorites, onSubscribe, onLogout, onBack }: Props) {
  const access = useAccessProfile();
  const internal = access.kind === 'internal';
  return <section className="profile-page section-container">
    {onBack && <BackButton onBack={onBack} />}
    <div className="profile-page-heading"><span className="eyebrow">TU ESPACIO EN ÓRBITA</span><h1>Mi perfil</h1><p>Las conexiones empiezan con vos.</p></div>
    <div className="profile-page-grid"><div className="profile-details-card">
      <div className="profile-person"><span>{initials(access.name)}</span><div><h2>{access.name}</h2><p>{internal ? 'Personal interno' : 'Personal externo'} · Perfil de demostración</p></div></div>
      <dl><div><dt><Mail size={15} /> {internal ? 'Email corporativo' : 'Email'}</dt><dd>{access.email}</dd></div><div><dt><Building2 size={15} /> {internal ? 'Compañía' : 'Organización'}</dt><dd>{access.organization}</dd></div><div><dt><ShieldCheck size={15} /> Acceso</dt><dd>{internal ? 'Cuenta corporativa · demostración' : 'Invitación externa · demostración'}</dd></div></dl>
      <div className="profile-stats"><span><Ticket size={16} /><strong>{registrations}</strong> experiencias confirmadas</span><span><Heart size={16} /><strong>{favorites}</strong> favoritos</span></div>
    </div><div className="profile-preferences-card"><h2>A tu manera.</h2><p>Elegí cómo querés estar conectado.</p>
      <label className="profile-preference supernova-toggle"><span><Bell size={18} /><span><strong>Novedades de experiencias</strong><small>Tu preferencia se guarda en este navegador.</small></span></span><input type="checkbox" role="switch" aria-label="Recibir novedades de experiencias" checked={subscribed} onChange={onSubscribe} /></label>
      <button className="profile-logout" onClick={onLogout}><LogOut size={16} /> Cerrar sesión</button>
    </div></div>
  </section>;
}
