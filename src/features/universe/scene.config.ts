import type { AppView } from '../../types';
import type { UniverseCommand, UniverseDestination, UniverseQuality } from './contracts';

export type VectorTuple = [number, number, number];
export type RenderQuality = Exclude<UniverseQuality, 'auto'>;
export type SolarBody = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export const SOLAR_BODIES = {
  mercury: { label: 'Mercurio', index: 0, dark: '#252629', mineral: '#a6a29a', rim: '#c8c3b8', rotationSpeed: .037, axialTilt: .003 },
  venus: { label: 'Venus', index: 1, dark: '#443323', mineral: '#dfb578', rim: '#ead4ae', rotationSpeed: -.045, axialTilt: .05 },
  earth: { label: 'Tierra', index: 2, dark: '#061c36', mineral: '#367fa8', rim: '#abd9ef', rotationSpeed: .075, axialTilt: .41 },
  mars: { label: 'Marte', index: 3, dark: '#3e211b', mineral: '#c87145', rim: '#e0a887', rotationSpeed: .065, axialTilt: .44 },
  jupiter: { label: 'Júpiter', index: 4, dark: '#352922', mineral: '#c6a584', rim: '#e0cdb8', rotationSpeed: .095, axialTilt: .054 },
  saturn: { label: 'Saturno', index: 5, dark: '#3f3425', mineral: '#d5bd89', rim: '#e4d6b5', rotationSpeed: .09, axialTilt: .47, ring: 'continuous' as const },
  uranus: { label: 'Urano', index: 6, dark: '#173c43', mineral: '#92d0d1', rim: '#b6e3df', rotationSpeed: .06, axialTilt: 1.71, ring: 'continuous' as const },
  neptune: { label: 'Neptuno', index: 7, dark: '#102345', mineral: '#346bbd', rim: '#99c7ef', rotationSpeed: .08, axialTilt: .49 },
} satisfies Record<SolarBody, { label: string; index: number; dark: string; mineral: string; rim: string; rotationSpeed: number; axialTilt: number; ring?: 'continuous' }>;

export interface PlanetSpec {
  key: string;
  solarBody: SolarBody;
  label: string;
  center: VectorTuple;
  radius: number;
  dark: string;
  mineral: string;
  rim: string;
  seed: number;
  ring?: 'continuous' | 'fragmented';
  moons?: number;
  signature?: 'strata' | 'continents' | 'network' | 'plateaus' | 'grooves';
  observatory?: boolean;
  rotationSpeed?: number;
  axialTilt?: number;
}

export const QUALITY_PROFILES = {
  low: { dpr: 1, stars: 180, segments: 32, moonSegments: 10 },
  balanced: { dpr: 1.25, stars: 600, segments: 56, moonSegments: 14 },
  high: { dpr: 1.5, stars: 1800, segments: 80, moonSegments: 18 },
} as const;

export const PLANETS: Record<Exclude<AppView, 'admin'>, PlanetSpec> = {
  explore: { ...SOLAR_BODIES.earth, solarBody: 'earth', key: 'explore', center: [0, 0, 0], radius: 2.15, seed: 4.8, signature: 'continents' },
  registrations: { ...SOLAR_BODIES.jupiter, solarBody: 'jupiter', key: 'registrations', center: [26, 2, -12], radius: 1.95, seed: 12.2, moons: 4, signature: 'strata' },
  favorites: { ...SOLAR_BODIES.saturn, solarBody: 'saturn', key: 'favorites', center: [-24, -1, -16], radius: 1.8, seed: 7.6, signature: 'strata' },
  profile: { ...SOLAR_BODIES.neptune, solarBody: 'neptune', key: 'profile', center: [-9, 10, -26], radius: 1.55, seed: 21.1, observatory: true, signature: 'grooves' },
};

export const SHIP_CENTER: VectorTuple = [4, 7, -32];
export const SOLAR_CAMERA: VectorTuple = [16, 26, 58];
export const SOLAR_TARGET: VectorTuple = [0, 0, -12];

const EVENT_SOLAR_BODIES: readonly SolarBody[] = ['mercury', 'venus', 'mars', 'uranus'];

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function eventPlanet(destination: Extract<UniverseDestination, { kind: 'event' }>): PlanetSpec {
  const hash = stableHash(destination.eventId);
  const solarBody = EVENT_SOLAR_BODIES[hash % EVENT_SOLAR_BODIES.length];
  const body = SOLAR_BODIES[solarBody];
  // The ID alone defines its location, so a return to the same event is continuous.
  return {
    ...body,
    solarBody,
    key: `event-${destination.eventId}`,
    center: [10 + (hash % 17), -10 - ((hash >>> 5) % 7), -15 - ((hash >>> 10) % 13)],
    radius: 1.4 + (hash % 20) / 100,
    seed: (hash % 1000) / 31,
    signature: solarBody === 'mercury' || solarBody === 'mars' ? 'plateaus' : 'strata',
  };
}

export function destinationKey(destination: UniverseDestination): string {
  if (destination.kind === 'section') return destination.view;
  if (destination.kind === 'event') return `event-${destination.eventId}`;
  return 'studio';
}

export function destinationBody(destination: UniverseDestination): { center: VectorTuple; radius: number } {
  if (destination.kind === 'event') return eventPlanet(destination);
  if (destination.kind === 'studio' || destination.view === 'admin') return { center: SHIP_CENTER, radius: 2.8 };
  return PLANETS[destination.view];
}

export function travelDuration(command: UniverseCommand, mobile: boolean): number {
  switch (command.reason) {
    case 'boot': case 'replay': return 3600;
    case 'open-event': return mobile ? 550 : 750;
    case 'close-event': return mobile ? 450 : 600;
    case 'open-studio': return mobile ? 700 : 1000;
    case 'close-studio': return mobile ? 450 : 650;
    case 'registration-success': return 550;
    default: return mobile ? 650 : 850;
  }
}
