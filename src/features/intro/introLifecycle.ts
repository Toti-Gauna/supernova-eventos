import { useLayoutEffect, type RefObject } from 'react';

export const INTRO_DURATION_MS = 3600;
export const INTRO_DEADLINE_MS = 4000;
export const INTRO_REDUCED_MS = 150;

// The host preserves bootstrap time before its HTML is removed. Passing it
// explicitly also keeps Suspense and StrictMode cleanup from resetting replay.
export function getIntroElapsedSeconds(startedAtMs: number) {
  return Math.max(0, (performance.now() - startedAtMs) / 1000);
}

/** A lazy chunk or a late WebGL frame can never extend the opening. */
export function useIntroDeadline(startedAtMs: number, onComplete: () => void, durationMs = INTRO_DEADLINE_MS) {
  useLayoutEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const elapsedMs = getIntroElapsedSeconds(startedAtMs) * 1000;
    // The HTML already supplies the static first frame. A mounted reduced
    // overlay must release now, leaving room for React's commit on slower CPUs.
    if (preference.matches) {
      onComplete();
      return;
    }
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    const timer = window.setTimeout(onComplete, remainingMs);
    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) onComplete();
    };
    preference.addEventListener('change', handlePreferenceChange);
    return () => {
      window.clearTimeout(timer);
      preference.removeEventListener('change', handlePreferenceChange);
    };
  }, [durationMs, onComplete, startedAtMs]);
}

let isolationSession: { startedAtMs: number; previousFocus: HTMLElement | null } | undefined;

/** Preserve one focus return target across Suspense and StrictMode handoffs. */
export function useIntroIsolation(stageRef: RefObject<HTMLDivElement | null>, onEscape: () => void, startedAtMs: number) {

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const activeElement = document.activeElement;
    if (!isolationSession || isolationSession.startedAtMs !== startedAtMs) {
      isolationSession = {
        startedAtMs,
        previousFocus: activeElement instanceof HTMLElement && !activeElement.closest('[data-cinematic-intro]') ? activeElement : null,
      };
    }
    const session = isolationSession;

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
        if (isolationSession === session) isolationSession = undefined;
        const previousFocus = session.previousFocus;
        if (previousFocus?.isConnected && previousFocus !== document.body) {
          previousFocus.focus({ preventScroll: true });
        } else {
          appRoot?.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
        }
      });
    };
  }, [onEscape, stageRef, startedAtMs]);
}
