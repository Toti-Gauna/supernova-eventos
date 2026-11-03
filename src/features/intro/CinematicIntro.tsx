import { useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { useUniversePresentation } from '../universe/presentation';
import IntroArtwork from './IntroArtwork';
import { useIntroHandoff } from './introHandoff';
import { getIntroElapsedSeconds, INTRO_DURATION_MS, useIntroDeadline, useIntroIsolation } from './introLifecycle';
import './intro.css';

interface CinematicIntroProps {
  onComplete: () => void;
  variant?: '3d' | 'hybrid';
}

/** A finite DOM opening above the single persistent universe renderer. */
export default function CinematicIntro({ onComplete, variant = '3d' }: CinematicIntroProps) {
  const { status, introStartedAtMs } = useUniversePresentation();
  const stageRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);
  useIntroIsolation(stageRef, complete, introStartedAtMs);
  useIntroDeadline(introStartedAtMs, complete);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elapsed = getIntroElapsedSeconds(introStartedAtMs);
    if (elapsed >= INTRO_DURATION_MS / 1000) {
      complete();
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: complete });
      timeline
        .fromTo('[data-intro="orbits"]', { opacity: .72, rotation: -2, svgOrigin: '240 185' }, { opacity: 1, rotation: 0, duration: 1.2 }, 0)
        .fromTo('[data-intro="radiance"]', { opacity: .7 }, { opacity: 1, duration: 1.2 }, 0)
        .fromTo('[data-intro="wordmark"]', { yPercent: 65, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .65 }, .35)
        .fromTo('[data-intro="tagline"]', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .6 }, .7)
        .fromTo('[data-intro="caption"]', { opacity: 0 }, { opacity: 1, duration: .65 }, .95)
        .to('[data-intro="identity"]', { opacity: 0, y: -8, duration: .75, ease: 'power2.inOut' }, 1.9)
        .to('[data-intro="composition"]', { opacity: 0, duration: .4, ease: 'power2.in' }, 2.8)
        .to(stage, { opacity: 0, duration: .35, ease: 'power2.inOut' }, 3.25);
      // No clamp: a late chunk resumes its actual pose or exits above.
      timeline.seek(elapsed);
    }, stage);

    return () => context.revert();
  }, [complete, introStartedAtMs]);

  const style = useIntroHandoff(status, introStartedAtMs);

  return createPortal(
    <div
      ref={stageRef}
      className={`cinematic-intro ${status === 'ready' ? 'intro-revealing' : ''}`}
      style={style}
      data-cinematic-intro
      data-intro-variant={variant}
      data-intro-started-at={introStartedAtMs}
      data-intro-universe-status={status}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Te damos la bienvenida a Órbita"
      aria-describedby="intro-description"
    >
      <p id="intro-description" className="intro-sr-only">
        Órbita. Conectá sin límites. Un universo de experiencias. La presentación termina en unos segundos. Presioná Escape para continuar.
      </p>
      <IntroArtwork />
    </div>,
    document.body,
  );
}
