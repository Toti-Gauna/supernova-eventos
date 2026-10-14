import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace, type Group, type Material, type Mesh } from 'three';
import type { UniverseExperienceProps, UniverseSettled, UniverseStatus } from './contracts';
import CameraRig from './CameraRig';
import Planet from './Planet';
import Spaceship from './Spaceship';
import SolarMap from './SolarMap';
import TravelParticles from './TravelParticles';
import { useDestinationHighlight } from './useDestinationHighlight';
import { destinationKey, eventPlanet, PLANETS, QUALITY_PROFILES, travelDuration, type PlanetSpec, type RenderQuality } from './scene.config';

const RETRY_EVENT = 'supernova:retry-universe';
const SETTLED_HISTORY_LIMIT = 64;

class RendererBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFailure(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Unavailable({ requestId, settle, status }: {
  requestId: number; settle: (result: UniverseSettled) => void; status: (value: UniverseStatus) => void;
}) {
  useEffect(() => {
    status('fallback');
    settle({ requestId, outcome: 'fallback' });
  }, [requestId, settle, status]);
  return null;
}

/** Owns exactly one render; readiness is reported after WebGL draws the scene. */
function FramePresenter({ renderQuality, auto, animated, contextLost, recoveryAttempt, status, degrade, renderFailed, fail }: {
  renderQuality: RenderQuality; auto: boolean; animated: boolean; contextLost: boolean;
  recoveryAttempt: number;
  status: (value: UniverseStatus) => void; degrade: () => void;
  renderFailed: { current: boolean }; fail: () => void;
}) {
  const rendered = useRef(false);
  const measurements = useRef({ frames: 0, sum: 0, slowWindows: 0, downgraded: false, started: performance.now() });
  const frameHistory = useRef({ frames: 0, values: [] as number[] });
  const renderCount = useRef(0);
  const { gl } = useThree();
  useLayoutEffect(() => { rendered.current = false; }, [contextLost, recoveryAttempt]);
  useEffect(() => {
    if (import.meta.env.DEV) {
      gl.domElement.dataset.universeFrameloop = animated ? 'continuous' : 'demand';
      gl.domElement.dataset.universeContextLost = String(contextLost);
    }
  }, [animated, contextLost, gl]);
  useFrame(({ gl, scene, camera }, delta) => {
    if (document.hidden || contextLost || renderFailed.current || gl.getContext().isContextLost()) return;
    try { gl.render(scene, camera); } catch { fail(); return; }
    if (renderFailed.current) return;
    if (!rendered.current) {
      rendered.current = true;
      queueMicrotask(() => status('ready'));
    }
    const sample = measurements.current;
    if (import.meta.env.DEV) {
      renderCount.current++;
      gl.domElement.dataset.universeFrames = String(renderCount.current);
      gl.domElement.dataset.universeQuality = renderQuality;
      gl.domElement.dataset.universeCalls = String(gl.info.render.calls);
      gl.domElement.dataset.universeTriangles = String(gl.info.render.triangles);
      if (renderCount.current === 1 || renderCount.current % 12 === 0 || !animated) {
        gl.domElement.dataset.universeGeometries = String(gl.info.memory.geometries);
        gl.domElement.dataset.universeTextures = String(gl.info.memory.textures);
        gl.domElement.dataset.universePrograms = String(gl.info.programs?.length ?? 0);
        let objects = 0;
        scene.traverse(() => { objects++; });
        gl.domElement.dataset.universeSceneObjects = String(objects);
      }
      const history = frameHistory.current;
      if (animated && delta > 0 && delta < .25) {
        history.frames++;
        if (history.frames % 3 === 0) {
          history.values.push(Math.round(delta * 10000) / 10);
          if (history.values.length > 180) history.values.shift();
        }
        if (history.frames % 12 === 0) {
          gl.domElement.dataset.universeFrameMs = String(Math.round(delta * 10000) / 10);
          gl.domElement.dataset.universeFrameSamples = history.values.join(',');
        }
      }
    }
    if (!auto || !animated || sample.downgraded || performance.now() - sample.started < 1500 || delta > .25) return;
    sample.frames++; sample.sum += delta;
    if (sample.frames >= 90) {
      const averageMs = sample.sum / sample.frames * 1000;
      sample.slowWindows = averageMs > 30 ? sample.slowWindows + 1 : Math.max(0, sample.slowWindows - 1);
      sample.frames = 0; sample.sum = 0;
      if (sample.slowWindows >= 2 && renderQuality !== 'low') {
        sample.downgraded = true;
        queueMicrotask(degrade);
      }
    }
  }, 1);
  return null;
}

function ContextLifecycle({ requestId, settle, status, onLost, renderFailed }: {
  requestId: number; settle: (result: UniverseSettled) => void;
  status: (value: UniverseStatus) => void; onLost: (lost: boolean) => void;
  renderFailed: { current: boolean };
}) {
  const { gl, scene, invalidate } = useThree();
  const current = useRef({ requestId, settle });
  current.current = { requestId, settle };
  const losses = useRef(0);
  const lost = useRef(false);
  useEffect(() => {
    const canvas = gl.domElement;
    let restoreDeadline = 0;
    const clearDeadline = () => {
      if (restoreDeadline) window.clearTimeout(restoreDeadline);
      restoreDeadline = 0;
    };
    // Keep the extension before a loss; getExtension can return null on a lost context.
    let restoreExtension = gl.getContext().getExtension('WEBGL_lose_context');
    const handleLost = (event: Event) => {
      event.preventDefault();
      clearDeadline();
      lost.current = true; losses.current++;
      status('context-lost');
      current.current.settle({ requestId: current.current.requestId, outcome: 'fallback' });
      onLost(true);
    };
    const handleRestored = () => {
      clearDeadline();
      // A single recovery uses the existing renderer. Repeated losses retain fallback.
      if (losses.current > 1) { status('fallback'); return; }
      lost.current = false;
      restoreExtension = gl.getContext().getExtension('WEBGL_lose_context');
      onLost(false);
      invalidate();
    };
    const handleRetry = () => {
      clearDeadline();
      const failedProgram = renderFailed.current;
      renderFailed.current = false;
      status('loading');
      losses.current = 0;
      if (gl.getContext().isContextLost()) {
        lost.current = true;
        onLost(true);
        if (restoreExtension) {
          try { restoreExtension.restoreContext(); } catch { status('fallback'); return; }
          restoreDeadline = window.setTimeout(() => {
            restoreDeadline = 0;
            if (!lost.current || !gl.getContext().isContextLost()) return;
            status('fallback');
            current.current.settle({ requestId: current.current.requestId, outcome: 'fallback' });
          }, 1500);
        } else {
          status('fallback');
          current.current.settle({ requestId: current.current.requestId, outcome: 'fallback' });
        }
      } else {
        if (failedProgram) {
          // Release cached failed programs; a real retry must compile, rather than reuse a black frame.
          const materials = new Set<Material>();
          scene.traverse(object => {
            const material = (object as Mesh).material;
            if (Array.isArray(material)) material.forEach(item => materials.add(item));
            else if (material) materials.add(material);
          });
          materials.forEach(material => material.dispose());
        }
        lost.current = false;
        onLost(false);
        invalidate();
      }
    };
    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);
    window.addEventListener(RETRY_EVENT, handleRetry);
    return () => {
      clearDeadline();
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
      window.removeEventListener(RETRY_EVENT, handleRetry);
    };
  }, [gl, invalidate, onLost, renderFailed, scene, status]);
  useEffect(() => {
    if (lost.current) settle({ requestId, outcome: 'fallback' });
  }, [requestId, settle]);
  return null;
}

