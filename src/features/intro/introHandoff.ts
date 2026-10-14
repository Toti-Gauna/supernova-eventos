import { useMemo, type CSSProperties } from 'react';
import type { UniverseStatus } from '../universe/contracts';

const HANDOFF_START_MS = 1000;
const HANDOFF_END_MS = 1200;

// Suspense and the lazy scene share one reveal, just as they share one clock.
// Retain only the active opening; a replay replaces this small session.
let handoffSession: { startedAtMs: number; readyAtMs: number | null } | undefined;

export function useIntroHandoff(status: UniverseStatus, startedAtMs: number): CSSProperties {
  return useMemo(() => {
    const now = performance.now();
    if (!handoffSession || handoffSession.startedAtMs !== startedAtMs) {
      handoffSession = { startedAtMs, readyAtMs: null };
    }
    if (status === 'ready' && handoffSession.readyAtMs === null) handoffSession.readyAtMs = now;
    // Transfer the aligned, still map before the camera starts its zoom at 1.2 s.
    // A renderer arriving later transfers immediately; never blend two poses.
    const handoffAtMs = Math.max(startedAtMs + HANDOFF_START_MS,
      handoffSession.readyAtMs ?? startedAtMs + HANDOFF_START_MS);
    const durationMs = Math.max(0, Math.min(HANDOFF_END_MS - HANDOFF_START_MS,
      startedAtMs + HANDOFF_END_MS - handoffAtMs));
    return {
      '--intro-handoff-delay': `${(handoffAtMs - now) / 1000}s`,
      '--intro-handoff-duration': `${durationMs / 1000}s`,
    } as CSSProperties;
  }, [startedAtMs, status]);
}
