import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, type Group, type MeshStandardMaterial } from 'three';
import { SHIP_CENTER } from './scene.config';
import { createCabinGeometry, createShipGeometry } from './ship.geometry';
import type { UniverseCommand } from './contracts';
import type { DestinationHighlight } from './useDestinationHighlight';

/** A faceted exploration craft and its cabin occupy one stable world coordinate. */
export default function Spaceship({ detailed, studio, command, animated, highlight }: {
  detailed: boolean; studio: boolean; command: UniverseCommand; animated: boolean; highlight: RefObject<DestinationHighlight>;
}) {
  const exterior = useRef<Group>(null);
  const accent = useRef<MeshStandardMaterial>(null);
  const { camera, size } = useThree();
  // The back window tracks the viewport edges so its ribs stay visible around narrow DOM forms.
  const cabinWidth = Math.min(1.9, Math.max(.34, size.width / size.height * .95));
  const geometry = useMemo(() => createShipGeometry(detailed), [detailed]);
  const cabin = useMemo(createCabinGeometry, []);
  useEffect(() => () => { Object.values(geometry).forEach(part => part.dispose()); }, [geometry]);
  useEffect(() => () => { Object.values(cabin).forEach(part => part.dispose()); }, [cabin]);
  useFrame(() => {
    // Reveal the ribs while approaching; remove the opaque hull only after its threshold.
    if (exterior.current) exterior.current.visible = !studio ||
      (animated && command.reason === 'open-studio' && camera.position.z - SHIP_CENTER[2] > 3.1);
    if (accent.current) accent.current.emissiveIntensity = highlight.current.key === 'section:admin' || highlight.current.key === 'studio' ? .65 : .33;
  });
  return <group position={SHIP_CENTER} name="supernova-administration-ship">
    <group ref={exterior} name="ship-exterior">
      <mesh geometry={geometry.hull}>
        <meshStandardMaterial color="#606873" emissive="#343945" emissiveIntensity={.045} metalness={.22} roughness={.76} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometry.panels}>
        <meshStandardMaterial color="#9da4af" metalness={.42} roughness={.57} />
      </mesh>
      <mesh geometry={geometry.dark}>
        <meshStandardMaterial color="#14161b" metalness={.16} roughness={.86} />
      </mesh>
      <mesh geometry={geometry.warm}>
        <meshStandardMaterial color="#dfc69e" emissive="#d7b585" emissiveIntensity={.55} metalness={.06} roughness={.3} />
      </mesh>
      <mesh geometry={geometry.lavender}>
        <meshStandardMaterial ref={accent} color="#4ec5ff" emissive="#1eb2f5" emissiveIntensity={.33} roughness={.7} />
      </mesh>
    </group>
    {studio && <group name="ship-cabin" scale={[cabinWidth, 1, 1]}>
      <mesh geometry={cabin.structure}>
        <meshStandardMaterial color="#262d39" emissive="#1c2a44" emissiveIntensity={.035} metalness={.42} roughness={.72} />
      </mesh>
      <mesh geometry={cabin.floor}>
        <meshStandardMaterial color="#10131a" metalness={.12} roughness={.94} />
      </mesh>
      <mesh geometry={cabin.lights}>
        <meshBasicMaterial color="#6cc9ff" transparent opacity={.30} />
      </mesh>
    </group>}
  </group>;
}
