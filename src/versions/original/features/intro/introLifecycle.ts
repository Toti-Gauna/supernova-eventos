import { useLayoutEffect, useRef, type RefObject } from 'react';

// The small bootstrap and the lazy scene share a clock, so loading the scene
// never restarts the opening or momentarily replaces it with a plain logo.
let startedAt: number | undefined;

export function getIntroElapsedSeconds() {
  const bootstrapStartedAt = Number(document.getElementById('intro-bootstrap')?.getAttribute('data-intro-started-at'));
  if (startedAt === undefined) {
    startedAt = bootstrapStartedAt > 0 ? bootstrapStartedAt : performance.now();
  }
  return Math.max(0, (performance.now() - startedAt) / 1000);
}

export function resetIntroClock() {
  startedAt = undefined;
}

/** Keep pending and cinematic stages equally accessible, including StrictMode. */
export function useIntroIsolation(stageRef: RefObject<HTMLDivElement | null>, onEscape: () => void) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && !stage.contains(activeElement)) {
      previousFocusRef.current = activeElement;
    }

    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.inert ?? false;
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden') ?? null;
    const previousOverflow = document.body.style.overflow;
    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = 'hidden';
    stage.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        stage.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (appRoot) {
        appRoot.inert = wasInert;
        if (previousAriaHidden === null) appRoot.removeAttribute('aria-hidden');
        else appRoot.setAttribute('aria-hidden', previousAriaHidden);
      }
      queueMicrotask(() => {
        if (document.querySelector('[data-cinematic-intro]')) return;
        resetIntroClock();
        const previousFocus = previousFocusRef.current;
        if (previousFocus?.isConnected && previousFocus !== document.body) {
          previousFocus.focus({ preventScroll: true });
        } else {
          appRoot?.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
        }
      });
    };
  }, [onEscape, stageRef]);
}
