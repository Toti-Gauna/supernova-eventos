import { Component, lazy, Suspense, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { destinationKey, type UniverseExperienceProps, type UniverseSettled, type UniverseStatus } from '../universe/contracts';
import '../universe/universe.css';
import './hybrid.css';
import { solarBodyArtwork } from './HybridArtwork';

const fallbackEarth = solarBodyArtwork('earth', 'body');

const first = () => lazy(() => import('./HybridExperience'));
const retry = () => lazy(() => import('./HybridExperience?retry=1'));
class HybridBoundary extends Component<{ children: ReactNode; fail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.fail(); }
  render() { return this.state.failed ? null : this.props.children; }
}
interface Props extends UniverseExperienceProps {
  introActive?: boolean;
  status: UniverseStatus;
  settled: UniverseSettled | null;
  settlementHistory?: readonly UniverseSettled[];
}
export default function HybridHost({ status, settled, settlementHistory, introActive = false, ...experience }: Props) {
  const [Scene, setScene] = useState<LazyExoticComponent<ComponentType<UniverseExperienceProps>>>(first);
  const [generation, setGeneration] = useState(0);
  const failed = useRef(false);
  useEffect(() => {
    const restore = () => {
      if (!failed.current) return;
      failed.current = false;
      setScene(retry);
      setGeneration(value => value + 1);
    };
    window.addEventListener('supernova:retry-universe', restore);
    return () => window.removeEventListener('supernova:retry-universe', restore);
  }, []);
  const travelling = status === 'ready' && !experience.paused && !experience.reducedMotion && settled?.requestId !== experience.command.requestId;
  return <div className="universe-host hybrid-host" aria-hidden="true" data-universe-host="" data-experience="hybrid"
    data-universe-intro={String(introActive)}
    data-universe-status={status} data-universe-destination={destinationKey(experience.command.destination)}
    data-universe-request={experience.command.requestId} data-universe-reason={experience.command.reason}
    data-universe-settled={settled?.requestId ?? 0} data-universe-outcome={settled?.outcome ?? 'pending'}
    data-universe-travelling={String(travelling)} data-universe-paused={String(experience.paused)}
    data-universe-settlement-history={import.meta.env.DEV ? JSON.stringify(settlementHistory) : undefined}>
    <div className="universe-fallback"><div className="universe-fallback-stars" /><img className="hybrid-fallback-planet" src={fallbackEarth} alt="" /></div>
    <HybridBoundary key={generation} fail={() => { failed.current = true; experience.onStatusChange('fallback'); }}>
      <Suspense fallback={null}><Scene {...experience} /></Suspense>
    </HybridBoundary>
  </div>;
}
