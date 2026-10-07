import { useId } from 'react';

const STARS = Array.from({ length: 46 }, (_, index) => ({
  x: (index * 37 + 11) % 101,
  y: (index * 53 + 7) % 101,
  size: index % 9 === 0 ? 2 : 1,
  opacity: .12 + (index % 5) * .065,
}));

export const INTRO_SOURCES = [
  { x: 79, y: 190, color: 'var(--intro-point-violet)' },
  { x: 401, y: 190, color: 'var(--intro-point-warm)' },
  { x: 240, y: 46, color: 'var(--intro-mint)' },
  { x: 240, y: 334, color: 'var(--intro-point-lilac)' },
];

/** Shared first frame and cinematic artwork. This module never imports GSAP. */
export default function IntroArtwork() {
  const id = useId().replace(/:/g, '');

  return <>
    <div className="intro-nebula" data-intro="halo" aria-hidden="true" />
    <div className="intro-stars" aria-hidden="true">
      {STARS.map((star, index) => <i key={index} style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, opacity: star.opacity }} />)}
    </div>
    <div className="intro-composition" data-intro="composition" aria-hidden="true">
      <div className="intro-orbital-system">
        <svg className="intro-orbital-map" viewBox="0 0 480 380" fill="none">
          <defs>
            <radialGradient id={`${id}-radiance`}><stop stopColor="var(--intro-radiance)" stopOpacity=".28" /><stop offset=".45" stopColor="var(--intro-radiance-alt)" stopOpacity=".08" /><stop offset="1" stopColor="var(--intro-orbit-low)" stopOpacity="0" /></radialGradient>
            <linearGradient id={`${id}-orbit`} x1="89" y1="291" x2="391" y2="89" gradientUnits="userSpaceOnUse"><stop stopColor="var(--intro-orbit-low)" stopOpacity=".04" /><stop offset=".45" stopColor="var(--intro-orbit)" stopOpacity=".6" /><stop offset="1" stopColor="var(--intro-orbit-low)" stopOpacity=".08" /></linearGradient>
          </defs>
          <circle data-intro="radiance" cx="240" cy="190" r="150" fill={`url(#${id}-radiance)`} opacity=".27" />
          <g data-intro="orbits" stroke={`url(#${id}-orbit)`} strokeWidth=".8">
            <ellipse cx="240" cy="190" rx="181" ry="94" transform="rotate(-27 240 190)" />
            <ellipse cx="240" cy="190" rx="163" ry="80" transform="rotate(27 240 190)" />
            <circle cx="240" cy="190" r="126" stroke="var(--intro-orbit)" strokeOpacity=".1" strokeDasharray="1 12" />
            <path d="M67 270H118M361 112H413" stroke="var(--intro-accent)" strokeOpacity=".22" />
            <circle cx="87" cy="271" r="2" fill="var(--intro-accent)" stroke="none" />
            <circle cx="392" cy="111" r="2" fill="var(--intro-mint)" stroke="none" />
          </g>
          {INTRO_SOURCES.map((point, index) => <g key={index} data-intro="point" data-intro-point={index}><circle cx={point.x} cy={point.y} r="15" fill={point.color} opacity=".035" /><circle cx={point.x} cy={point.y} r="5" fill={point.color} opacity=".1" /><circle cx={point.x} cy={point.y} r="2.2" fill={point.color} /></g>)}
          <g transform="translate(192 142) scale(2.4)"><g data-intro="symbol"><path d="M20 3c0 12-5 17-17 17 12 0 17 5 17 17 0-12 5-17 17-17C25 20 20 15 20 3Z" fill="var(--intro-accent)" /><circle cx="20" cy="20" r="17" stroke="var(--intro-accent)" strokeWidth=".6" opacity=".5" /></g></g>
        </svg>
        <span className="intro-orbital-label">CONEXIONES EN ÓRBITA</span>
      </div>
      <div className="intro-identity">
        <div className="intro-wordmark-mask"><div className="intro-wordmark" data-intro="wordmark">supernova</div></div>
        <div className="intro-tagline" data-intro="tagline">conectá sin límites</div>
      </div>
      <div className="intro-caption" data-intro="caption"><span />UN UNIVERSO DE EXPERIENCIAS<span /></div>
    </div>
  </>;
}
