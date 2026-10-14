import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { NoToneMapping, SRGBColorSpace } from 'three';
import type { UniverseExperienceProps, UniverseSettled } from '../universe/contracts';
import TravelParticles from '../universe/TravelParticles';
import HybridWorld from './HybridWorld';
import HybridCameraRig from './HybridCameraRig';

function Runtime({ command, animated, onStatusChange, settle, onLost, auto, degrade }: {
  command: UniverseExperienceProps['command']; animated: boolean;
  onStatusChange: UniverseExperienceProps['onStatusChange']; settle: UniverseExperienceProps['onSettled']; onLost: (lost: boolean) => void;
  auto: boolean; degrade: () => void;
}) {
  const { gl, invalidate } = useThree();
  const current = useRef({ command, onStatusChange, settle });
  current.current = { command, onStatusChange, settle };
  const ready = useRef(false);
  const failed = useRef(false);
  const frames = useRef(0);
  const deltas = useRef<number[]>([]);
  const performanceWindow = useRef({ frames:0, total:0, slow:0, degraded:false });
  useEffect(() => {
    const canvas = gl.domElement;
    const extension = gl.getContext().getExtension('WEBGL_lose_context');
    let deadline = 0;
    let losses = 0;
    const lost = (event: Event) => {
      event.preventDefault(); ready.current = false; losses++;
      current.current.onStatusChange('context-lost');
      current.current.settle({ requestId: current.current.command.requestId, outcome: 'fallback' });
      onLost(true);
    };
    const restored = () => {
      clearTimeout(deadline);
      if (losses > 1) { current.current.onStatusChange('fallback'); return; }
      failed.current = false; ready.current = false; onLost(false); invalidate();
    };
    const retry = () => {
      clearTimeout(deadline); losses = 0; failed.current = false; ready.current = false;
      current.current.onStatusChange('loading');
      if (gl.getContext().isContextLost()) {
        extension?.restoreContext();
        deadline = window.setTimeout(() => current.current.onStatusChange('fallback'), 1500);
      } else { onLost(false); invalidate(); }
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    window.addEventListener('supernova:retry-universe', retry);
    return () => {
      clearTimeout(deadline);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      window.removeEventListener('supernova:retry-universe', retry);
    };
  }, [gl, invalidate, onLost]);
  useFrame(({ scene, camera }, delta) => {
    if (document.hidden || failed.current || gl.getContext().isContextLost()) return;
    try { gl.render(scene, camera); } catch {
      failed.current = true; current.current.onStatusChange('fallback');
      current.current.settle({ requestId: current.current.command.requestId, outcome: 'fallback' });
      onLost(true); return;
    }
    if (!ready.current) { ready.current = true; queueMicrotask(() => current.current.onStatusChange('ready')); }
    frames.current++;
    const data = gl.domElement.dataset;
    data.hybridStage = 'illustrated';
    data.hybridFrames = String(frames.current);
    data.hybridCalls = String(gl.info.render.calls);
    data.hybridTriangles = String(gl.info.render.triangles);
    data.hybridFrameloop = animated ? 'continuous' : 'demand';
    if (frames.current % 12 === 0 || !animated) {
      data.hybridGeometries = String(gl.info.memory.geometries);
      data.hybridTextures = String(gl.info.memory.textures);
      data.hybridPrograms = String(gl.info.programs?.length ?? 0);
      let spheres = 0;
      scene.traverse(object => { if ('geometry' in object && (object.geometry as { type?: string }).type === 'SphereGeometry') spheres++; });
      data.hybridSpheres = String(spheres);
    }
    if (animated && delta > 0 && delta < .25 && frames.current % 3 === 0) {
      deltas.current.push(Math.round(delta * 10000) / 10);
      if (deltas.current.length > 180) deltas.current.shift();
      data.hybridFrameSamples = deltas.current.join(',');
    }
    const sample = performanceWindow.current;
    if (auto && animated && !sample.degraded && frames.current > 90 && delta < .25) {
      sample.frames++; sample.total += delta;
      if (sample.frames >= 90) {
        sample.slow = sample.total / sample.frames > .03 ? sample.slow + 1 : 0;
        sample.frames = 0; sample.total = 0;
        if (sample.slow >= 2) { sample.degraded = true; queueMicrotask(degrade); }
      }
    }
  }, 1);
  return null;
}

export default function HybridExperience(props: UniverseExperienceProps) {
  const { command, reducedMotion, paused, quality, onStatusChange, onSettled } = props;
  const [lost, setLost] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const degrade = useCallback(() => setDegraded(true), []);
  const low = quality === 'low' || (quality === 'auto' && degraded);
  const callback = useRef(onSettled);
  callback.current = onSettled;
  const seen = useRef(new Set<number>());
  const retired = useRef(0);
  const settle = useCallback((result: UniverseSettled) => {
    if (seen.current.has(result.requestId) || result.requestId <= retired.current) return;
    seen.current.add(result.requestId);
    if (seen.current.size > 64) {
      const oldest = Math.min(...seen.current);
      seen.current.delete(oldest); retired.current = oldest;
    }
    queueMicrotask(() => callback.current(result));
  }, []);
  const animated = !paused && !reducedMotion && !lost;
  return <Canvas className="universe-engine hybrid-engine" aria-hidden="true" tabIndex={-1} frameloop={animated ? 'always' : 'demand'}
    camera={{ position: [0, 0, 80], fov: 38, near: .1, far: 180 }}
    dpr={low ? 1 : quality === 'high' ? 1.5 : 1.25}
    gl={{ alpha: true, antialias: quality !== 'low', powerPreference: 'low-power' }}
    onCreated={({ gl }) => { gl.outputColorSpace = SRGBColorSpace; gl.toneMapping = NoToneMapping; gl.setClearColor('#020205', 0); }}>
    <HybridCameraRig command={command} reducedMotion={reducedMotion} paused={paused || lost} settle={settle} />
    <HybridWorld {...props} />
    <TravelParticles command={command} quality={low ? 'low' : 'balanced'} animated={animated} />
    <Runtime command={command} animated={animated} onStatusChange={onStatusChange} settle={settle} onLost={setLost} auto={quality === 'auto'} degrade={degrade} />
  </Canvas>;
}
