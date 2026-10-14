import { useEffect, useRef } from 'react';
import './tour-nebula.css';

const STAR_COUNT = 60;
const STAR_SEED = 0x5ce7a3;
const MOTION_KEY = 'supernova-universe-motion-v1';
const MOTION_EVENT = 'supernova:background-motion';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const DIAGNOSTIC_INTERVAL_MS = 300;

type BackdropMotion = 'running' | 'paused' | 'reduced';
type Star = {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
  drift: number;
};

// The same Mulberry32 seed and sampling order as Supernova Tour.
function buildStars(): Star[] {
  let state = STAR_SEED >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };

  return Array.from({ length: STAR_COUNT }, () => ({
    x: random(),
    y: random(),
    radius: 0.5 + random() * 1.1,
    baseOpacity: 0.2 + random() * 0.6,
    twinkleSpeed: 0.4 + random() * 0.9,
    phase: random() * Math.PI * 2,
    drift: (random() - 0.5) * 0.01,
  }));
}

function readInitialPause() {
  try {
    return JSON.parse(localStorage.getItem(MOTION_KEY) ?? 'false') === true;
  } catch {
    return false;
  }
}

/** Controls the first-HTML backdrop without replacing its persistent DOM. */
export default function TourNebulaBackdrop() {
  const clock = useRef({ elapsedSeconds: 0, frame: 0, diagnosticMs: 0 });

  useEffect(() => {
    const backdrop = document.getElementById('tour-nebula-backdrop');
    const svg = backdrop?.querySelector<SVGSVGElement>('.tour-nebula-stars');
    if (!backdrop || !svg) return;

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stars = buildStars();
    const circles = stars.map((star) => {
      const circle = document.createElementNS(SVG_NAMESPACE, 'circle');
      circle.setAttribute('r', String(star.radius));
      return circle;
    });
    svg.replaceChildren(...circles);
    backdrop.dataset.starCount = String(STAR_COUNT);
    backdrop.dataset.frame = String(clock.current.frame);

    let width = 1;
    let height = 1;
    let frame = 0;
    let lastFrameTime: number | null = null;
    let userPaused = readInitialPause();
    let motion: BackdropMotion | null = null;
    let disposed = false;

    function paintStars(staticMotion = false) {
      const elapsed = clock.current.elapsedSeconds;
      stars.forEach((star, index) => {
        const twinkle = 0.5 + 0.5 * Math.sin(star.phase + elapsed * star.twinkleSpeed);
        const alpha = staticMotion ? star.baseOpacity : Math.min(1, star.baseOpacity * (0.4 + twinkle));
        const x = staticMotion ? star.x : (((star.x + elapsed * star.drift) % 1) + 1) % 1;
        circles[index].style.opacity = String(alpha);
        circles[index].style.transform = `translateX(${((x - star.x) * width).toFixed(3)}px)`;
      });
    }

    function resize() {
      width = Math.max(1, backdrop!.clientWidth || window.innerWidth);
      height = Math.max(1, backdrop!.clientHeight || window.innerHeight);
      svg!.setAttribute('viewBox', `0 0 ${width} ${height}`);
      stars.forEach((star, index) => {
        circles[index].setAttribute('cx', String(star.x * width));
        circles[index].setAttribute('cy', String(star.y * height));
      });
      paintStars(motion === 'reduced');
    }

    function renderFrame(now: number) {
      frame = 0;
      if (disposed || motion !== 'running') return;
      const deltaMs = lastFrameTime === null ? 0 : Math.max(0, now - lastFrameTime);
      lastFrameTime = now;
      clock.current.elapsedSeconds += deltaMs / 1000;
      clock.current.frame += 1;
      clock.current.diagnosticMs += deltaMs;
      paintStars();
      if (clock.current.diagnosticMs >= DIAGNOSTIC_INTERVAL_MS) {
        backdrop!.dataset.frame = String(clock.current.frame);
        clock.current.diagnosticMs %= DIAGNOSTIC_INTERVAL_MS;
      }
      frame = requestAnimationFrame(renderFrame);
    }

    function syncMotion() {
      const experience = document.documentElement.dataset.experience;
      const spatial = experience === '3d' || experience === 'hybrid';
      const next: BackdropMotion = motionMedia.matches ? 'reduced'
        : userPaused || document.hidden || !spatial ? 'paused' : 'running';
      if (motion === next || disposed) return;

      if (next !== 'running') {
        cancelAnimationFrame(frame);
        frame = 0;
        lastFrameTime = null;
      }
      motion = next;
      backdrop!.dataset.motion = next;

      if (next === 'reduced') {
        paintStars(true);
      } else if (next === 'running') {
        paintStars();
        frame = requestAnimationFrame(renderFrame);
      }
    }

    function handleUserMotion(event: Event) {
      const detail = (event as CustomEvent<{ paused?: unknown }>).detail;
      if (!detail || typeof detail.paused !== 'boolean') return;
      userPaused = detail.paused;
      syncMotion();
    }

    resize();
    syncMotion();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(backdrop);
    const experienceObserver = new MutationObserver(() => {
      syncMotion();
      resize();
    });
    experienceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-experience'] });
    motionMedia.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMotion);
    window.addEventListener(MOTION_EVENT, handleUserMotion);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      experienceObserver.disconnect();
      motionMedia.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncMotion);
      window.removeEventListener(MOTION_EVENT, handleUserMotion);
      backdrop.dataset.motion = motionMedia.matches ? 'reduced' : 'paused';
      svg.replaceChildren();
    };
  }, []);

  return null;
}
