import { useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import IntroArtwork, { INTRO_SOURCES } from './IntroArtwork';
import { getIntroElapsedSeconds, useIntroIsolation } from './introLifecycle';
import './intro.css';

interface CinematicIntroProps {
  onComplete: () => void;
}

/** A finite brand opening. The host decides refresh and replay behavior. */
export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);
  useIntroIsolation(stageRef, complete);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedTimer: ReturnType<typeof setTimeout> | undefined;
    const context = gsap.context(() => {
      if (preference.matches) {
        reducedTimer = setTimeout(complete, Math.max(0, 150 - getIntroElapsedSeconds() * 1000));
        return;
      }

      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: complete });
      timeline
        .fromTo('[data-intro="halo"]', { opacity: .2, scale: .85 }, { opacity: 1, scale: 1, duration: 1.3 }, 0)
        .fromTo('[data-intro="orbits"]', { opacity: 0, scale: .84, rotation: -17, svgOrigin: '240 190' }, { opacity: 1, scale: 1, rotation: 0, duration: 1.35 }, 0)
        .fromTo('[data-intro="point"]', { opacity: 0 }, { opacity: 1, duration: .35, stagger: .025 }, .2)
        .to('[data-intro="point"]', { x: (index: number) => 240 - INTRO_SOURCES[index].x, y: (index: number) => 190 - INTRO_SOURCES[index].y, duration: 1.08, stagger: .02, ease: 'power3.inOut' }, .32)
        .to('[data-intro="point"]', { opacity: 0, duration: .24 }, 1.3)
        .fromTo('[data-intro="symbol"]', { opacity: 0, scale: .8, svgOrigin: '20 20' }, { opacity: 1, scale: 1, duration: .68 }, 1.02)
        .fromTo('[data-intro="radiance"]', { opacity: 0, scale: .55, svgOrigin: '240 190' }, { opacity: .75, scale: 1, duration: .7 }, .9)
        .to('[data-intro="radiance"]', { opacity: .27, scale: 1.25, duration: .8, ease: 'sine.out' }, 1.6)
        .fromTo('[data-intro="wordmark"]', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .75 }, 1.12)
        .fromTo('[data-intro="tagline"]', { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: .7 }, 1.45)
        .fromTo('[data-intro="caption"]', { opacity: 0 }, { opacity: 1, duration: .7 }, 1.6)
        .to('[data-intro="orbits"]', { rotation: 9, duration: 1.05, ease: 'sine.inOut' }, 1.65)
        .to('[data-intro="composition"]', { opacity: 0, y: -8, duration: .35, ease: 'power2.in' }, 2.75)
        .to(stage, { opacity: 0, duration: .35, ease: 'power2.inOut' }, 3.05);
      // Resume the first frame already presented by bootstrap/Suspense.
      timeline.seek(Math.min(getIntroElapsedSeconds(), 2.35));
    }, stage);

    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) complete();
    };
    preference.addEventListener('change', handlePreferenceChange);

    return () => {
      context.revert();
      if (reducedTimer !== undefined) clearTimeout(reducedTimer);
      preference.removeEventListener('change', handlePreferenceChange);
    };
  }, [complete]);

  return createPortal(
    <div
      ref={stageRef}
      className="cinematic-intro"
      data-cinematic-intro
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenido a Supernova Eventos"
      aria-describedby="intro-description"
    >
      <p id="intro-description" className="intro-sr-only">
        Supernova. Conectá sin límites. Un universo de experiencias. La presentación termina en unos segundos. Presioná Escape para continuar.
      </p>
      <IntroArtwork />
    </div>,
    document.body,
  );
}
