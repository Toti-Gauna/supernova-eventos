import { ArrowUpRight, Bell, Building2, Heart, LogOut, Mail, ShieldCheck, Ticket } from 'lucide-react';
import type { AppView } from '../../../../types';
import BackButton from '../../../../components/ui/BackButton';
import { initials, useAccessProfile } from '../../../../features/access/access';
import '../../../../features/profile/profile.css';

interface Props { subscribed: boolean; registrations: number; favorites: number; onSubscribe: () => void; onLogout: () => void; onBack?: () => void; onNavigate?: (view: AppView) => void }

/** Account card: identity, access, shortcuts, preferences and a clear sign out, in one screen. */
export default function Profile({ subscribed, registrations, favorites, onSubscribe, onLogout, onBack, onNavigate }: Props) {
  const access = useAccessProfile();
  const internal = access.kind === 'internal';
  const stats = [
    { view: 'registrations' as const, Icon: Ticket, value: registrations, label: registrations === 1 ? 'pase' : 'pases' },
    { view: 'favorites' as const, Icon: Heart, value: favorites, label: favorites === 1 ? 'favorito' : 'favoritos' },
  ];
  return <section className="profile-page account-page section-container" aria-labelledby="profile-title">
    <header className="account-head">
      {onBack && <BackButton onBack={onBack} iconOnly />}
      <h1 id="profile-title">Mi perfil</h1>
    </header>
    <div className="profile-page-grid account-grid">
      <article className={`profile-details-card account-card ${internal ? 'is-internal' : 'is-external'}`} aria-labelledby="account-name">
        <div className="account-identity">
          <span className="account-avatar num-pill" aria-hidden="true">{initials(access.name)}</span>
          <div className="account-identity-copy">
            <h2 id="account-name">{access.name}</h2>
            <p><span className="account-kind-pill">{internal ? 'Personal interno' : 'Personal externo'}</span><span className="account-org">{access.organization}</span></p>
          </div>
        </div>
        <dl className="account-facts">
          <div><dt><Mail size={16} aria-hidden="true" />{internal ? 'Email corporativo' : 'Email'}</dt><dd>{access.email}</dd></div>
          <div><dt><Building2 size={16} aria-hidden="true" />{internal ? 'Compañía' : 'Organización'}</dt><dd>{access.organization}</dd></div>
          <div><dt><ShieldCheck size={16} aria-hidden="true" />Acceso</dt><dd>{internal ? 'Cuenta corporativa · demo' : 'Invitación externa · demo'}</dd></div>
        </dl>
        <div className="account-stats">
          {stats.map(({ view, Icon, value, label }) => onNavigate
            ? <button key={view} type="button" className="account-stat" onClick={() => onNavigate(view)}><Icon size={18} aria-hidden="true" /><strong className="num-pill">{value}</strong><span>{label}</span><ArrowUpRight size={16} aria-hidden="true" /></button>
            : <span key={view} className="account-stat"><Icon size={18} aria-hidden="true" /><strong className="num-pill">{value}</strong><span>{label}</span></span>)}
        </div>
      </article>
      <section className="profile-preferences-card account-prefs" aria-labelledby="account-prefs-title">
        <h2 id="account-prefs-title">Preferencias</h2>
        <label className="account-pref">
          <span className="account-pref-icon" aria-hidden="true"><Bell size={18} /></span>
          <span className="account-pref-copy"><strong>Novedades de experiencias</strong><small>Te avisamos cuando haya planes nuevos.</small></span>
          <input className="account-switch" type="checkbox" role="switch" aria-label="Recibir novedades de experiencias" checked={subscribed} onChange={onSubscribe} />
        </label>
        <p className="account-note">Guardado en este navegador. Es una demo: no enviamos emails.</p>
        <button type="button" className="profile-logout account-logout" onClick={onLogout}><LogOut size={18} aria-hidden="true" />Cerrar sesión</button>
      </section>
    </div>
  </section>;
}
