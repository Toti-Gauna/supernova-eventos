import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, SphereGeometry, TorusGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Triple = [number, number, number];
function part(geometry: BufferGeometry, position: Triple, scale: Triple = [1, 1, 1], rotation: Triple = [0, 0, 0]) {
  geometry.scale(...scale);
  geometry.rotateX(rotation[0]); geometry.rotateY(rotation[1]); geometry.rotateZ(rotation[2]);
  geometry.translate(...position);
  return geometry;
}

function batch(parts: BufferGeometry[]) {
  // Normals/UVs from primitives are retained; only owned construction parts are disposed.
  const source = parts.map(item => item.index ? item.toNonIndexed() : item);
  const geometry = mergeGeometries(source, false)!;
  source.forEach((item, index) => { if (item !== parts[index]) item.dispose(); });
  parts.forEach(item => item.dispose());
  geometry.computeBoundingSphere();
  return geometry;
}

function wedge(points: Triple[], thickness: number) {
  const geometry = new BufferGeometry();
  const vertices = [...points, ...points.map(([x, y, z]) => [x, y - thickness, z] as Triple)];
  const faces = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0];
  // Flat normals are deliberate titanium facets, rather than a glossy toy surface.
  geometry.setAttribute('position', new Float32BufferAttribute(faces.flatMap(index => vertices[index]), 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(faces.flatMap(() => [0, 0]), 2));
  geometry.computeVertexNormals();
  return geometry;
}

export function createShipGeometry(detailed: boolean) {
  const segments = detailed ? 24 : 12;
  const hull = [part(new SphereGeometry(1, segments, Math.floor(segments * .6)), [0, .35, -.1], [1.06, .52, 2.6])];
  const panels: BufferGeometry[] = [part(new BoxGeometry(.62, .34, 2.3), [0, .83, -.42])];
  const dark: BufferGeometry[] = [];
  const warm: BufferGeometry[] = [];
  const lavender: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    hull.push(wedge([[side * .84, .05, 1.48], [side * 2.7, -.1, -.72], [side * 2.45, -.1, -1.65], [side * .72, .05, -1.85]], .15));
    panels.push(part(new CylinderGeometry(.24, .31, 1.92, segments), [side * 1.58, -.05, -1.25], [1, 1, 1], [Math.PI / 2, 0, 0]));
    panels.push(part(new BoxGeometry(.06, .045, 1.18), [side * 1.15, .12, -.55], [1, 1, 1], [0, side * .24, 0]));
    dark.push(part(new CylinderGeometry(.2, .2, .14, segments), [side * 1.58, -.05, -2.25], [1, 1, 1], [Math.PI / 2, 0, 0]));
    lavender.push(part(new TorusGeometry(.205, .016, 4, segments), [side * 1.58, -.05, -2.34]));
    lavender.push(part(new BoxGeometry(.025, .025, .98), [side * 2.15, -.035, -.84], [1, 1, 1], [0, side * .49, 0]));
    warm.push(part(new BoxGeometry(.21, .045, .04), [side * .41, .74, 1.75], [1, 1, 1], [-.15, 0, 0]));
  }
  // A legible warm bridge and central forward entrance share the same hull.
  panels.push(part(new SphereGeometry(1, segments, Math.floor(segments * .6)), [0, .75, 1.18], [.68, .34, .82]));
  warm.push(part(new SphereGeometry(1, segments, 10), [0, .83, 1.67], [.51, .15, .23]));
  dark.push(part(new BoxGeometry(.60, .57, .14), [0, .34, 2.58]));
  warm.push(part(new BoxGeometry(.43, .43, .03), [0, .34, 2.67]));
  lavender.push(part(new BoxGeometry(.022, .53, .035), [-.28, .34, 2.69]));
  lavender.push(part(new BoxGeometry(.022, .53, .035), [.28, .34, 2.69]));
  lavender.push(part(new BoxGeometry(.58, .022, .035), [0, .61, 2.69]));
  if (detailed) {
    for (const depth of [-1.22, -.63, -.04]) {
      dark.push(part(new BoxGeometry(.66, .012, .018), [0, 1.005, depth]));
    }
  }
  return { hull: batch(hull), panels: batch(panels), dark: batch(dark), warm: batch(warm), lavender: batch(lavender) };
}

export function createCabinGeometry() {
  const structure: BufferGeometry[] = [];
  const lights: BufferGeometry[] = [];
  const floor: BufferGeometry[] = [part(new BoxGeometry(6, .1, 8), [0, -.5, -1.2])];
  for (const side of [-1, 1]) {
    for (const depth of [-3.7, .3]) {
      structure.push(part(new BoxGeometry(.075, 3.75, .12), [side * 2.72, 1.35, depth], [1, 1, 1], [0, 0, side * .055]));
      structure.push(part(new BoxGeometry(1.13, .05, .12), [side * 2.25, 3.14, depth], [1, 1, 1], [0, 0, side * -.18]));
      lights.push(part(new BoxGeometry(.010, 2.98, .016), [side * 2.69, 1.32, depth + .075]));
    }
    for (const height of [.18, 1.26, 2.34]) {
      structure.push(part(new BoxGeometry(.06, 1.03, .12), [side * 1.83, height, -3.7]));
    }
    lights.push(part(new BoxGeometry(.010, 2.65, .016), [side * 1.86, 1.2, -3.63]));
    floor.push(part(new BoxGeometry(.026, .018, 6.1), [side * 2.1, -.43, -.7]));
  }
  structure.push(part(new BoxGeometry(3.8, .045, .12), [0, 2.96, -3.7]));
  structure.push(part(new BoxGeometry(3.8, .045, .12), [0, -.24, -3.7]));
  lights.push(part(new BoxGeometry(3.35, .009, .016), [0, 2.92, -3.63]));
  // Two slender lower rails give the room a continuous frame behind the studio's DOM margins.
  lights.push(part(new BoxGeometry(.010, .018, 3.8), [-1.72, -.13, -1.8]));
  lights.push(part(new BoxGeometry(.010, .018, 3.8), [1.72, -.13, -1.8]));
  return { structure: batch(structure), lights: batch(lights), floor: batch(floor) };
}

// Kept outside frame loops for potential debugging of the forward threshold.
export const SHIP_THRESHOLD = new Vector3(0, 1.3, 3.0);
