import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import type { UniverseCommand, UniverseSettled } from './contracts';
import { destinationBody, destinationKey, SHIP_CENTER, SOLAR_CAMERA, SOLAR_TARGET, PLANETS, travelDuration } from './scene.config';
import { frameSolarArrival, useSolarOpeningPose } from './solarOpening';

interface SurfaceFrame { left: number; top: number; width: number; height: number; composition: string }
interface CameraPose { position: Vector3; target: Vector3 }
interface Flight {
  command: UniverseCommand;
  duration: number;
  from: CameraPose;
  to: CameraPose;
  control: CameraPose;
  solar: boolean;
}

const smooth = (value: number) => value * value * value * (value * (value * 6 - 15) + 10);

function useSurfaceFrame(key: string, requestId: number, width: number, height: number) {
  const [frame, setFrame] = useState<SurfaceFrame | null>(null);
  useLayoutEffect(() => {
    let scheduled = 0;
    let observed: Element | null = null;
    const resize = new ResizeObserver(() => schedule());
    const measure = () => {
      scheduled = 0;
      const candidates = Array.from(document.querySelectorAll(key.startsWith('event-')
        ? '[data-universe-surface="event"]' : '[data-universe-surface]'));
      const surface = candidates.reverse().find(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      if (surface !== observed) {
        resize.disconnect();
        if (surface) resize.observe(surface);
        observed = surface ?? null;
      }
      const box = surface?.getBoundingClientRect();
      const next = box ? { left: box.left, top: box.top, width: box.width, height: box.height,
        composition: surface?.getAttribute('data-universe-composition') ?? '' } : null;
      setFrame(previous => previous && next && Math.abs(previous.left - next.left) < .5 &&
        Math.abs(previous.top - next.top) < .5 && Math.abs(previous.width - next.width) < .5 &&
        Math.abs(previous.height - next.height) < .5 && previous.composition === next.composition ? previous : next);
    };
    const schedule = () => {
      if (!scheduled) scheduled = window.requestAnimationFrame(measure);
    };
    const mutation = new MutationObserver(schedule);
    mutation.observe(document.body, { subtree: true, childList: true, attributes: true,
      attributeFilter: ['data-universe-composition'] });
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule, { passive: true });
    // Re-read during the layout commit for every intention, including form → pass
    // which keeps the same event key. The cue's first rendered frame uses its new slot.
    measure();
    return () => {
      resize.disconnect(); mutation.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (scheduled) window.cancelAnimationFrame(scheduled);
    };
  }, [key, requestId, width, height]);
  return frame;
}

function destinationPose(command: UniverseCommand, width: number, height: number, slot: SurfaceFrame | null): CameraPose {
  const destination = command.destination;
  const position = new Vector3();
  const target = new Vector3();
  if (destination.kind === 'studio') {
    position.set(...SHIP_CENTER).add(new Vector3(0, 1.3, 1.8));
    target.set(...SHIP_CENTER).add(new Vector3(0, 1.15, -3.5));
    return { position, target };
  }
  const body = destinationBody(destination);
  const mobile = width < 768;
  let centerX = width * (mobile ? .74 : .78);
  let centerY = height * (mobile ? .26 : .32);
  let diameter = width * (mobile ? .45 : .245);
  if (destination.kind === 'event' && !slot) {
    centerX = width * (mobile ? .66 : .77);
    centerY = height * (mobile ? .23 : .4);
    diameter = Math.min(width * (mobile ? .48 : .28), height * .48);
  } else if (slot) {
    centerX = slot.left + slot.width * .51;
    centerY = slot.top + slot.height * .46;
    const section = destination.kind === 'section' && destination.view !== 'explore';
    const desktopHero = destination.kind === 'section' && destination.view === 'explore' && !mobile;
    diameter = Math.min(slot.width * (destination.kind === 'event' ? .8 : section ? mobile ? .70 : .80 : desktopHero ? .78 : .62),
      slot.height * (destination.kind === 'event' ? 1.15 : section ? mobile ? .88 : .96 : desktopHero ? .93 : .72));
    if (desktopHero) diameter = Math.min(diameter, 230, width * .19);
    if (section && slot.composition === 'section-compact') {
      diameter = Math.min(slot.width * (destination.kind === 'section' && destination.view === 'favorites' ? .48 : .65), slot.height * .82);
    }
    if (destination.kind === 'event') {
      const pass = slot.composition === 'pass';
      // The compact pass keeps the complete orbital cue inside its reserved margin.
      diameter = pass ? Math.min(slot.width * .48, slot.height * .50) : diameter;
      if (!pass) diameter = Math.min(diameter, mobile ? 72 : 96);
      centerX = pass ? centerX : slot.left + slot.width - (mobile ? 48 : 80);
      centerY = slot.top + slot.height * .50;
    }
  }
  if (destination.kind === 'section' && destination.view === 'profile') diameter *= .74;
  if (destination.kind === 'section' && destination.view === 'admin') diameter *= .98;
  const tangent = Math.tan(MathUtils.degToRad(38 / 2));
  const minimumDiameter = destination.kind === 'event' && slot?.composition === 'pass'
    ? Math.max(24, body.radius * height / (125 * tangent)) : 70;
  diameter = Math.max(minimumDiameter, diameter);
  const distance = body.radius * height / (diameter * tangent);
  const normalizedX = centerX / width * 2 - 1;
  const normalizedY = 1 - centerY / height * 2;
  const offsetX = -normalizedX * distance * tangent * width / height;
  const offsetY = -normalizedY * distance * tangent;
  if (destination.kind === 'section' && destination.view === 'admin') {
    // Orbit the craft, keeping the same measured screen center and a readable three-quarter bow.
    const yaw = .50;
    const pitch = .28;
    // Translate both ends in the camera's right/up basis so framing never changes its angle.
    target.set(body.center[0] + Math.cos(yaw) * offsetX - Math.sin(yaw) * Math.sin(pitch) * offsetY,
      body.center[1] + Math.cos(pitch) * offsetY,
      body.center[2] - Math.sin(yaw) * offsetX - Math.cos(yaw) * Math.sin(pitch) * offsetY);
    position.copy(target).add(new Vector3(Math.sin(yaw) * Math.cos(pitch) * distance,
      Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance));
  } else {
    position.set(body.center[0] + offsetX, body.center[1] + offsetY, body.center[2] + distance);
    target.set(body.center[0] + offsetX, body.center[1] + offsetY, body.center[2]);
  }
  return { position, target };
}

