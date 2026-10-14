import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, type Group, type Points, type PointsMaterial } from 'three';
import type { UniverseCommand } from './contracts';
import { travelDuration, type RenderQuality } from './scene.config';

/** A bounded pool tied to the current request, never to business counts. */
export default function TravelParticles({ command, quality, animated }: {
  command: UniverseCommand; quality: RenderQuality; animated: boolean;
}) {
  const group = useRef<Group>(null);
  const points = useRef<Points>(null);
  const { camera, size, gl } = useThree();
  const count = quality === 'high' ? 64 : quality === 'balanced' ? 32 : 12;
  const buffer = useMemo(() => {
    const position = new Float32Array(count * 3);
    const starts = new Float32Array(count * 3);
    let seed = 7833;
    const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
    for (let index = 0; index < count; index++) {
      const angle = random() * Math.PI * 2;
      const radius = 2.2 + random() * 3.4;
      starts[index * 3] = Math.cos(angle) * radius;
      starts[index * 3 + 1] = Math.sin(angle) * radius;
      starts[index * 3 + 2] = -3 - random() * 14;
    }
    return { position, starts };
  }, [count]);
  useFrame(() => {
    const elapsed = Math.max(0, performance.now() - command.issuedAtMs);
    const solar = command.reason === 'boot' || command.reason === 'replay';
    const start = solar ? 1200 : 80;
    const duration = travelDuration(command, size.width < 768);
    const flight = command.reason !== 'registration-success' && animated && elapsed > start && elapsed < duration - 70;
    if (group.current) group.current.visible = flight;
    if (import.meta.env.DEV) gl.domElement.dataset.universeTrailCount = flight ? String(count) : '0';
    if (!flight || !group.current || !points.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
    const progress = MathUtils.clamp((elapsed - start) / (duration - start), 0, 1);
    for (let index = 0; index < count; index++) {
      const offset = index * 3;
      buffer.position[offset] = buffer.starts[offset] * (1 + progress * .25);
      buffer.position[offset + 1] = buffer.starts[offset + 1] * (1 + progress * .25);
      buffer.position[offset + 2] = buffer.starts[offset + 2] + progress * 3.5;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    (points.current.material as PointsMaterial).opacity = Math.sin(progress * Math.PI) * .30;
  });
  return <group ref={group} visible={false} name="finite-flight-particles">
    <points ref={points} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[buffer.position, 3]} /></bufferGeometry>
      <pointsMaterial color="#d8cced" size={.021} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
  </group>;
}