function SuccessCue({ command, animated }: { command: UniverseExperienceProps['command']; animated: boolean }) {
  const group = useRef<import('three').Group>(null);
  const mesh = useRef<import('three').Mesh>(null);
  const beacon = useRef<import('three').Mesh>(null);
  const { invalidate, gl } = useThree();
  const spec = useMemo(() => command.destination.kind === 'event' ? eventPlanet(command.destination) : null, [command.destination]);
  useEffect(() => { if (command.reason === 'registration-success') invalidate(); }, [command, invalidate]);
  useFrame(() => {
    const elapsed = performance.now() - command.issuedAtMs;
    const visible = !!spec && command.reason === 'registration-success' && animated && elapsed >= 0 && elapsed < 550;
    if (import.meta.env.DEV) gl.domElement.dataset.universeCueActive = visible ? 'true' : 'false';
    if (!group.current || !mesh.current) return;
    group.current.visible = visible;
    if (!visible) return;
    const progress = elapsed / 550;
    mesh.current.scale.setScalar(1 + progress * .7);
    const material = mesh.current.material as import('three').MeshBasicMaterial;
    material.opacity = Math.sin(progress * Math.PI) * .34;
    if (beacon.current) {
      beacon.current.scale.setScalar(.85 + Math.sin(progress * Math.PI) * .4);
      (beacon.current.material as import('three').MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * .7;
    }
    invalidate();
  });
  if (!spec) return null;
  return <group ref={group} position={spec.center} visible={false}>
    <mesh ref={beacon} position={[-spec.radius * .25, spec.radius * .94, spec.radius * .43]}>
      <octahedronGeometry args={[.075, 0]} />
      <meshBasicMaterial color={spec.rim} transparent opacity={0} depthWrite={false} />
    </mesh>
    <mesh ref={mesh} rotation={[1.17, 0, .42]}>
      <torusGeometry args={[spec.radius * 1.4, .012, 5, 64]} />
      <meshBasicMaterial color={spec.rim} transparent opacity={0} depthWrite={false} />
    </mesh>
  </group>;
}

function UniverseWorld({ props, renderQuality, settle, status, contextLost, recoveryAttempt, onLost, degrade, renderFailed, fail }: {
  props: UniverseExperienceProps; renderQuality: RenderQuality; settle: (result: UniverseSettled) => void;
  status: (value: UniverseStatus) => void; contextLost: boolean; onLost: (lost: boolean) => void; degrade: () => void;
  recoveryAttempt: number;
  renderFailed: { current: boolean }; fail: () => void;
}) {
  const { command, favoriteSatellites, reducedMotion, paused } = props;
  const { invalidate, size, gl } = useThree();
  const animated = !reducedMotion && !paused && !contextLost;
  const highlight = useDestinationHighlight(contextLost);
  const key = destinationKey(command.destination);
  const initialTravel = animated && Math.max(0, performance.now() - command.issuedAtMs) < travelDuration(command, size.width < 768);
  const selection = useRef({ requestId: command.requestId, key, previous: null as string | null,
    event: null as PlanetSpec | null, solar: initialTravel && (command.reason === 'boot' || command.reason === 'replay'), travelling: initialTravel });
  const bodies = useRef<Record<string, Group | null>>({});
  if (selection.current.requestId !== command.requestId) {
    const elapsed = Math.max(0, performance.now() - command.issuedAtMs);
    const travelling = animated && elapsed < travelDuration(command, size.width < 768);
    selection.current = { ...selection.current, requestId: command.requestId, key,
      previous: travelling ? selection.current.key : null, travelling,
      solar: travelling && (command.reason === 'boot' || command.reason === 'replay') };
  } else if (!animated) {
    selection.current.previous = null;
    selection.current.solar = false;
    selection.current.travelling = false;
  }
  const currentEvent = useMemo(() => command.destination.kind === 'event' ? eventPlanet(command.destination) : null, [command.destination]);
  if (currentEvent) selection.current.event = currentEvent;
  const visible = (bodyKey: string) => {
    const phase = selection.current;
    if (bodyKey === 'solar') return phase.solar;
    if (phase.solar) return bodyKey === 'explore' || (performance.now() - command.issuedAtMs >= 2450 && bodyKey === phase.key);
    if (bodyKey === 'admin') return phase.key === 'admin' || phase.key === 'studio' ||
      (phase.travelling && (phase.previous === 'admin' || phase.previous === 'studio'));
    return bodyKey === phase.key || (phase.travelling && bodyKey === phase.previous);
  };
  const applyVisibility = useCallback(() => {
    const phase = selection.current;
    const visibleKeys: string[] = [];
    for (const [bodyKey, body] of Object.entries(bodies.current)) {
      if (!body) continue;
      body.visible = bodyKey === 'solar' ? phase.solar : phase.solar ? bodyKey === 'explore' ||
        (performance.now() - command.issuedAtMs >= 2450 && bodyKey === phase.key) : bodyKey === phase.key ||
        (phase.travelling && bodyKey === phase.previous) ||
        (bodyKey === 'admin' && (phase.key === 'studio' || (phase.travelling && phase.previous === 'studio')));
      if (import.meta.env.DEV && body.visible) visibleKeys.push(bodyKey);
    }
    if (import.meta.env.DEV) gl.domElement.dataset.universeVisible = visibleKeys.sort().join(',');
    invalidate();
  }, [gl, invalidate, command.issuedAtMs]);
  const settleCamera = useCallback((result: UniverseSettled) => {
    const phase = selection.current;
    if (result.requestId === phase.requestId && result.outcome !== 'cancelled') {
      phase.previous = null; phase.solar = false; phase.travelling = false;
      applyVisibility();
    }
    settle(contextLost ? { ...result, outcome: 'fallback' } : result);
  }, [applyVisibility, contextLost, settle]);
  useLayoutEffect(() => { applyVisibility(); }, [applyVisibility, command.requestId, animated]);
  useFrame(() => {
    const phase = selection.current;
    if (phase.solar && performance.now() - command.issuedAtMs >= 2450 && key !== 'explore') {
      const destination = bodies.current[key];
      if (destination && !destination.visible) applyVisibility();
    }
    if (phase.solar && performance.now() - command.issuedAtMs >= 3600) {
      phase.previous = null; phase.solar = false; phase.travelling = false;
      applyVisibility();
    }
  });
  const event = currentEvent ?? selection.current.event;

  return <>
    <ambientLight intensity={.12} color="#abb6cb" />
    <directionalLight position={[-8, 6, 5]} intensity={2.2} color="#fff0dc" />
    <directionalLight position={[6, 2, -7]} intensity={1} color="#c9a3ff" />
    {Object.values(PLANETS).map(spec => <group key={spec.key} ref={body => { bodies.current[spec.key] = body; }} visible={visible(spec.key)}>
      <Planet spec={spec} quality={renderQuality} detailed={spec.key === key} animated={animated} highlight={highlight}
        satellites={spec.key === 'favorites' ? favoriteSatellites : undefined} />
    </group>)}
    {event && <group ref={body => {
      if (body) bodies.current[event.key] = body;
      else delete bodies.current[event.key];
    }} visible={visible(event.key)}>
      <Planet spec={event} quality={renderQuality} detailed={key === event.key} animated={animated} highlight={highlight} />
    </group>}
    <group ref={body => { bodies.current.admin = body; }} visible={visible('admin')}>
      <Spaceship detailed={(key === 'admin' || key === 'studio') && renderQuality !== 'low'} studio={key === 'studio'}
        command={command} animated={animated} highlight={highlight} />
    </group>
    <group ref={body => { bodies.current.solar = body; }} visible={visible('solar')}>
      <SolarMap startedAtMs={command.issuedAtMs} animated={animated} />
    </group>
    <TravelParticles command={command} quality={renderQuality} animated={animated} />
    <SuccessCue command={command} animated={animated} />
    <CameraRig command={command} reducedMotion={reducedMotion} paused={paused || contextLost} settle={settleCamera} />
    <ContextLifecycle requestId={command.requestId} settle={settle} status={status} onLost={onLost} renderFailed={renderFailed} />
    <FramePresenter renderQuality={renderQuality} auto={props.quality === 'auto'} animated={animated}
      contextLost={contextLost} recoveryAttempt={recoveryAttempt} status={status} degrade={degrade} renderFailed={renderFailed} fail={fail} />
  </>;
}

export default function UniverseExperience(props: UniverseExperienceProps) {
  const callbacks = useRef({ onSettled: props.onSettled, onStatusChange: props.onStatusChange });
  callbacks.current = { onSettled: props.onSettled, onStatusChange: props.onStatusChange };
  const settled = useRef(new Set<number>());
  const retiredThrough = useRef(-1);
  const latestCommand = useRef(props.command);
  latestCommand.current = props.command;
  const renderFailed = useRef(false);
  const boundaryFailed = useRef(false);
  const reported = useRef<UniverseStatus | null>(null);
  const settledHistory = useRef<string[]>([]);
  const alive = useRef(true);
  const [autoQuality, setAutoQuality] = useState<RenderQuality>('balanced');
  const [contextLost, setContextLost] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [boundaryKey, setBoundaryKey] = useState(0);
  const renderQuality = props.quality === 'auto' ? autoQuality : props.quality;
  const settle = useCallback((result: UniverseSettled) => {
    if (result.requestId <= retiredThrough.current || settled.current.has(result.requestId)) return;
    settled.current.add(result.requestId);
    if (settled.current.size > SETTLED_HISTORY_LIMIT) {
      const oldest = Math.min(...settled.current);
      settled.current.delete(oldest);
      retiredThrough.current = Math.max(retiredThrough.current, oldest);
    }
    if (import.meta.env.DEV) {
      settledHistory.current.push(`${result.requestId}:${result.outcome}`);
      if (settledHistory.current.length > 24) settledHistory.current.shift();
      const canvas = document.querySelector<HTMLCanvasElement>('.universe-engine canvas');
      if (canvas) canvas.dataset.universeSettled = settledHistory.current.join(',');
    }
    // The presentation callback never executes inside React/Three reconciliation.
    queueMicrotask(() => { if (alive.current) callbacks.current.onSettled(result); });
  }, []);
  const status = useCallback((value: UniverseStatus) => {
    if (reported.current === value) return;
    reported.current = value;
    queueMicrotask(() => { if (alive.current && reported.current === value) callbacks.current.onStatusChange(value); });
  }, []);
  const degrade = useCallback(() => setAutoQuality('low'), []);
  const fail = useCallback(() => {
    if (renderFailed.current) return;
    renderFailed.current = true;
    status('fallback');
    settle({ requestId: latestCommand.current.requestId, outcome: 'fallback' });
    queueMicrotask(() => { if (alive.current) setContextLost(true); });
  }, [settle, status]);
  useEffect(() => {
    alive.current = true;
    if (reported.current === null) status('loading');
    return () => { alive.current = false; };
  }, [status]);
  useEffect(() => {
    const retry = () => {
      if (boundaryFailed.current) {
        // React already removed an invalid renderer tree. Only this failure needs a new Canvas.
        boundaryFailed.current = false;
        renderFailed.current = false;
        setContextLost(false);
        setBoundaryKey(value => value + 1);
      }
      // One attempt per explicit DOM action; a persistent shader failure returns to fallback.
      setRecoveryAttempt(value => value + 1);
    };
    window.addEventListener(RETRY_EVENT, retry);
    return () => { window.removeEventListener(RETRY_EVENT, retry); };
  }, []);
  useEffect(() => {
    if (contextLost) settle({ requestId: props.command.requestId, outcome: 'fallback' });
  }, [contextLost, props.command.requestId, settle]);
  const unavailable = <Unavailable requestId={props.command.requestId} settle={settle} status={status} />;
  return <RendererBoundary key={boundaryKey} fallback={unavailable} onFailure={() => { boundaryFailed.current = true; }}>
    <Canvas className="universe-engine" aria-hidden="true" tabIndex={-1}
      frameloop={props.paused || props.reducedMotion || contextLost ? 'demand' : 'always'}
      dpr={[1, QUALITY_PROFILES[renderQuality].dpr]}
      camera={{ position: [16, 26, 58], fov: 38, near: .1, far: 140 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'default', preserveDrawingBuffer: false }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor('#020205', 0);
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.debug.onShaderError = fail;
      }}>
      <UniverseWorld props={props} renderQuality={renderQuality} settle={settle} status={status}
        contextLost={contextLost} recoveryAttempt={recoveryAttempt} onLost={setContextLost} degrade={degrade} renderFailed={renderFailed} fail={fail} />
    </Canvas>
  </RendererBoundary>;
}
