import { useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import IntroArtwork from './IntroArtwork';
import { getIntroElapsedSeconds, useIntroIsolation } from './introLifecycle';
import './intro.css';

interface IntroLoadingProps {
  onComplete: () => void;
}

/** The same orbital scene is already visible while the animation chunk loads. */
export default function IntroLoading({ onComplete }: IntroLoadingProps) {
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
    const elapsed = getIntroElapsedSeconds();
    stageRef.current?.style.setProperty('--intro-start-delay', `${-Math.min(elapsed, 2.35)}s`);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedTimer: ReturnType<typeof setTimeout> | undefined;
    if (preference.matches) reducedTimer = setTimeout(complete, Math.max(0, 150 - elapsed * 1000));
    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) complete();
    };
    preference.addEventListener('change', handlePreferenceChange);
    return () => {
      if (reducedTimer !== undefined) clearTimeout(reducedTimer);
      preference.removeEventListener('change', handlePreferenceChange);
    };
  }, [complete]);

  return createPortal(
    <div ref={stageRef} className="cinematic-intro intro-pending" data-cinematic-intro tabIndex={-1} role="dialog" aria-modal="true" aria-label="Bienvenido a Supernova Eventos" aria-describedby="intro-loading-description">
      <p id="intro-loading-description" className="intro-sr-only">Supernova. Conectá sin límites. Cargando la presentación. Presioná Escape para continuar.</p>
      <IntroArtwork />
    </div>,
    document.body,
  );
}
