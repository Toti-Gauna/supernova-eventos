import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';

/** A deterministic buffer: no DOM nodes, assets or random allocation in the frame loop. */
function StarLayer({ count, layer, animated }: { count: number; layer: number; animated: boolean }) {
  const stars = useRef<Points>(null);
  const buffers = useMemo(() => {
    const position = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    let seed = 62417 + layer * 337;
    const random = () => {
      seed = Math.imul(seed, 1664525) + 1013904223 | 0;
      return (seed >>> 0) / 4294967296;
    };
    for (let index = 0; index < count; index++) {
      const azimuth = random() * Math.PI * 2;
      const vertical = random() * 2 - 1;
      const radial = Math.sqrt(1 - vertical * vertical);
      const distance = [35, 58, 82][layer] + random() * [18, 20, 15][layer];
      position[index * 3] = Math.cos(azimuth) * radial * distance;
      position[index * 3 + 1] = vertical * distance;
      position[index * 3 + 2] = Math.sin(azimuth) * radial * distance - 18;
      const intensity = .22 + Math.pow(random(), 3) * .44;
      color[index * 3] = intensity * (layer === 0 ? 1 : .86);
      color[index * 3 + 1] = intensity * .92;
      color[index * 3 + 2] = intensity * (layer === 0 ? .88 : 1);
    }
    return { position, color };
  }, [count, layer]);

  useFrame((_, delta) => {
    if (animated && stars.current) stars.current.rotation.y += Math.min(delta, .05) * [.00045, .00022, .00008][layer];
  });

  return <points ref={stars} name={`supernova-starfield-layer-${layer}`} frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[buffers.position, 3]} />
      <bufferAttribute attach="attributes-color" args={[buffers.color, 3]} />
    </bufferGeometry>
    <pointsMaterial size={[.07, .085, .10][layer]} sizeAttenuation vertexColors transparent opacity={[.54, .45, .36][layer]} depthWrite={false} />
  </points>;
}

/** Three finite depth buffers share the quality star budget. */
export default function Starfield({ count, animated }: { count: number; animated: boolean }) {
  const near = Math.floor(count * .18);
  const middle = Math.floor(count * .32);
  return <group name="supernova-starfield">
    <StarLayer count={near} layer={0} animated={animated} />
    <StarLayer count={middle} layer={1} animated={animated} />
    <StarLayer count={count - near - middle} layer={2} animated={animated} />
  </group>;
}
