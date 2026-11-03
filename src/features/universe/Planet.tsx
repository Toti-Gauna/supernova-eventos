import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Color, DoubleSide, FrontSide, Object3D, RepeatWrapping, SRGBColorSpace, TextureLoader, type Group, type InstancedMesh } from 'three';
import { atmosphereFragment, planetFragment, planetVertex, ringFragment, ringVertex } from './shaders/planet';
import { CATEGORY_TINT_MIX, CATEGORY_TINTS, QUALITY_PROFILES, SOLAR_BODIES, stableHash, type PlanetSpec, type RenderQuality } from './scene.config';
import { solarCloudArtwork, solarSurfaceArtwork } from '../hybrid/HybridArtwork';
import type { EventCategory } from '../../types';
import type { DestinationHighlight } from './useDestinationHighlight';

interface PlanetProps {
  spec: PlanetSpec;
  quality: RenderQuality;
  detailed: boolean;
  animated: boolean;
  highlight: RefObject<DestinationHighlight>;
  satellites?: readonly { eventId: string; category: EventCategory }[];
}

const SIGNATURES = { strata: 0, continents: 1, network: 2, plateaus: 3, grooves: 4 };
// Favorite moons carry their event's Órbita category color.
const CATEGORY_COLORS = Object.fromEntries(Object.entries(CATEGORY_TINTS)
  .map(([category, tint]) => [category, tint.color])) as Record<EventCategory, string>;

