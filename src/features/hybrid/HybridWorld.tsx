import { useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Color, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector3, type Group, type Mesh, type MeshBasicMaterial, type ShaderMaterial } from 'three';
import type { UniverseExperienceProps } from '../universe/contracts';
import { CATEGORY_TINT_MIX, destinationKey, eventPlanet, PLANETS, SHIP_CENTER, SOLAR_BODIES, travelDuration, type SolarBody } from '../universe/scene.config';
import { illustratedPlanetFragment, illustratedPlanetVertex } from '../universe/shaders/planet';
import { CABIN_BACK, CABIN_FRONT, MAP_ART, MOON_ART, planetArtwork, solarBodyArtwork, solarCloudArtwork, solarSurfaceArtwork, SHIP_ART, SUN_ART, type ArtworkColor } from './HybridArtwork';

export function Illustration({ art, width, height, opacity = 1, z = 0 }: { art: string; width: number; height: number; opacity?: number; z?: number }) {
  const texture = useLoader(TextureLoader, art);
  texture.colorSpace = SRGBColorSpace;
  return <mesh position={[0, 0, z]} name="hybrid-illustration-plane">
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
  </mesh>;
}

function Billboard({ position, children, enabled = true }: { position: [number, number, number]; children: React.ReactNode; enabled?: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ camera }) => { if (enabled && group.current) group.current.quaternion.copy(camera.quaternion); });
  return <group ref={group} position={position}>{children}</group>;
}

