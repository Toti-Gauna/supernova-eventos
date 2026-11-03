import { useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUniversePresentation } from '../universe/presentation';
import IntroArtwork from './IntroArtwork';
import { useIntroHandoff } from './introHandoff';
import { getIntroElapsedSeconds, INTRO_DURATION_MS, useIntroDeadline, useIntroIsolation } from './introLifecycle';
import './intro.css';

interface IntroLoadingProps {
  onComplete: () => void;
  variant?: '3d' | 'hybrid';
}

/** The same solar first frame remains visible while the GSAP chunk loads. */
export default function IntroLoading({ onComplete, variant = '3d' }: IntroLoadingProps) {
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
  useIntroDeadline(introStartedAtMs, complete, INTRO_DURATION_MS);

  const startDelay = useMemo(() => `${-getIntroElapsedSeconds(introStartedAtMs)}s`, [introStartedAtMs]);
  const handoffStyle = useIntroHandoff(status, introStartedAtMs);
  const style = {
    ...handoffStyle,
    '--intro-start-delay': startDelay,
  };

  return createPortal(
    <div ref={stageRef} className={`cinematic-intro intro-pending ${status === 'ready' ? 'intro-revealing' : ''}`} style={style} data-cinematic-intro data-intro-variant={variant} data-intro-started-at={introStartedAtMs} data-intro-universe-status={status} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Te damos la bienvenida a Órbita" aria-describedby="intro-loading-description">
      <p id="intro-loading-description" className="intro-sr-only">Órbita. Conectá sin límites. Preparando la experiencia. Presioná Escape para continuar.</p>
      <IntroArtwork />
    </div>,
    document.body,
  );
}
