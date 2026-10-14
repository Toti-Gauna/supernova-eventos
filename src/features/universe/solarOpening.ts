import { MathUtils, Vector3 } from 'three';
import { useLayoutEffect, useState } from 'react';
import { PLANETS } from './scene.config';

interface Pose { position: Vector3; target: Vector3 }
const tangent = Math.tan(MathUtils.degToRad(19));
const smooth = (value: number) => { const t = MathUtils.clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

/** Match the SVG's meet scaling, including its letterbox, before revealing WebGL. */
export function solarOpeningPose(width: number, height: number): Pose {
  const bounds = Array.from(document.querySelectorAll('.intro-orbital-map')).reverse()
    .map(element => element.getBoundingClientRect()).find(rect => rect.width > 0 && rect.height > 0);
  const mapWidth = bounds?.width ?? Math.min(560, width - 48);
  const mapHeight = bounds?.height ?? (width < 380 ? 235 : width < 601 ? 270 : height < 650 ? 255 : 330);
  const scale = Math.min(mapWidth / 480, mapHeight / 380);
  const units = PLANETS.explore.radius / 14;
  const distance = height * units / (2 * scale * tangent);
  const earthX = (bounds ? bounds.left + bounds.width / 2 : width / 2) + 60 * scale;
  const earthY = (bounds ? bounds.top + bounds.height / 2 : height * .36) - 33 * scale;
  const x = -(earthX / width * 2 - 1) * distance * tangent * width / height;
  const y = -(1 - earthY / height * 2) * distance * tangent;
  return { position: new Vector3(x, y, distance), target: new Vector3(x, y, 0) };
}

/** Replay mounts its portal after the Canvas; remeasure once the actual map exists. */
export function useSolarOpeningPose(width: number, height: number, requestId: number) {
  const [pose, setPose] = useState(() => solarOpeningPose(width, height));
  useLayoutEffect(() => {
    let frame = 0;
    let observed: Element | null = null;
    const resize = new ResizeObserver(() => schedule());
    const measure = () => {
      frame = 0;
      const map = Array.from(document.querySelectorAll('.intro-orbital-map')).reverse().find(element => element.getBoundingClientRect().width > 0);
      if (!map) return; // Keep this opening's reference after its portal disappears.
      if (observed !== map) { resize.disconnect(); resize.observe(map); observed = map; }
      const next = solarOpeningPose(width, height);
      setPose(previous => previous.position.distanceToSquared(next.position) < .0001 ? previous : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const mutation = new MutationObserver(schedule);
    mutation.observe(document.body, { childList: true, subtree: true });
    measure();
    return () => { mutation.disconnect(); resize.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [width, height, requestId]);
  return pose;
}

/** First approach Earth in-place; then land in the measured hero slot. */
export function frameSolarArrival(output: Pose, from: Pose, to: Pose, elapsed: number) {
  const zoom = smooth((elapsed - 1200) / 1250);
  const landing = smooth((elapsed - 2450) / 800);
  const fromDistance = from.position.z - from.target.z;
  const toDistance = to.position.z - to.target.z;
  const closest = toDistance * .84;
  const distance = elapsed < 2450 ? fromDistance * Math.pow(closest / fromDistance, zoom)
    : closest * Math.pow(toDistance / closest, landing);
  // Interpolate screen position, not world-space offsets, to avoid drifting as depth changes.
  output.target.set(
    MathUtils.lerp(from.target.x / fromDistance, to.target.x / toDistance, landing) * distance,
    MathUtils.lerp(from.target.y / fromDistance, to.target.y / toDistance, landing) * distance, 0);
  output.position.copy(output.target); output.position.z = distance;
}
