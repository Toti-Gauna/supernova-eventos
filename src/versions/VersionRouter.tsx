import { lazy, Suspense } from 'react';
import { versionHref } from './catalog';
import './versions.css';

const OriginalApp = lazy(() => import('./original/App'));
const SpatialApp = lazy(() => import('../App'));

function Versions() {
  return <main className="versions-page">
    <a className="versions-brand" href={versionHref('3d')}>✦ supernova</a>
    <span className="eyebrow">TRES FORMAS DE ENTRAR EN ÓRBITA</span>
    <h1>Elegí tu universo.</h1>
    <p>Tres experiencias independientes, con los mismos eventos de demostración.</p>
    <div className="versions-grid">
      {([
        ['original', '01', 'Original', 'La interfaz original, con sus ilustraciones, colores y recorrido clásico.'],
        ['3d', '02', 'Universo 3D', 'Planetas volumétricos, cámara espacial y una nave para crear experiencias.'],
        ['hybrid', '03', 'Órbitas · 2D + 3D', 'Ilustraciones en capas, profundidad real y viajes entre planetas.'],
      ] as const).map(([version, number, title, description]) => <a key={version} className={`version-card version-${version}`} href={versionHref(version)}>
        <div className="version-preview" aria-hidden="true"><i /><span>✦</span></div>
        <span className="eyebrow">{number}</span><h2>{title}</h2><p>{description}</p><strong>Entrar <span aria-hidden="true">↗</span></strong>
      </a>)}
    </div>
    <small>Datos ficticios · Guardado local en este navegador</small>
  </main>;
}

export default function VersionRouter() {
  const segment = location.pathname.replace(/\/+$/, '').split('/').pop();
  const version = segment === 'original' ? 'original' : segment === 'hibrida' ? 'hybrid' : '3d';
  const chooser = segment === 'versiones';
  document.documentElement.dataset.experience = chooser ? 'versions' : version;
  if (chooser) {
    document.getElementById('intro-bootstrap')?.remove();
    document.getElementById('intro-bootstrap-note')?.remove();
    return <Versions />;
  }
  return <Suspense fallback={null}>{version === 'original' ? <OriginalApp /> : <SpatialApp variant={version} />}</Suspense>;
}