function quadratic(output: Vector3, from: Vector3, control: Vector3, to: Vector3, progress: number) {
  const inverse = 1 - progress;
  output.copy(from).multiplyScalar(inverse * inverse);
  output.addScaledVector(control, 2 * inverse * progress);
  output.addScaledVector(to, progress * progress);
}

export default function CameraRig({ command, reducedMotion, paused, settle }: {
  command: UniverseCommand; reducedMotion: boolean; paused: boolean;
  settle: (result: UniverseSettled) => void;
}) {
  const { camera, size, invalidate, gl } = useThree();
  const key = destinationKey(command.destination);
  const slot = useSurfaceFrame(key, command.requestId, size.width, size.height);
  const base = useRef<CameraPose>({ position: new Vector3(...SOLAR_CAMERA), target: new Vector3(...SOLAR_TARGET) });
  const confirmationPose = useRef<{ requestId: number; pose: CameraPose } | null>(null);
  const finalPose = useMemo(() => {
    if (command.reason !== 'registration-success' || slot?.composition === 'pass') {
      return destinationPose(command, size.width, size.height, slot);
    }
    if (confirmationPose.current?.requestId !== command.requestId) {
      confirmationPose.current = { requestId: command.requestId,
        pose: { position: camera.position.clone(), target: base.current.target.clone() } };
    }
    return confirmationPose.current.pose;
  }, [camera, command, size.width, size.height, slot]);
  const active = useRef<Flight | null>(null);
  const processed = useRef<number | null>(null);
  const debugSample = useRef({ frames: 0, requestId: -1 });
  const projectedBody = useRef(new Vector3());
  const solarPose = useSolarOpeningPose(size.width, size.height, command.requestId);
  const driftPose = useMemo(() => ({ position: new Vector3(14, 24, 54), target: new Vector3(...SOLAR_TARGET) }), []);

  useLayoutEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = 38; camera.near = .1; camera.far = 1000; camera.updateProjectionMatrix();
    }
    camera.up.set(0, 1, 0);
    const alreadyProcessed = processed.current === command.requestId;
    if (!alreadyProcessed) {
      if (active.current) settle({ requestId: active.current.command.requestId, outcome: 'cancelled' });
      processed.current = command.requestId;
      const solar = command.reason === 'boot' || command.reason === 'replay';
      const from = { position: camera.position.clone(), target: base.current.target.clone() };
      if (solar && command.reason === 'boot') {
        from.position.copy(solarPose.position); from.target.copy(solarPose.target);
      }
      const control = {
        position: from.position.clone().lerp(finalPose.position, .5).add(new Vector3(solar ? 0 : 2.4, solar ? 7 : 4.5, 3)),
        target: from.target.clone().lerp(finalPose.target, .5).add(new Vector3(0, 1.2, 0)),
      };
      if (solar) {
        control.position.copy(driftPose.position).lerp(finalPose.position, .5).add(new Vector3(0, 7, 5));
        control.target.copy(driftPose.target).lerp(finalPose.target, .5);
      }
      if (command.reason === 'open-studio') {
        control.position.set(...SHIP_CENTER).add(new Vector3(0, 1.3, 6.3));
        control.target.set(...SHIP_CENTER).add(new Vector3(0, 1.2, .8));
      }
      if (command.reason === 'registration-success') {
        from.position.copy(finalPose.position); from.target.copy(finalPose.target);
        control.position.copy(finalPose.position); control.target.copy(finalPose.target);
      }
      active.current = { command, from, to: finalPose, control, solar, duration: travelDuration(command, size.width < 768) };
    } else if (active.current) {
      active.current.to = finalPose;
    }
    if (command.reason === 'registration-success') {
      // Reframing happens once with the pass layout, before its cue; no celebration flight.
      base.current.position.copy(finalPose.position); base.current.target.copy(finalPose.target);
      camera.position.copy(finalPose.position); camera.lookAt(finalPose.target);
      if (active.current) {
        active.current.from.position.copy(finalPose.position); active.current.from.target.copy(finalPose.target);
        active.current.control.position.copy(finalPose.position); active.current.control.target.copy(finalPose.target);
        active.current.to = finalPose;
      }
    }
    const elapsed = Math.max(0, performance.now() - command.issuedAtMs);
    if (reducedMotion || paused || elapsed >= travelDuration(command, size.width < 768) || !active.current) {
      base.current.position.copy(finalPose.position); base.current.target.copy(finalPose.target);
      camera.position.copy(finalPose.position); camera.lookAt(finalPose.target);
      if (active.current) {
        active.current = null;
        settle({ requestId: command.requestId, outcome: 'arrived' });
      }
    }
    if (import.meta.env.DEV) {
      gl.domElement.dataset.universeRequest = String(command.requestId);
      gl.domElement.dataset.universeDestination = key;
      gl.domElement.dataset.universeMotion = reducedMotion || paused ? 'static' : 'animated';
      gl.domElement.dataset.universeCamera = `${camera.position.x.toFixed(3)},${camera.position.y.toFixed(3)},${camera.position.z.toFixed(3)}`;
    }
    invalidate();
  }, [camera, command, driftPose, finalPose, gl, invalidate, key, paused, reducedMotion, settle, size.width, solarPose]);



  useFrame(() => {
    const flight = active.current;
    if (flight) {
      const elapsed = Math.max(0, performance.now() - flight.command.issuedAtMs);
      if (elapsed >= flight.duration || paused || reducedMotion) {
        base.current.position.copy(flight.to.position); base.current.target.copy(flight.to.target);
        active.current = null;
        settle({ requestId: flight.command.requestId, outcome: 'arrived' });
      } else if (flight.solar) {
        if (flight.command.destination.kind === 'section' && flight.command.destination.view === 'explore') {
          frameSolarArrival(base.current, solarPose, flight.to, elapsed);
        } else if (elapsed < 450) {
          const progress = smooth(elapsed / 450);
          base.current.position.copy(flight.from.position).lerp(solarPose.position, progress);
          base.current.target.copy(flight.from.target).lerp(solarPose.target, progress);
        } else if (elapsed < 1200) {
          const progress = smooth((elapsed - 450) / 750);
          base.current.position.copy(solarPose.position).lerp(driftPose.position, progress);
          base.current.target.copy(solarPose.target).lerp(driftPose.target, progress);
        } else {
          const progress = smooth(MathUtils.clamp((elapsed - 1200) / 2050, 0, 1));
          quadratic(base.current.position, driftPose.position, flight.control.position, flight.to.position, progress);
          quadratic(base.current.target, driftPose.target, flight.control.target, flight.to.target, progress);
        }
      } else {
        const progress = smooth(MathUtils.clamp(elapsed / flight.duration, 0, 1));
        quadratic(base.current.position, flight.from.position, flight.control.position, flight.to.position, progress);
        quadratic(base.current.target, flight.from.target, flight.control.target, flight.to.target, progress);
      }
    }
    camera.position.copy(base.current.position);
    camera.lookAt(base.current.target);
    if (import.meta.env.DEV) {
      const sample = debugSample.current;
      sample.frames++;
      if (flight?.solar || sample.requestId !== command.requestId || sample.frames % 12 === 0 ||
        (flight && !active.current) || paused || reducedMotion) {
        sample.requestId = command.requestId;
        gl.domElement.dataset.universeCamera = `${camera.position.x.toFixed(3)},${camera.position.y.toFixed(3)},${camera.position.z.toFixed(3)}`;
        camera.updateMatrixWorld();
        const point = projectedBody.current.set(...destinationBody(command.destination).center).project(camera);
        gl.domElement.dataset.universeBodyScreen = `${((point.x + 1) * size.width / 2).toFixed(2)},${((1 - point.y) * size.height / 2).toFixed(2)}`;
        const earth = projectedBody.current.set(...PLANETS.explore.center).project(camera);
        const depth = Math.max(.01, camera.position.z);
        const diameter = PLANETS.explore.radius * size.height / (depth * Math.tan(MathUtils.degToRad(19)));
        gl.domElement.dataset.universeEarthScreen = `${((earth.x + 1) * size.width / 2).toFixed(2)},${((1 - earth.y) * size.height / 2).toFixed(2)},${diameter.toFixed(2)}`;
        gl.domElement.dataset.universeEarthDepth = depth.toFixed(2);
        gl.domElement.dataset.universeCameraFar = String(camera.far);
      }
    }
    if (active.current && !paused && !reducedMotion) invalidate();
  }, -1);
  return null;
}
