import type { AppView, EventCategory } from '../../types';

export type UniverseDestination =
  | { kind: 'section'; view: AppView }
  | { kind: 'event'; eventId: string; category: EventCategory }
  | { kind: 'studio' };

export type UniverseStatus = 'loading' | 'ready' | 'fallback' | 'context-lost';
export type UniverseQuality = 'auto' | 'low' | 'balanced' | 'high';

export interface UniverseCommand {
  requestId: number;
  issuedAtMs: number;
  destination: UniverseDestination;
  reason:
    | 'boot' | 'navigate' | 'open-event' | 'close-event'
    | 'open-studio' | 'close-studio' | 'registration-success' | 'replay';
}

export interface UniverseSettled {
  requestId: number;
  outcome: 'arrived' | 'cancelled' | 'fallback';
}

export interface UniverseExperienceProps {
  command: UniverseCommand;
  favoriteSatellites: readonly { eventId: string; category: EventCategory }[];
  reducedMotion: boolean;
  paused: boolean;
  quality: UniverseQuality;
  onSettled: (result: UniverseSettled) => void;
  onStatusChange: (status: UniverseStatus) => void;
}

export interface UniversePresentation {
  status: UniverseStatus;
  command: UniverseCommand;
  introStartedAtMs: number;
}

export function destinationKey(destination: UniverseDestination): string {
  if (destination.kind === 'section') return `section:${destination.view}`;
  if (destination.kind === 'event') return `event:${destination.eventId}`;
  return 'studio';
}

/** Capture the bootstrap clock before its first-frame nodes are removed. */
export function readIntroStartedAt(): number {
  const value = Number(document.getElementById('intro-bootstrap')?.getAttribute('data-intro-started-at'));
  return Number.isFinite(value) && value > 0 ? value : performance.now();
}
