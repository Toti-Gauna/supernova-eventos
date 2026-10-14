import { useCallback, useEffect, useRef, useState } from 'react';
import { readStorage, writeStorage } from '../../lib/storage';
import type { UniverseCommand, UniverseDestination, UniverseSettled, UniverseStatus } from './contracts';

const MOTION_KEY = 'supernova-universe-motion-v1';

/** Presentation only: never owns registrations, routes, forms or event data. */
export function useUniverseController(startedAt: number, introActive: boolean) {
  const [command, setCommand] = useState<UniverseCommand>(() => ({
    requestId: 1,
    issuedAtMs: startedAt,
    destination: { kind: 'section', view: 'explore' },
    reason: 'boot',
  }));
  const commandRef = useRef(command);
  const nextId = useRef(1);
  const [status, setStatus] = useState<UniverseStatus>('loading');
  const statusRef = useRef<UniverseStatus>('loading');
  const recoveryPending = useRef(false);
  const [settled, setSettled] = useState<UniverseSettled | null>(null);
  const [settlementHistory, setSettlementHistory] = useState<readonly UniverseSettled[]>([]);
  const lastSettledId = useRef(0);
  const [introStartedAtMs, setIntroStartedAtMs] = useState(startedAt);
  const [userPaused, setUserPaused] = useState(() => readStorage<unknown>(MOTION_KEY, false) === true);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const [sceneHidden, setSceneHidden] = useState(false);

  const onSettled = useCallback((result: UniverseSettled) => {
    // Bounded development telemetry includes stale/cancelled callbacks for QA.
    if (import.meta.env.DEV) setSettlementHistory(history => [...history.slice(-39), result]);
    if (result.requestId !== commandRef.current.requestId || lastSettledId.current === result.requestId) return;
    lastSettledId.current = result.requestId;
    setSettled(result);
  }, []);

  const issueCommand = useCallback((destination: UniverseDestination, reason: UniverseCommand['reason'], issuedAtMs = performance.now()) => {
    const next: UniverseCommand = { destination, reason, issuedAtMs, requestId: ++nextId.current };
    commandRef.current = next;
    setCommand(next);
    setSceneHidden(false);
    if (statusRef.current === 'fallback' || statusRef.current === 'context-lost') {
      onSettled({ requestId: next.requestId, outcome: 'fallback' });
    }
  }, [onSettled]);

  const onStatusChange = useCallback((next: UniverseStatus) => {
    statusRef.current = next;
    setStatus(next);
    if (next === 'fallback' || next === 'context-lost') {
      recoveryPending.current = true;
      onSettled({ requestId: commandRef.current.requestId, outcome: 'fallback' });
    } else if (next === 'ready' && recoveryPending.current) {
      recoveryPending.current = false;
      // Recovery settles a new request at the current location, never an old trip.
      issueCommand(commandRef.current.destination, 'navigate', performance.now() - 2000);
    }
  }, [issueCommand, onSettled]);

  const retry = useCallback(() => {
    if (statusRef.current !== 'fallback' && statusRef.current !== 'context-lost') return;
    onStatusChange('loading');
    window.dispatchEvent(new CustomEvent('supernova:retry-universe'));
  }, [onStatusChange]);

  const finishOpening = useCallback(() => {
    const current = commandRef.current;
    if (current.reason !== 'boot' && current.reason !== 'replay') return;
    // Supersede the opening, including a lazy engine that has not arrived yet.
    issueCommand(current.destination, 'navigate', performance.now() - 2000);
  }, [issueCommand]);

  const replay = useCallback((destination: UniverseDestination) => {
    const clock = performance.now();
    setIntroStartedAtMs(clock);
    issueCommand(destination, 'replay', clock);
  }, [issueCommand]);

  const toggleMotion = useCallback(() => setUserPaused(current => !current), []);

  useEffect(() => { writeStorage(MOTION_KEY, userPaused); }, [userPaused]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    const visible = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', visible);
    return () => {
      preference.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  useEffect(() => {
    setSceneHidden(false);
    if (introActive || command.destination.kind !== 'section') return;
    const selector = command.destination.view === 'explore'
      ? '.cosmic-installation[data-universe-surface]'
      : '.universe-section-art[data-universe-surface]';
    let observer: IntersectionObserver | undefined;
    let surface: Element | null = null;
    const observe = () => {
      const next = Array.from(document.querySelectorAll(selector)).at(-1) ?? null;
      if (next === surface) return;
      observer?.disconnect();
      surface = next;
      if (!next) { setSceneHidden(false); return; }
      observer = new IntersectionObserver(entries => {
        if (commandRef.current.requestId === command.requestId) setSceneHidden(!entries[0].isIntersecting);
      }, { threshold: 0.05 });
      observer.observe(next);
    };
    observe();
    const mutations = new MutationObserver(observe);
    mutations.observe(document.getElementById('main-content') ?? document.body, { childList: true, subtree: true });
    return () => { mutations.disconnect(); observer?.disconnect(); };
  }, [command.destination, command.requestId, introActive]);

  return {
    command, status, settled, settlementHistory, introStartedAtMs, reducedMotion, userPaused,
    paused: userPaused || pageHidden || (!introActive && command.destination.kind === 'section' && sceneHidden),
    issueCommand, finishOpening, replay, toggleMotion, retry, onSettled, onStatusChange,
  };
}