/** One shared geometry and material for every moon/favorite at this destination. */
function Satellites({ spec, satellites, segments }: {
  spec: PlanetSpec; satellites: NonNullable<PlanetProps['satellites']>; segments: number;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const instances = useMemo(() => {
    const decorative = Array.from({ length: spec.moons ?? 0 }, (_, index) => ({
      angle: [.3, 1.8, 3.4, 5][index] ?? .5,
      radius: spec.solarBody === 'jupiter' ? [2.55, 2.9, 3.25, 3.65][index] : spec.radius + .85,
      size: [.14, .12, .2, .17][index] ?? .18,
      tilt: [.17, -.15, .21, -.18][index] ?? 0,
      color: spec.solarBody === 'jupiter' ? ['#b4a077', '#c5c1b5', '#9a9385', '#746d62'][index] : spec.rim,
    }));
    return [...decorative, ...satellites.slice(0, 8).map((satellite, index) => ({
      angle: (stableHash(satellite.eventId) % 360) / 360 * Math.PI * 2 + .45,
      radius: spec.radius * (1.82 + (stableHash(satellite.eventId) >>> 8) % 9 * .025),
      size: .08 + stableHash(satellite.eventId) % 7 * .008,
      tilt: index % 2 ? -.23 : .19,
      color: CATEGORY_COLORS[satellite.category],
    }))];
  }, [satellites, spec.key, spec.solarBody, spec.moons, spec.radius, spec.rim]);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    instances.forEach((instance, index) => {
      transform.position.set(Math.cos(instance.angle) * instance.radius,
        Math.sin(instance.angle) * instance.radius * Math.sin(instance.tilt),
        Math.sin(instance.angle) * instance.radius * Math.cos(instance.tilt));
      transform.scale.setScalar(instance.size);
      transform.updateMatrix();
      mesh.current!.setMatrixAt(index, transform.matrix);
      mesh.current!.setColorAt(index, new Color(instance.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [instances]);
  if (!instances.length) return null;
  return <instancedMesh ref={mesh} args={[undefined, undefined, instances.length]} name="destination-satellites">
    <sphereGeometry args={[1, segments, Math.max(8, segments - 4)]} />
    <meshStandardMaterial roughness={.92} metalness={.025} />
  </instancedMesh>;
}

function FragmentRing({ radius, color }: { radius: number; color: string }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    for (let index = 0; index < 18; index++) {
      const angle = index / 18 * Math.PI * 2;
      const orbitRadius = radius * (1.51 + Math.sin(index * 2.7) * .018);
      transform.position.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius);
      transform.rotation.set(Math.sin(index) * .12, -angle, Math.cos(index * 1.3) * .1);
      transform.scale.set(1.3 + Math.sin(index * 3.1) * .15, .55, 2 + Math.cos(index) * .18);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [radius]);
  return <group rotation={[.68, .05, -.24]} name="favorites-eighteen-fragments">
    <instancedMesh ref={mesh} args={[undefined, undefined, 18]}>
      <dodecahedronGeometry args={[radius * .063, 0]} />
      <meshStandardMaterial color={color} roughness={.95} metalness={.03} transparent opacity={.37} depthWrite={false} />
    </instancedMesh>
  </group>;
}

function Observatory({ radius }: { radius: number }) {
  return <group position={[radius * 1.58, radius * .28, .4]} rotation={[.13, -.3, -.08]} name="profile-orbital-observatory">
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[.11, .11, .75, 10]} />
      <meshStandardMaterial color="#9aa1af" metalness={.55} roughness={.65} />
    </mesh>
    <mesh position={[0, .15, 0]} scale={[.31, .24, .31]}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color="#576170" emissive="#aabed5" emissiveIntensity={.16} metalness={.4} roughness={.3} />
    </mesh>
    <mesh position={[0, -.06, 0]}>
      <boxGeometry args={[1.15, .035, .27]} />
      <meshStandardMaterial color="#303545" metalness={.4} roughness={.7} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[.34, .012, 4, 30]} />
      <meshBasicMaterial color="#9caac2" transparent opacity={.5} />
    </mesh>
  </group>;
}

function Landmark({ spec }: { spec: PlanetSpec }) {
  const color = spec.rim;
  return <group position={[spec.radius * -.18, spec.radius * .88, spec.radius * .43]} rotation={[.38, .18, -.1]} name="event-landmark">
    {spec.signature === 'network' ? <mesh rotation={[0, 0, Math.PI * .12]}>
      <torusGeometry args={[.19, .018, 5, 24, Math.PI * 1.65]} />
      <meshStandardMaterial color={color} metalness={.12} roughness={.8} />
    </mesh> : <mesh scale={spec.signature === 'plateaus' ? [1.35, .35, 1.1] : [1, 1, 1]}>
      <boxGeometry args={[.085, spec.signature === 'grooves' ? .29 : .17, .075]} />
      <meshStandardMaterial color={color} metalness={.05} roughness={.85} />
    </mesh>}
  </group>;
}

export default function Planet({ spec, quality, detailed, animated, highlight, satellites = [] }: PlanetProps) {
  const surface = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  const phase = useRef(0);
  const definition = SOLAR_BODIES[spec.solarBody];
  const [surfaceTexture, cloudTexture] = useLoader(TextureLoader, [solarSurfaceArtwork(spec.solarBody), solarCloudArtwork(spec.solarBody)]);
  surfaceTexture.colorSpace = SRGBColorSpace;
  cloudTexture.colorSpace = SRGBColorSpace;
  surfaceTexture.wrapS = RepeatWrapping;
  cloudTexture.wrapS = RepeatWrapping;
  const profile = QUALITY_PROFILES[quality];
  const segments = detailed ? profile.segments : 18;
  const material = useMemo(() => ({
    uDark: { value: new Color(spec.dark) }, uMineral: { value: new Color(spec.mineral) },
    uRim: { value: new Color(spec.rim) }, uSeed: { value: spec.seed },
    uSignature: { value: SIGNATURES[spec.signature ?? 'strata'] }, uHighlight: { value: 0 },
    uSurface: { value: surfaceTexture }, uClouds: { value: cloudTexture }, uSolarBody: { value: definition.index }, uPhase: { value: 0 },
    uTint: { value: new Color(spec.tint ?? spec.rim) }, uTintMix: { value: spec.tint ? CATEGORY_TINT_MIX : 0 },
  }), [spec.dark, spec.mineral, spec.rim, spec.tint, spec.seed, spec.signature, surfaceTexture, cloudTexture, definition.index]);
  const inner = spec.radius * (spec.solarBody === 'saturn' ? 1.35 : 1.42);
  const outer = spec.radius * (spec.solarBody === 'saturn' ? 2.02 : 1.512);
  const ringMaterial = useMemo(() => ({
    uColor: { value: new Color(spec.rim) }, uInner: { value: inner }, uOuter: { value: outer }, uFragmented: { value: 0 },
    uSolarBody: { value: definition.index },
  }), [inner, outer, spec.rim, definition.index]);
  const publicKey = spec.key.startsWith('event-') ? `event:${spec.key.slice(6)}` : `section:${spec.key}`;

  useLayoutEffect(() => {
    phase.current = 0;
    if (surface.current) surface.current.rotation.y = 0;
  }, [spec.key]);
  useFrame(({ gl }, delta) => {
    const selected = highlight.current.key === publicKey ? 1 : 0;
    material.uHighlight.value = animated ? material.uHighlight.value + (selected - material.uHighlight.value) * (1 - Math.exp(-Math.min(delta, .05) * 8)) : selected;
    const boundedDelta = Math.min(delta, .05);
    if (animated && detailed) {
      phase.current += boundedDelta * (spec.rotationSpeed ?? definition.rotationSpeed);
      if (surface.current) surface.current.rotation.y = phase.current;
      if (orbit.current) orbit.current.rotation.y += boundedDelta * .065;
    }
    material.uPhase.value = phase.current;
    if (detailed) {
      gl.domElement.dataset.solarBody = spec.solarBody;
      gl.domElement.dataset.solarLabel = spec.label;
      gl.domElement.dataset.solarAnimationPhase = phase.current.toFixed(5);
      gl.domElement.dataset.solarAnimationRunning = String(animated);
      gl.domElement.dataset.solarMoonCount = String(spec.moons ?? 0);
    }
  });

  return <group position={spec.center} name={`planet-${spec.key}`}>
    <group ref={surface} rotation={[.06, 0, spec.axialTilt ?? definition.axialTilt]}>
      <mesh>
        <sphereGeometry args={[spec.radius, segments, Math.floor(segments * .7)]} />
        <shaderMaterial uniforms={material} vertexShader={planetVertex} fragmentShader={planetFragment} />
      </mesh>
      {detailed && quality !== 'low' && spec.solarBody !== 'mercury' && <mesh scale={spec.solarBody === 'mars' ? 1.012 : 1.025}>
        <sphereGeometry args={[spec.radius, segments, Math.floor(segments * .7)]} />
        <shaderMaterial uniforms={material} vertexShader={planetVertex} fragmentShader={atmosphereFragment} transparent depthWrite={false} side={FrontSide} />
      </mesh>}
      {detailed && spec.key.startsWith('event-') && quality !== 'low' && <Landmark spec={spec} />}
    </group>
    {spec.ring === 'continuous' && <group rotation={[0, 0, spec.solarBody === 'uranus' ? 1.35 : -.46]} name={`solar-${spec.solarBody}-rings`}>
      <mesh rotation={[1.12, -.16, 0]}>
        <ringGeometry args={[inner, outer, detailed ? 128 : 48]} />
        <shaderMaterial uniforms={ringMaterial} vertexShader={ringVertex} fragmentShader={ringFragment} transparent depthWrite={false} side={DoubleSide} />
      </mesh>
    </group>}
    {spec.ring === 'fragmented' && <FragmentRing radius={spec.radius} color={spec.rim} />}
    {detailed && <group ref={orbit} rotation={[.15, .3, -.08]}>
      <Satellites spec={spec} satellites={satellites} segments={profile.moonSegments} />
      {spec.observatory && <Observatory radius={spec.radius} />}
    </group>}
  </group>;
}
