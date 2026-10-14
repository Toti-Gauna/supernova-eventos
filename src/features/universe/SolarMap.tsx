import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { SRGBColorSpace, TextureLoader, type Group, type MeshBasicMaterial } from 'three';
import { MAP_ART, SUN_ART, solarBodyArtwork } from '../hybrid/HybridArtwork';
import { PLANETS, type SolarBody } from './scene.config';

function Artwork({ art, width, height, z = 0 }: { art: string; width: number; height: number; z?: number }) {
  const texture = useLoader(TextureLoader, art);
  texture.colorSpace = SRGBColorSpace;
  return <mesh position={[0, 0, z]}><planeGeometry args={[width, height]} />
    <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}

const points: { x: number; y: number; radius: number; body: SolarBody }[] = [
  { x:149,y:218,radius:12,body:'jupiter' }, { x:405,y:168,radius:9.5,body:'saturn' },
  { x:202,y:111,radius:4.8,body:'mercury' }, { x:270,y:236,radius:5.5,body:'venus' },
  { x:201,y:242,radius:5.8,body:'mars' }, { x:73,y:254,radius:6.5,body:'uranus' },
  { x:407,y:110,radius:7,body:'neptune' },
];

/** Match the loading map; Earth is the actual sphere at the origin, never a second planet. */
export default function SolarMap({ startedAtMs, animated }: { startedAtMs: number; animated: boolean }) {
  const group = useRef<Group>(null);
  const unit = PLANETS.explore.radius / 14;
  useFrame(() => {
    if (!group.current) return;
    const opacity = animated ? Math.max(0, Math.min(1, (1900 - (performance.now() - startedAtMs)) / 450)) : 0;
    group.current.visible = opacity > 0;
    group.current.traverse(object => { if ('material' in object) (object.material as MeshBasicMaterial).opacity = opacity; });
  });
  return <group ref={group} name="opening-solar-map">
    <group position={[-60 * unit, -33 * unit, -.03]}><Artwork art={MAP_ART} width={480 * unit} height={380 * unit} /></group>
    <group position={[-60 * unit, -28 * unit, .01]}><Artwork art={SUN_ART} width={200 * unit} height={200 * unit} /></group>
    {points.map(point => {
      const scale = point.radius * unit / 140;
      const ring = point.body === 'saturn' || point.body === 'uranus';
      return <group key={point.body} position={[(point.x - 300) * unit, (157 - point.y) * unit, 0]}>
        {ring && <Artwork art={solarBodyArtwork(point.body, 'back')} width={600 * scale} height={400 * scale} z={-.04} />}
        <Artwork art={solarBodyArtwork(point.body, 'body')} width={600 * scale} height={400 * scale} />
        {ring && <Artwork art={solarBodyArtwork(point.body, 'front')} width={600 * scale} height={400 * scale} z={.04} />}
      </group>;
    })}
  </group>;
}
