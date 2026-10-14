import { Component, lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ErrorInfo, type LazyExoticComponent, type ReactNode } from 'react';
import { destinationKey, type UniverseExperienceProps, type UniverseSettled, type UniverseStatus } from './contracts';
import './universe.css';

const initialScene = () => lazy(() => import('./UniverseExperience'));
// A separate, statically bundled entry allows one fresh fetch after a failed load.
const recoveryScene = () => lazy(() => import('./UniverseExperience?retry=1'));

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

interface Props extends UniverseExperienceProps {
  introActive?: boolean;
  status: UniverseStatus;
  settled: UniverseSettled | null;
  settlementHistory?: readonly UniverseSettled[];
}

/** This host stays mounted across pages, dialogs and intro replays. */
export default function UniverseHost({ status, settled, settlementHistory, introActive = false, ...experience }: Props) {
  const [Scene, setScene] = useState<LazyExoticComponent<ComponentType<UniverseExperienceProps>>>(initialScene);
  const [boundaryKey, setBoundaryKey] = useState(0);
  const boundaryFailed = useRef(false);
  useEffect(() => {
    const retry = () => {
      if (!boundaryFailed.current) return; // Context and shader recovery keep the Canvas.
      boundaryFailed.current = false;
      setScene(recoveryScene);
      setBoundaryKey(key => key + 1);
    };
    window.addEventListener('supernova:retry-universe', retry);
    return () => window.removeEventListener('supernova:retry-universe', retry);
  }, []);
  const travelling = status === 'ready' && !experience.paused && !experience.reducedMotion && settled?.requestId !== experience.command.requestId;
  return <div
    className="universe-host"
    aria-hidden="true"
    data-universe-host=""
    data-universe-intro={String(introActive)}
    data-universe-status={status}
    data-universe-destination={destinationKey(experience.command.destination)}
    data-universe-request={experience.command.requestId}
    data-universe-reason={experience.command.reason}
    data-universe-settlement-history={import.meta.env.DEV ? JSON.stringify(settlementHistory) : undefined}
    data-universe-settled={settled?.requestId ?? 0}
    data-universe-outcome={settled?.outcome ?? 'pending'}
    data-universe-travelling={String(travelling)}
    data-universe-paused={String(experience.paused)}
  >
    <div className="universe-fallback"><div className="universe-fallback-stars" /><div className="universe-fallback-orbit" /></div>
    <SceneBoundary key={boundaryKey} onFailure={() => { boundaryFailed.current = true; experience.onStatusChange('fallback'); }}>
      <Suspense fallback={null}><Scene {...experience} /></Suspense>
    </SceneBoundary>
  </div>;
}
