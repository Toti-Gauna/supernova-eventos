import { Bell, Building2, Heart, LogOut, Mail, ShieldCheck, Ticket } from 'lucide-react';

interface Props { subscribed: boolean; registrations: number; favorites: number; onSubscribe: () => void; onLogout: () => void }

export default function Profile({ subscribed, registrations, favorites, onSubscribe, onLogout }: Props) {
  return <section className="profile-page section-container">
    <div className="profile-page-heading"><span className="eyebrow">TU ESPACIO EN SUPERNOVA</span><h1>Mi perfil</h1><p>Las conexiones empiezan con vos.</p></div>
    <div className="profile-page-grid"><div className="profile-details-card">
      <div className="profile-person"><span>AG</span><div><h2>Alex García</h2><p>Colaborador · Perfil de demostración</p></div></div>
      <dl><div><dt><Mail size={15} /> Email corporativo</dt><dd>alex.garcia@demo.telefonica.test</dd></div><div><dt><Building2 size={15} /> Compañía</dt><dd>Telefónica</dd></div><div><dt><ShieldCheck size={15} /> Acceso</dt><dd>Demostración local</dd></div></dl>
      <div className="profile-stats"><span><Ticket size={16} /><strong>{registrations}</strong> experiencias confirmadas</span><span><Heart size={16} /><strong>{favorites}</strong> favoritos</span></div>
    </div><div className="profile-preferences-card"><h2>A tu manera.</h2><p>Elegí cómo querés estar conectado.</p>
      <label className="profile-preference supernova-toggle"><span><Bell size={18} /><span><strong>Novedades de experiencias</strong><small>Tu preferencia se guarda en este navegador.</small></span></span><input type="checkbox" role="switch" aria-label="Recibir novedades de experiencias" checked={subscribed} onChange={onSubscribe} /></label>
      <button className="profile-logout" onClick={onLogout}><LogOut size={16} /> Cerrar sesión</button>
    </div></div>
  </section>;
}