function SolarSurface({ body, radius, animated, observable, moons, tint, rim }: {
  body: SolarBody; radius: number; animated: boolean; observable: boolean; moons: number; tint?: string; rim?: string;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const phase = useRef(0);
  const definition = SOLAR_BODIES[body];
  const [surface, clouds] = useLoader(TextureLoader, [solarSurfaceArtwork(body), solarCloudArtwork(body)]);
  surface.colorSpace = SRGBColorSpace;
  clouds.colorSpace = SRGBColorSpace;
  surface.wrapS = RepeatWrapping;
  clouds.wrapS = RepeatWrapping;
  const uniforms = useMemo(() => ({
    uSurface: { value: surface }, uClouds: { value: clouds }, uPhase: { value: 0 },
    uSolarBody: { value: definition.index }, uTilt: { value: definition.axialTilt },
    uRim: { value: new Color(rim ?? definition.rim) }, uOpacity: { value: 1 },
    uTint: { value: new Color(tint ?? definition.rim) }, uTintMix: { value: tint ? CATEGORY_TINT_MIX : 0 },
  }), [surface, clouds, definition, tint, rim]);
  useFrame(({ gl }, delta) => {
    let visible = true;
    for (let ancestor = mesh.current; ancestor; ancestor = ancestor.parent as Mesh | null) if (!ancestor.visible) { visible = false; break; }
    if (animated && visible) phase.current += Math.min(delta, .05) * definition.rotationSpeed;
    uniforms.uPhase.value = phase.current;
    uniforms.uOpacity.value = material.current?.opacity ?? 1;
    if (observable) {
      gl.domElement.dataset.solarBody = body;
      gl.domElement.dataset.solarLabel = definition.label;
      gl.domElement.dataset.solarAnimationPhase = phase.current.toFixed(5);
      gl.domElement.dataset.solarAnimationRunning = String(animated && visible);
      gl.domElement.dataset.solarMoonCount = String(moons);
    }
  });
  const scale = radius / 1.4;
  return <mesh ref={mesh} name="hybrid-solar-surface-plane">
    <planeGeometry args={[6 * scale, 4 * scale]} />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={illustratedPlanetVertex} fragmentShader={illustratedPlanetFragment} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}

export function IllustratedPlanet({ color = 'blue', solarBody, radius, ring = false, moons = 0, satellites = 0, animated, polished = true, observable = false, tint, rim }: {
  color?: ArtworkColor; solarBody?: SolarBody; radius: number; ring?: boolean; moons?: number; satellites?: number; animated: boolean; polished?: boolean; observable?: boolean;
  /** Event planets only: Órbita category hue and its rim light. */
  tint?: string; rim?: string;
}) {
  const body = useMemo(() => planetArtwork(color, 'body', ring, polished), [color, ring, polished]);
  const back = useMemo(() => solarBody ? solarBodyArtwork(solarBody, 'back', rim) : planetArtwork(color, 'back', ring, polished), [color, ring, polished, solarBody, rim]);
  const front = useMemo(() => solarBody ? solarBodyArtwork(solarBody, 'front', rim) : planetArtwork(color, 'front', ring, polished), [color, ring, polished, solarBody, rim]);
  const halo = useMemo(() => solarBody ? solarBodyArtwork(solarBody, 'halo', rim) : '', [solarBody, rim]);
  const orbit = useRef<Group>(null);
  const scale = radius / 1.4;
  useFrame((_, delta) => {
    if (animated && orbit.current) {
      let visible = true;
      for (let ancestor: Group | null = orbit.current; ancestor; ancestor = ancestor.parent as Group | null) if (!ancestor.visible) { visible = false; break; }
      if (visible) orbit.current.rotation.z += Math.min(delta, .05) * (solarBody ? .055 : .016);
    }
  });
  return <group name={`hybrid-${solarBody ?? color}-planet`}>
    {ring && <Illustration art={back} width={6 * scale} height={4 * scale} z={-.04} />}
    {solarBody ? <><SolarSurface key={solarBody} body={solarBody} radius={radius} animated={animated} observable={observable} moons={moons} tint={tint} rim={rim} /><Illustration art={halo} width={6 * scale} height={4 * scale} z={.02} /></> : <Illustration art={body} width={6 * scale} height={4 * scale} />}
    {ring && <Illustration art={front} width={6 * scale} height={4 * scale} z={.04} />}
    <group ref={orbit}>
      {Array.from({ length: moons + satellites }, (_, index) => {
        const angle = solarBody === 'jupiter' ? [.35, 1.8, 3.4, 5][index] ?? index * 2.4 : index * 2.4 + .8;
        const distance = radius * (solarBody === 'jupiter' && index < moons ? 1.28 + index * .13 : 1.25 + index % 3 * .19);
        const size = radius * (index < moons ? solarBody === 'jupiter' ? [.075, .063, .105, .09][index] : .19 : .075);
        return <group key={index} position={[Math.cos(angle) * distance, Math.sin(angle) * distance * .75, .12 + index % 3 * .09]}>
          <Illustration art={MOON_ART} width={size * 2} height={size * 2} />
        </group>;
      })}
    </group>
  </group>;
}

function SolarIllustrations({ startedAtMs, animated }: { startedAtMs: number; animated: boolean }) {
  const group = useRef<Group>(null);
  const u = PLANETS.explore.radius / 14;
  useFrame(() => {
    if (!group.current) return;
    const elapsed = performance.now() - startedAtMs;
    const opacity = animated ? Math.max(0, Math.min(1, (1900 - elapsed) / 450)) : 0;
    group.current.visible = opacity > 0;
    group.current.traverse(object => {
      if ('material' in object) (object.material as MeshBasicMaterial).opacity = opacity;
    });
  });
  const points = [
    { x: 149, y: 218, radius: 12, solarBody: 'jupiter' as const, ring: false, moons: 4 },
    { x: 405, y: 168, radius: 9.5, solarBody: 'saturn' as const, ring: true, moons: 0 },
    { x: 202, y: 111, radius: 4.8, solarBody: 'mercury' as const, ring: false, moons: 0 },
    { x: 270, y: 236, radius: 5.5, solarBody: 'venus' as const, ring: false, moons: 0 },
    { x: 201, y: 242, radius: 5.8, solarBody: 'mars' as const, ring: false, moons: 0 },
    { x: 73, y: 254, radius: 6.5, solarBody: 'uranus' as const, ring: true, moons: 0 },
    { x: 407, y: 110, radius: 7, solarBody: 'neptune' as const, ring: false, moons: 0 },
  ];
  return <group ref={group} name="hybrid-solar-loader">
    <group position={[-60 * u, -33 * u, -.03]}><Illustration art={MAP_ART} width={480 * u} height={380 * u} /></group>
    <group position={[-60 * u, -28 * u, .01]}><Illustration art={SUN_ART} width={200 * u} height={200 * u} /></group>
    {points.map(point => <group key={point.x} position={[(point.x - 300) * u, (157 - point.y) * u, 0]}>
      <IllustratedPlanet solarBody={point.solarBody} radius={point.radius * u} ring={point.ring} moons={point.moons} animated={false} />
    </group>)}
  </group>;
}

// Success cue in the Órbita category color (docs/orbita/README.md).
const EVENT_COLORS = { Música: 'rose', Bienestar: 'teal', Tecnología: 'cyan', Comunidad: 'violet', Aprendizaje: 'blue' } as const satisfies Record<string, ArtworkColor>;

function Cockpit({ active, animated }: { active: boolean; animated: boolean }) {
  const back = useRef<Group>(null);
  const front = useRef<Group>(null);
  const { viewport, size } = useThree();
  const arrival = useMemo(() => new Vector3(SHIP_CENTER[0], SHIP_CENTER[1] + 1.3, SHIP_CENTER[2] + 1.8), []);
  useFrame(({ camera }) => {
    if (!back.current || !front.current) return;
    const inside = active && camera.position.distanceTo(arrival) < 7;
    back.current.visible = inside;
    front.current.visible = inside;
    if (!inside) return;
    const v = viewport.getCurrentViewport(camera, back.current.position);
    const scaleX = v.width * (size.width < 768 ? 1.08 : 1);
    const scaleY = v.height;
    back.current.scale.set(scaleX, scaleY, 1);
    front.current.scale.set(scaleX * .93, scaleY * .93, 1);
    // Fixed art at different depths: camera motion produces genuine parallax.
    if (!animated) { back.current.rotation.set(0, 0, 0); front.current.rotation.set(0, 0, 0); }
  });
  return <group name="hybrid-illustrated-flight-deck">
    <group ref={back} position={[SHIP_CENTER[0], SHIP_CENTER[1] + 1.3, SHIP_CENTER[2] - 1.6]} visible={false}>
      <Illustration art={CABIN_BACK} width={1} height={1} />
    </group>
    <group ref={front} position={[SHIP_CENTER[0], SHIP_CENTER[1] + 1.3, SHIP_CENTER[2] - .7]} visible={false}>
      <Illustration art={CABIN_FRONT} width={1} height={1} />
    </group>
  </group>;
}

export default function HybridWorld({ command, favoriteSatellites, reducedMotion, paused }: UniverseExperienceProps) {
  const activeKey = destinationKey(command.destination);
  const history = useRef({ current: activeKey, previous: activeKey });
  if (history.current.current !== activeKey) history.current = { current: activeKey, previous: history.current.current };
  const opening = command.reason === 'boot' || command.reason === 'replay';
  const animated = !reducedMotion && !paused;
  const worlds = useRef<Group>(null);
  const ship = useRef<Group>(null);
  const cue = useRef<Group>(null);
  const event = useMemo(() => command.destination.kind === 'event' ? eventPlanet(command.destination) : null, [command.destination]);
  useFrame(({ camera, gl }) => {
    const elapsed = performance.now() - command.issuedAtMs;
    const flying = animated && elapsed < travelDuration(command, gl.domElement.clientWidth < 768);
    if (worlds.current) for (const world of worlds.current.children) {
      if (!world.name.startsWith('destination:')) continue;
      const worldKey = world.name.slice(12);
      world.visible = opening && animated && elapsed < 2450 ? worldKey === 'explore'
        : worldKey === activeKey || (!opening && flying && worldKey === history.current.previous);
    }
    if (ship.current) ship.current.visible = !(command.destination.kind === 'studio' && camera.position.z < SHIP_CENTER[2] + 5);
    if (cue.current) {
      const progress = elapsed / 550;
      cue.current.visible = command.reason === 'registration-success' && animated && progress < 1;
      cue.current.scale.setScalar(1 + progress * .36);
      cue.current.rotation.z = progress * .25;
      cue.current.traverse(object => { if ('material' in object) (object.material as MeshBasicMaterial).opacity = (1 - progress) * .6; });
    }
    gl.domElement.dataset.hybridCue = String(cue.current?.visible ?? false);
    gl.domElement.dataset.hybridArtwork = activeKey;
    if (activeKey === 'admin' || activeKey === 'studio') {
      gl.domElement.dataset.solarBody = 'spacecraft';
      gl.domElement.dataset.solarLabel = 'Nave';
      gl.domElement.dataset.solarAnimationPhase = '0';
      gl.domElement.dataset.solarAnimationRunning = 'false';
      gl.domElement.dataset.solarMoonCount = '0';
    }
  });
  return <group ref={worlds} name="hybrid-illustrated-universe">
    <group name="destination:explore"><Billboard position={PLANETS.explore.center}>
      <IllustratedPlanet solarBody={PLANETS.explore.solarBody} radius={PLANETS.explore.radius} animated={animated} observable={activeKey === 'explore'} />
    </Billboard></group>
    {opening && <SolarIllustrations startedAtMs={command.issuedAtMs} animated={animated} />}
    <group name="destination:registrations"><Billboard position={PLANETS.registrations.center}><IllustratedPlanet solarBody={PLANETS.registrations.solarBody} radius={PLANETS.registrations.radius} moons={PLANETS.registrations.moons} animated={animated} observable={activeKey === 'registrations'} /></Billboard></group>
    <group name="destination:favorites"><Billboard position={PLANETS.favorites.center}><IllustratedPlanet solarBody={PLANETS.favorites.solarBody} radius={PLANETS.favorites.radius} ring satellites={favoriteSatellites.length} animated={animated} observable={activeKey === 'favorites'} /></Billboard></group>
    <group name="destination:profile"><Billboard position={PLANETS.profile.center}><IllustratedPlanet solarBody={PLANETS.profile.solarBody} radius={PLANETS.profile.radius} animated={animated} observable={activeKey === 'profile'} /></Billboard></group>
    <group name="destination:admin"><group ref={ship}><Billboard position={SHIP_CENTER}><Illustration art={SHIP_ART} width={8.9} height={5.93} /></Billboard></group></group>
    {event && command.destination.kind === 'event' && <Billboard position={event.center}>
      <IllustratedPlanet key={event.key} solarBody={event.solarBody} radius={event.radius} ring={Boolean(event.ring)} animated={animated} observable tint={event.tint} rim={event.rim} />
      <group ref={cue} visible={false}><Illustration art={planetArtwork(EVENT_COLORS[command.destination.category], 'back', true)} width={event.radius * 4.8} height={event.radius * 3.2} z={.15} /></group>
    </Billboard>}
    <Cockpit active={command.destination.kind === 'studio'} animated={animated} />
  </group>;
}
