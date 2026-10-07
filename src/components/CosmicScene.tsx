import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { motion, useInView, useReducedMotion, useSpring } from 'motion/react';
import { ArrowUpRight, AudioLines } from 'lucide-react';
import type { EventItem } from '../types';
import { formatEventDate } from '../lib/calendar';
import './cosmic-scene.css';

const STARS = Array.from({ length: 28 }, (_, i) => ({ x: 28 + (i * 79) % 548, y: 22 + (i * 61) % 395, r: i % 7 === 0 ? 1.5 : .7 }));

/** Native SVG layers keep the installation light; moving groups pause offscreen. */
export default function CosmicScene({ onExplore, featured }: { onExplore: () => void; featured?: EventItem }) {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: .15 });
  const reduced = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const id = useId().replace(/:/g, '');
  const x = useSpring(0, { stiffness: 65, damping: 24 });
  const y = useSpring(0, { stiffness: 65, damping: 24 });
  const active = inView && pageVisible && !reduced;

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!active) { x.jump(0); y.jump(0); }
  }, [active, x, y]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!active || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - box.left) / box.width - .5) * 14);
    y.set(((event.clientY - box.top) / box.height - .5) * 11);
  };

  const traveler = (front = false) => <g clipPath={front ? `url(#${id}-front)` : undefined}>
    <g transform="translate(305 224) rotate(-29) scale(1 .47)">
      <g className="cosmos-orbiter cosmos-orbiter-primary" data-orbit-motion>
        <path d="M206 -119A238 238 0 0 1 238 0" stroke={`url(#${id}-trail)`} strokeWidth="1.7" />
        <g transform="translate(238 0)"><circle r="17" fill={`url(#${id}-point-glow)`} /><circle r="4.1" fill="#dec5ff" /><circle r="1.5" fill="#fff4e6" /></g>
      </g>
    </g>
  </g>;

  return <motion.div ref={root} className="cosmic-scene cosmic-installation" data-active={active} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .9, delay: .18 }} onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0); }}>
    <motion.div className="cosmos-art" style={{ x: reduced ? 0 : x, y: reduced ? 0 : y }} aria-hidden="true">
      <div className="cosmos-atmosphere" data-orbit-motion />
      <svg className="cosmos-map" viewBox="0 0 600 480" fill="none">
        <defs>
          <radialGradient id={`${id}-body`} cx=".29" cy=".19" r=".83"><stop stopColor="#554167" /><stop offset=".32" stopColor="#292036" /><stop offset=".74" stopColor="#11101c" /><stop offset="1" stopColor="#0c0b16" /></radialGradient>
          <linearGradient id={`${id}-rim`} x1="180" y1="95" x2="423" y2="342" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1dc" /><stop offset=".24" stopColor="#d4aaff" /><stop offset=".52" stopColor="#865ac5" stopOpacity=".45" /><stop offset="1" stopColor="#231c36" stopOpacity=".2" /></linearGradient>
          <linearGradient id={`${id}-orbit`} x1="65" y1="340" x2="535" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#ad86ee" stopOpacity=".06" /><stop offset=".3" stopColor="#c5a3ff" stopOpacity=".75" /><stop offset=".53" stopColor="#fff1dc" /><stop offset=".72" stopColor="#b896ea" stopOpacity=".48" /><stop offset="1" stopColor="#a17fc6" stopOpacity=".06" /></linearGradient>
          <radialGradient id={`${id}-aura`}><stop offset=".56" stopColor="#b780ff" stopOpacity="0" /><stop offset=".66" stopColor="#c49aff" stopOpacity=".16" /><stop offset=".75" stopColor="#9f6adc" stopOpacity=".08" /><stop offset="1" stopColor="#9f6adc" stopOpacity="0" /></radialGradient>
          <linearGradient id={`${id}-surface`} x1="140" y1="100" x2="455" y2="344" gradientUnits="userSpaceOnUse"><stop stopColor="#e5c5ff" stopOpacity=".13" /><stop offset=".55" stopColor="#976cbf" stopOpacity=".02" /><stop offset="1" stopColor="#976cbf" stopOpacity="0" /></linearGradient>
          <linearGradient id={`${id}-trail`} x1="206" y1="-119" x2="238" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#e5c5ff" stopOpacity="0" /><stop offset="1" stopColor="#e5c5ff" stopOpacity=".85" /></linearGradient>
          <radialGradient id={`${id}-point-glow`}><stop stopColor="#dbc0ff" stopOpacity=".32" /><stop offset="1" stopColor="#dbc0ff" stopOpacity="0" /></radialGradient>
          <clipPath id={`${id}-planet`}><circle cx="305" cy="222" r="131" /></clipPath>
          <clipPath id={`${id}-front`}><path d="M0 393L600 61V480H0Z" /></clipPath>
        </defs>
        <g className="cosmos-starfield" fill="#d9ccec">{STARS.map((star, i) => <circle className={i % 7 === 0 ? 'cosmos-star-glint' : undefined} data-orbit-motion={i % 7 === 0 ? '' : undefined} style={{ animationDelay: `${i * -.37}s` }} key={i} cx={star.x} cy={star.y} r={star.r} opacity={.18 + (i % 4) * .14} />)}</g>
        <g stroke="#bd9de6" strokeWidth=".65"><ellipse cx="305" cy="226" rx="273" ry="139" transform="rotate(-29 305 226)" opacity=".13" /><ellipse cx="305" cy="226" rx="231" ry="100" transform="rotate(-29 305 226)" opacity=".2" /><circle cx="305" cy="226" r="190" strokeDasharray="1 12" opacity=".18" /></g>
        {traveler()}
        <g transform="translate(305 222) rotate(26) scale(1 .72)"><g className="cosmos-orbiter cosmos-orbiter-secondary" data-orbit-motion><circle cx="181" cy="0" r="2.1" fill="#8ebebd" /><circle cx="181" cy="0" r="8" fill="#8ebebd" opacity=".06" /></g></g>
        <circle className="cosmos-corona" data-orbit-motion cx="305" cy="222" r="205" fill={`url(#${id}-aura)`} />
        <circle cx="305" cy="222" r="132" fill={`url(#${id}-body)`} stroke={`url(#${id}-rim)`} strokeWidth="1.8" />
        <g clipPath={`url(#${id}-planet)`}>
          <g className="cosmos-surface" data-orbit-motion fill="none" stroke={`url(#${id}-surface)`}><path d="M130 122C191 32 388 45 496 152M124 151C190 59 391 72 492 181M126 179C189 89 391 101 493 210M134 209C192 120 392 131 490 239M151 239C207 155 389 160 478 267M173 268C226 195 381 194 457 292M204 294C249 237 366 231 429 316" strokeWidth="10" /></g>
          <g className="cosmos-light-drift" data-orbit-motion><ellipse cx="209" cy="98" rx="111" ry="130" transform="rotate(-34 209 98)" fill="#d3b0ff" opacity=".04" /></g>
        </g>
        <g className="cosmos-rim-light" data-orbit-motion><path d="M194 151A132 132 0 0 1 398 129" stroke="#f0d5ff" strokeWidth="3" opacity=".46" /><path d="M196 150A130 130 0 0 1 365 105" stroke="#fff0e1" strokeWidth="1.3" opacity=".94" /></g>
        <g stroke={`url(#${id}-orbit)`}>
          <path d="M 504 99 C 632 120 393 312 179 344 C -3 371 78 271 130 236" strokeWidth="1.4" />
          <path d="M 494 93 C 626 114 382 310 172 337 C -9 361 74 267 126 232" strokeWidth=".5" opacity=".35" />
        </g>
        {traveler(true)}
        <g transform="translate(226 116)"><g className="cosmos-core" data-orbit-motion><circle r="29" fill="#cfb1ff" opacity=".035" /><circle r="16" fill="#ead6ff" opacity=".065" /><path d="M0-15C2-3 3-2 15 0C3 2 2 3 0 15C-2 3-3 2-15 0C-3-2-2-3 0-15Z" fill="#fff2e5" /></g></g>
        <path d="M393 333H445L462 350" stroke="#b897dd" opacity=".35" strokeWidth=".7" /><circle cx="393" cy="333" r="2" fill="#b897dd" />
      </svg>
    </motion.div>
    <button className="cosmos-ticket" onClick={onExplore} type="button" aria-label={featured ? `Descubrir ${featured.title}` : 'Descubrir experiencias'}>
      <span className="cosmos-ticket-art" aria-hidden="true"><AudioLines size={23} strokeWidth={1.3} /></span>
      <span className="cosmos-ticket-copy"><span className="cosmos-ticket-kicker">TU PRÓXIMA EXPERIENCIA</span><strong>{featured?.title || 'Un universo por descubrir'}</strong><span className="cosmos-ticket-meta">{featured ? formatEventDate(featured.date, { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase() : 'EXPLORÁ'} <i /> {featured?.category || 'Conectá sin límites'}</span></span>
      <span className="cosmos-ticket-arrow"><ArrowUpRight size={20} strokeWidth={1.5} /></span>
    </button>
  </motion.div>;
}
