import { SOLAR_BODIES, type SolarBody } from '../universe/scene.config';

// The original loader palette remains separate from the natural solar-body artwork.
export type ArtworkColor = 'violet' | 'teal' | 'amber' | 'pearl' | 'blue' | 'rose';
const colors: Record<ArtworkColor, readonly string[]> = {
  violet: ['#c7b2e2', '#715398', '#251638', '#07060b', '#c7afe0'],
  teal: ['#cee2db', '#54877f', '#153631', '#060b0a', '#b2d3c7'],
  amber: ['#f2dfba', '#ae7844', '#4a2d1e', '#0c0806', '#e1c8a0'],
  pearl: ['#ece6de', '#a49bad', '#3a3441', '#0a090d', '#d0c8d6'],
  blue: ['#d1e4fa', '#6189b1', '#192c48', '#050910', '#b6d3f3'],
  rose: ['#f0cadd', '#ad668a', '#422035', '#0d070c', '#e4b5d0'],
};
// The large worlds borrow the original installation's restrained, illustrated light.
const polishedColors: Record<ArtworkColor, readonly string[]> = {
  violet: ['#554167', '#292036', '#11101c', '#0c0b16', '#d4aaff', '#fff1dc'],
  teal: ['#456560', '#223b39', '#0b191a', '#080e13', '#a6ddd2', '#f3f4df'],
  amber: ['#7c5840', '#483226', '#1d1515', '#100d13', '#e8c292', '#fff0d5'],
  pearl: ['#6c6475', '#3b3646', '#161520', '#0d0d17', '#ded1ed', '#fff2e3'],
  blue: ['#4b5e79', '#263449', '#0d1424', '#0a0d18', '#b2cefa', '#edf4ff'],
  rose: ['#714f6a', '#392333', '#180e1a', '#0e0c16', '#e7abc9', '#fff1dc'],
};
const svg = (body: string, width = 600, height = 400) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2}" height="${height * 2}" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`;
export function planetArtwork(color: ArtworkColor, layer: 'body' | 'back' | 'front', ring: boolean, polished = true) {
  if (polished) {
    const [light, medium, dark, shadow, rim, warm] = polishedColors[color];
    const orbit = `<defs><linearGradient id="orbit" x1="72" y1="310" x2="528" y2="90" gradientUnits="userSpaceOnUse"><stop stop-color="${rim}" stop-opacity=".08"/><stop offset=".3" stop-color="${rim}" stop-opacity=".75"/><stop offset=".53" stop-color="${warm}"/><stop offset=".72" stop-color="${rim}" stop-opacity=".48"/><stop offset="1" stop-color="${rim}" stop-opacity=".06"/></linearGradient></defs>`;
    if (layer === 'back') return svg(ring ? `${orbit}<ellipse cx="300" cy="200" rx="240" ry="60" transform="rotate(-24 300 200)" fill="none" stroke="url(#orbit)" stroke-width="1.5"/><ellipse cx="300" cy="200" rx="251" ry="64" transform="rotate(-24 300 200)" fill="none" stroke="url(#orbit)" stroke-width=".55" opacity=".35"/>` : '');
    if (layer === 'front') return svg(ring ? `${orbit}<path d="M80.75 297.6 A240 60 -24 0 0 519.25 102.4" fill="none" stroke="url(#orbit)" stroke-width="1.65" stroke-linecap="round"/>` : '');
    return svg(`<defs>
      <radialGradient id="surface" cx=".29" cy=".19" r=".83"><stop stop-color="${light}"/><stop offset=".32" stop-color="${medium}"/><stop offset=".74" stop-color="${dark}"/><stop offset="1" stop-color="${shadow}"/></radialGradient>
      <linearGradient id="rim" x1="166" y1="65" x2="438" y2="327" gradientUnits="userSpaceOnUse"><stop stop-color="${warm}"/><stop offset=".24" stop-color="${rim}"/><stop offset=".52" stop-color="${rim}" stop-opacity=".45"/><stop offset="1" stop-color="${shadow}" stop-opacity=".2"/></linearGradient>
      <radialGradient id="aura"><stop offset=".56" stop-color="${rim}" stop-opacity="0"/><stop offset=".66" stop-color="${rim}" stop-opacity=".16"/><stop offset=".75" stop-color="${rim}" stop-opacity=".08"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient>
      <linearGradient id="bands" x1="145" y1="72" x2="455" y2="327" gradientUnits="userSpaceOnUse"><stop stop-color="${rim}" stop-opacity=".15"/><stop offset=".55" stop-color="${rim}" stop-opacity=".025"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></linearGradient>
      <clipPath id="planet"><circle cx="300" cy="200" r="140"/></clipPath>
    </defs>
    <circle cx="300" cy="200" r="187" fill="url(#aura)"/>
    <circle cx="300" cy="200" r="140" fill="url(#surface)" stroke="url(#rim)" stroke-width="1.1"/>
    <g clip-path="url(#planet)"><g transform="translate(-23.485 -35.455) scale(1.060606)" fill="none" stroke="url(#bands)" stroke-width="10"><path d="M130 122C191 32 388 45 496 152M124 151C190 59 391 72 492 181M126 179C189 89 391 101 493 210M134 209C192 120 392 131 490 239M151 239C207 155 389 160 478 267M173 268C226 195 381 194 457 292M204 294C249 237 366 231 429 316"/></g><ellipse cx="198" cy="68" rx="118" ry="138" transform="rotate(-34 198 68)" fill="${rim}" opacity=".035"/></g>
    <g transform="translate(-23.485 -35.455) scale(1.060606)" fill="none"><path d="M194 151A132 132 0 0 1 398 129" stroke="${rim}" stroke-width="3" opacity=".38"/><path d="M196 150A130 130 0 0 1 365 105" stroke="${warm}" stroke-width="1.3" opacity=".92"/></g>`);
  }
  // Keep the loading-screen artwork and its camera-to-planet handoff unchanged.
  const [light, medium, dark, shadow, rim] = colors[color];
  if (layer === 'back') return svg(ring ? `<ellipse cx="300" cy="200" rx="240" ry="60" transform="rotate(-24 300 200)" fill="none" stroke="${rim}" stroke-width="${polished ? '7' : '24'}" stroke-opacity=".42"/>${polished ? `<ellipse cx="300" cy="200" rx="251" ry="64" transform="rotate(-24 300 200)" fill="none" stroke="${rim}" stroke-width=".7" stroke-opacity=".22"/>` : ''}` : '');
  if (layer === 'front') return svg(ring ? `<path d="${polished ? 'M80.75 297.6 A240 60 -24 0 0 519.25 102.4' : 'M80 320Q280 350 520 80'}" fill="none" stroke="${rim}" stroke-width="${polished ? '5.5' : '22'}" stroke-opacity=".7" stroke-linecap="round"/>` : '');
  return svg(`<defs><radialGradient id="surface" cx=".27" cy=".23" r=".8"><stop stop-color="${light}"/><stop offset="${color === 'violet' ? '.25' : '.3'}" stop-color="${medium}"/><stop offset=".7" stop-color="${dark}"/><stop offset="1" stop-color="${shadow}"/></radialGradient></defs><circle cx="300" cy="200" r="140" fill="url(#surface)" stroke="${rim}" stroke-width="${polished ? '.8' : '3.5'}"/>`);
}
const surfaceCache = new Map<SolarBody, string>();
const atlas = (body: string) => svg(`<g transform="scale(.5)">${body}</g>`, 512, 256);
const land = (points: readonly (readonly [number, number])[]) => points.map(([longitude, latitude], index) => `${index ? 'L' : 'M'}${((longitude + 180) / 360 * 1024).toFixed(1)} ${((90 - latitude) / 180 * 512).toFixed(1)}`).join('') + 'Z';
const EARTH_LAND = [
  [[-168,71],[-151,70],[-139,60],[-130,55],[-125,49],[-123,38],[-117,32],[-111,31],[-106,23],[-97,16],[-89,15],[-84,10],[-79,9],[-82,19],[-86,21],[-89,29],[-82,25],[-80,32],[-74,40],[-66,45],[-60,51],[-67,58],[-79,63],[-84,72],[-101,73],[-110,70],[-130,72],[-145,70]],
  [[-81,8],[-75,10],[-68,9],[-61,6],[-51,4],[-47,-1],[-35,-6],[-37,-15],[-42,-23],[-50,-29],[-55,-37],[-64,-55],[-70,-53],[-74,-40],[-75,-23],[-81,-5]],
  [[-11,36],[-9,43],[3,45],[8,54],[14,54],[7,59],[10,71],[27,71],[40,68],[62,74],[104,77],[141,72],[179,66],[169,58],[163,50],[144,48],[139,38],[127,36],[121,25],[111,21],[107,8],[100,1],[94,7],[86,21],[78,7],[72,22],[60,24],[53,12],[43,13],[35,31],[29,41],[19,40],[15,37],[3,36]],
  [[-17,15],[-17,28],[-6,36],[9,37],[25,32],[33,31],[39,15],[51,12],[47,4],[42,-2],[40,-15],[33,-27],[18,-35],[11,-17],[2,-5],[-9,5],[-16,12]],
  [[113,-12],[126,-13],[131,-11],[138,-17],[145,-15],[153,-27],[147,-39],[135,-35],[126,-34],[115,-35],[113,-24]],
  [[-72,60],[-49,60],[-22,70],[-20,81],[-44,84],[-63,79]],
  [[47,-13],[51,-16],[48,-25],[44,-24]],
  [[130,31],[134,34],[140,39],[143,43],[145,44],[140,35]],
  [[166,-34],[173,-41],[178,-42],[171,-47],[166,-45]],
] as const;

function craters(color: string, count: number, seed: number) {
  return Array.from({ length: count }, (_, index) => {
    const random = (offset: number) => { const v = Math.sin((index + 1) * 73.17 + seed * 11.9 + offset * 19.3) * 43758.5453; return v - Math.floor(v); };
    const x = random(1) * 1024, y = 40 + random(2) * 435, radius = 2 + random(3) * 18;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${radius.toFixed(1)}" ry="${(radius * .72).toFixed(1)}" fill="${color}" opacity=".35" stroke="#f1dfcb" stroke-opacity=".2" stroke-width="1.3"/><ellipse cx="${(x + 1).toFixed(1)}" cy="${(y + 1).toFixed(1)}" rx="${(radius * .67).toFixed(1)}" ry="${(radius * .45).toFixed(1)}" fill="${color}" opacity=".22"/>`;
  }).join('');
}

function bands(palette: readonly string[], count: number, opacity = 1) {
  return Array.from({ length: count }, (_, index) => {
    const y = index / count * 512, height = 512 / count + 2, wave = Math.sin(index * 2.8) * 7;
    return `<path d="M0 ${y}C180 ${y + wave} 290 ${y - wave} 512 ${y}S830 ${y + wave} 1024 ${y}V${y + height}C830 ${y + height + wave} 690 ${y + height - wave} 512 ${y + height}S190 ${y + height + wave} 0 ${y + height}Z" fill="${palette[index % palette.length]}" opacity="${opacity}"/>`;
  }).join('');
}

/** Original vector atlases, shared by the sphere renderer and the 2D billboard renderer. */
export function solarSurfaceArtwork(body: SolarBody) {
  const cached = surfaceCache.get(body);
  if (cached) return cached;
  let artwork = '';
  if (body === 'earth') artwork = `<defs><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#244d71"/><stop offset=".42" stop-color="#1967a0"/><stop offset="1" stop-color="#0b325f"/></linearGradient><linearGradient id="land" x2=".2" y2="1"><stop stop-color="#b5b799"/><stop offset=".43" stop-color="#629174"/><stop offset=".72" stop-color="#a09867"/><stop offset="1" stop-color="#5b8570"/></linearGradient></defs><path d="M0 0H1024V512H0Z" fill="url(#sea)"/><g fill="url(#land)" stroke="#b1c5a0" stroke-opacity=".22" stroke-width="1.4">${EARTH_LAND.map(points => `<path d="${land(points)}"/>`).join('')}</g><path d="${land([[-16,16],[-9,29],[10,32],[29,26],[35,17],[15,12]])}" fill="#cfb58a" opacity=".66"/><path d="M0 490Q210 470 360 491T690 486T1024 490V512H0Z" fill="#e8edf0"/><path d="M0 0H1024V17Q850 31 670 17T320 20T0 16Z" fill="#e4eef0" opacity=".8"/>`;
  if (body === 'mercury') artwork = `<path d="M0 0H1024V512H0Z" fill="#9d9b94"/><path d="M0 118Q182 48 340 161T632 195T1024 130V325Q850 393 690 338T322 332T0 369Z" fill="#686e71" opacity=".35"/>${craters('#3b4143', 110, 1)}`;
  if (body === 'mars') artwork = `<path d="M0 0H1024V512H0Z" fill="#bd6845"/><path d="M0 146Q170 72 332 156T638 180T1024 146V277Q810 347 665 296T282 306T0 310Z" fill="#814b3c" opacity=".58"/><path d="M590 202Q639 187 672 211L715 286 660 318 617 277Z" fill="#524f43" opacity=".55"/><path d="M170 258Q370 209 445 258T566 286" fill="none" stroke="#623c32" stroke-width="7" opacity=".52"/>${craters('#774233', 70, 3)}<path d="M0 0H1024V21Q790 36 526 20T0 29Z" fill="#f4e4ce" opacity=".93"/><path d="M0 495Q280 476 511 493T1024 490V512H0Z" fill="#edddc7"/>`;
  if (body === 'venus') artwork = `<path d="M0 0H1024V512H0Z" fill="#d3a46b"/>${bands(['#e0bc83','#c18e54','#e7c999','#d6aa73'], 15, .45)}<g fill="none" stroke="#f2dfb3" stroke-width="13" opacity=".32"><path d="M-80 115Q80 33 232 114T528 96T816 104T1100 76M-90 263Q60 171 240 255T530 248T826 233T1100 250M-80 398Q86 311 266 387T580 392T867 370T1100 413"/><path d="M350 212C270 129 482 113 510 196S710 295 756 188" stroke-width="21" opacity=".75"/></g>`;
  if (body === 'jupiter') artwork = `${bands(['#b39477','#d5c3a8','#c8af8d','#af7e60','#dfcdb3','#bd9d81','#e6d7bd','#9b7059'], 23)}<g fill="none" stroke="#ead8bc" opacity=".4" stroke-width="3"><path d="M0 161Q180 147 370 165T720 154T1024 164M0 310Q230 298 433 314T790 305T1024 315"/></g><ellipse cx="650" cy="320" rx="51" ry="25" fill="#a96348" stroke="#e3c2a0" stroke-width="5"/><ellipse cx="648" cy="318" rx="35" ry="16" fill="#b87c58"/><path d="M620 317Q648 305 676 318" fill="none" stroke="#dca779" stroke-width="4"/>`;
  if (body === 'saturn') artwork = `${bands(['#d5c395','#c7b384','#dfd0a5','#b9a477','#e0d1a5','#d0bf93'], 22)}<path d="M0 95Q290 82 511 96T1024 95M0 393Q290 380 511 391T1024 393" fill="none" stroke="#bfa87b" stroke-width="5" opacity=".36"/>`;
  if (body === 'uranus') artwork = `<defs><linearGradient id="u" x2="0" y2="1"><stop stop-color="#bddbd5"/><stop offset=".44" stop-color="#89c6cd"/><stop offset="1" stop-color="#69afb9"/></linearGradient></defs><path d="M0 0H1024V512H0Z" fill="url(#u)"/>${bands(['#d8eeea','#5ca6b5','#96d1d6'], 15, .065)}`;
  if (body === 'neptune') artwork = `<path d="M0 0H1024V512H0Z" fill="#3979bc"/>${bands(['#458ac2','#2562a9','#3e78ba','#548cbe','#326bb2','#629dc7'], 19, .44)}<ellipse cx="650" cy="303" rx="46" ry="18" fill="#174883" opacity=".7"/><g fill="none" stroke="#c2deef" stroke-width="4" opacity=".65"><path d="M545 280Q608 271 697 280M667 323Q749 312 824 323M-20 178Q190 160 330 177T610 170T1024 178"/></g>`;
  const result = atlas(artwork);
  surfaceCache.set(body, result);
  return result;
}

const CLOUD_ART = atlas(`<g fill="none" stroke="#f7fbff" stroke-linecap="round"><path d="M-80 103Q44 53 190 110T470 96T760 91T1110 111M-40 318Q119 232 291 319T560 306T850 289T1100 317" stroke-width="20" opacity=".52"/><path d="M70 175Q131 135 218 179T376 172M574 214Q675 143 814 214T1090 204M240 413Q380 342 503 413T804 409" stroke-width="11" opacity=".73"/><path d="M-70 38Q140 8 320 41T721 31T1100 34M-50 474Q170 450 382 481T812 468T1090 471" stroke-width="31" opacity=".6"/></g>`);
const EMPTY_ATLAS = atlas('');
export const solarCloudArtwork = (body: SolarBody) => body === 'earth' ? CLOUD_ART : EMPTY_ATLAS;

/** Static rim and ring plates; the moving atlas is rendered inside their circular silhouette. */
export function solarBodyArtwork(body: SolarBody, layer: 'body' | 'back' | 'front' | 'halo') {
  const { mineral, dark, rim } = SOLAR_BODIES[body];
  const hasRing = body === 'saturn' || body === 'uranus';
  if (layer === 'back' || layer === 'front') {
    if (!hasRing) return svg('');
    const rx = body === 'uranus' ? 193 : 240, ry = body === 'uranus' ? 37 : 66;
    const tilt = body === 'uranus' ? -78 : -24, angle = tilt * Math.PI / 180;
    const x = Math.cos(angle) * rx, y = Math.sin(angle) * rx;
    const definition = `<defs><linearGradient id="ring" x1="72" y1="310" x2="528" y2="90" gradientUnits="userSpaceOnUse"><stop stop-color="${rim}" stop-opacity=".2"/><stop offset=".5" stop-color="#f3e6ca" stop-opacity=".8"/><stop offset="1" stop-color="${rim}" stop-opacity=".27"/></linearGradient></defs>`;
    const path = layer === 'back' ? `<ellipse cx="300" cy="200" rx="${rx}" ry="${ry}" transform="rotate(${tilt} 300 200)"/>` : `<path d="M${300 - x} ${200 - y}A${rx} ${ry} ${tilt} 0 0 ${300 + x} ${200 + y}"/>`;
    return svg(`${definition}<g fill="none" stroke="url(#ring)" stroke-width="${body === 'uranus' ? 1.7 : 15}">${path}</g><g fill="none" stroke="${rim}" stroke-width="${body === 'uranus' ? '.55' : '2.4'}" opacity=".38">${path}</g>`);
  }
  if (layer === 'halo') return svg(`<defs><radialGradient id="halo"><stop offset=".7" stop-color="${rim}" stop-opacity="0"/><stop offset=".76" stop-color="${rim}" stop-opacity=".14"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient><linearGradient id="edge" x2="1" y2="1"><stop stop-color="${rim}" stop-opacity=".8"/><stop offset=".53" stop-color="${rim}" stop-opacity=".15"/><stop offset="1" stop-color="${rim}" stop-opacity=".08"/></linearGradient></defs><circle cx="300" cy="200" r="183" fill="url(#halo)"/><circle cx="300" cy="200" r="140" fill="none" stroke="url(#edge)" stroke-width="1.1"/>`);
  const inner = (uri: string) => decodeURIComponent(uri.slice(uri.indexOf(',') + 1)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const surface = inner(solarSurfaceArtwork(body));
  const clouds = body === 'earth' ? `<svg x="20" y="60" width="560" height="280" viewBox="0 0 512 256" opacity=".7">${inner(CLOUD_ART)}</svg>` : '';
  return svg(`<defs><clipPath id="disc"><circle cx="300" cy="200" r="140"/></clipPath><radialGradient id="solar" cx=".3" cy=".2" r=".85"><stop stop-color="${mineral}"/><stop offset=".7" stop-color="${dark}"/><stop offset="1" stop-color="#060b12"/></radialGradient><radialGradient id="shade" cx=".27" cy=".2" r=".85"><stop stop-color="#02050a" stop-opacity="0"/><stop offset=".43" stop-color="#02050a" stop-opacity=".04"/><stop offset=".76" stop-color="#02050a" stop-opacity=".65"/><stop offset="1" stop-color="#02050a" stop-opacity=".96"/></radialGradient></defs><circle cx="300" cy="200" r="140" fill="url(#solar)"/><g clip-path="url(#disc)"><svg x="20" y="60" width="560" height="280" viewBox="0 0 512 256">${surface}</svg>${clouds}<circle cx="300" cy="200" r="140" fill="url(#shade)"/></g><circle cx="300" cy="200" r="140" fill="none" stroke="${rim}" stroke-opacity=".6" stroke-width="1"/>`);
}
export const MOON_ART = svg('<defs><radialGradient id="p" cx=".27" cy=".23" r=".8"><stop stop-color="#ece6de"/><stop offset=".35" stop-color="#a49bad"/><stop offset=".8" stop-color="#3a3441"/><stop offset="1" stop-color="#0a090d"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#p)" stroke="#d0c8d6" stroke-width=".6"/>', 100, 100);
export const SUN_ART = svg('<defs><radialGradient id="g"><stop stop-color="#f2d4a3" stop-opacity=".2"/><stop offset=".28" stop-color="#d2a373" stop-opacity=".055"/><stop offset="1" stop-color="#d2a373" stop-opacity="0"/></radialGradient><radialGradient id="s" cx=".36" cy=".32" r=".8"><stop stop-color="#fff2d7"/><stop offset=".46" stop-color="#e4c399"/><stop offset="1" stop-color="#9f7552"/></radialGradient></defs><circle cx="100" cy="100" r="92" fill="url(#g)"/><circle cx="100" cy="100" r="10.5" fill="url(#s)"/><circle cx="100" cy="100" r="12" fill="none" stroke="#eed7b3" stroke-width=".35" stroke-opacity=".25"/>', 200, 200);

export const MAP_ART = svg(`<defs><linearGradient id="o" x1="50" y1="300" x2="440" y2="70" gradientUnits="userSpaceOnUse"><stop stop-color="#ae96c9" stop-opacity=".07"/><stop offset=".5" stop-color="#d6c8e7" stop-opacity=".48"/><stop offset="1" stop-color="#ae96c9" stop-opacity=".08"/></linearGradient></defs><g fill="none" stroke="url(#o)" stroke-width=".65"><ellipse cx="240" cy="185" rx="59" ry="24" transform="rotate(-15 240 185)"/><ellipse cx="240" cy="185" rx="107" ry="46" transform="rotate(-15 240 185)"/><ellipse cx="240" cy="185" rx="166" ry="73" transform="rotate(-15 240 185)"/><ellipse cx="240" cy="185" rx="217" ry="96" transform="rotate(-15 240 185)"/><path d="M51 316H118M379 70H432" stroke="#d1b6ed" stroke-opacity=".23"/></g><circle cx="50" cy="316" r="1.6" fill="#d1b6ed"/><circle cx="432" cy="70" r="1.6" fill="#8daca5"/><g transform="translate(133 125) rotate(-14)"><path d="M-14 0L-4-6 9-3 18 0 9 3-4 6Z" fill="#807b8b"/><path d="M-3-3L8-1 11 0 8 1-3 3Z" fill="#171922"/><path d="M-11-3L-6-2M-11 3L-6 2" stroke="#c1b5da"/><circle cx="26" r="1.5" fill="#bba7d8"/></g>`, 480, 380);

// A hand-drawn three-quarter craft. No shaded sphere/mesh substitutes for art.
export const SHIP_ART = svg(`<defs>
<linearGradient id="h" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#e0dbe9"/><stop offset=".3" stop-color="#888593"/><stop offset=".65" stop-color="#414350"/><stop offset="1" stop-color="#151822"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9a8fab"/><stop offset=".5" stop-color="#454554"/><stop offset="1" stop-color="#14151e"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#98c1cf"/><stop offset=".3" stop-color="#334659"/><stop offset="1" stop-color="#0c1321"/></linearGradient>
<radialGradient id="engine"><stop stop-color="#eee7fa"/><stop offset=".2" stop-color="#c7b6e4" stop-opacity=".9"/><stop offset="1" stop-color="#a88adc" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="184" cy="249" rx="118" ry="26" fill="url(#engine)" transform="rotate(-17 184 249)"/>
<path d="M162 190L58 139 140 151 269 152 303 198 171 226Z" fill="url(#w)" stroke="#c7bfd4" stroke-width=".8"/>
<path d="M182 228L80 328 267 278 328 218Z" fill="url(#w)" stroke="#c7bfd4" stroke-width=".9"/>
<path d="M161 195L247 136 364 135 530 198 474 229 272 265 184 239Z" fill="url(#h)" stroke="#b8afca" stroke-width="1"/>
<path d="M247 136L285 111 351 113 402 151 366 172 259 172Z" fill="url(#w)" stroke="#b9b3cb" stroke-width="1"/>
<path d="M278 128L310 117 348 124 376 146 354 154 284 155Z" fill="url(#glass)" stroke="#bac8d6" stroke-width="1.2"/>
<path d="M310 118L319 153M349 125L347 155" stroke="#abb3c8" stroke-width="1.2" opacity=".55"/>
<path d="M263 178L399 173 500 201M272 218L402 203 479 212M280 238L389 219" fill="none" stroke="#e1dbea" stroke-width=".65" opacity=".45"/>
<path d="M167 201L186 198 212 226 188 237Z" fill="#111520" stroke="#898496"/>
<path d="M169 208L182 206 200 226 187 229" fill="#cab8e8"/>
<path d="M107 307L226 274M74 144L187 164" stroke="#d1bedf" stroke-width="1.5" opacity=".65"/>
<circle cx="473" cy="213" r="2" fill="#e4d8f4"/><circle cx="267" cy="180" r="1.4" fill="#b4d8da"/>
<path d="M303 249L327 244 330 254 307 259Z" fill="#090c13" stroke="#c9b9df" stroke-width=".75"/>
`, 600, 400);

export const CABIN_BACK = svg(`<defs><linearGradient id="m" x2="1" y2="1"><stop stop-color="#33343e"/><stop offset=".3" stop-color="#171923"/><stop offset="1" stop-color="#070a12"/></linearGradient><linearGradient id="edge" x2="1"><stop stop-color="#777080"/><stop offset=".5" stop-color="#181e2a"/><stop offset="1" stop-color="#393746"/></linearGradient></defs>
<path d="M0 0H1200V72L930 111H270L0 72Z" fill="url(#m)" stroke="#aea1bd" stroke-opacity=".25"/>
<path d="M0 0L135 38 252 196 198 568 64 720H0Z" fill="url(#m)"/><path d="M1200 0L1065 38 948 196 1002 568 1136 720H1200Z" fill="url(#m)"/>
<path d="M24 18L116 66 217 203 167 553 58 685M1176 18L1084 66 983 203 1033 553 1142 685" fill="none" stroke="url(#edge)" stroke-width="18"/>
<path d="M94 91L203 222M1106 91L997 222M192 274L158 516M1008 274L1042 516" stroke="#c3afda" stroke-width="2" opacity=".5"/>
<path d="M0 630L226 555 974 555 1200 630V720H0Z" fill="url(#m)" stroke="#5e536c" stroke-opacity=".4"/>
<path d="M164 617L278 586H922L1036 617M382 603H457M746 603H812" fill="none" stroke="#99bec9" stroke-width="2" opacity=".4"/>
<text x="600" y="44" text-anchor="middle" fill="#c1b0ce" font-family="sans-serif" font-size="8" letter-spacing="5" opacity=".45">SUPERNOVA · FLIGHT DECK</text>`, 1200, 720);
export const CABIN_FRONT = svg(`<defs><linearGradient id="f" x2="0" y2="1"><stop stop-color="#292631"/><stop offset="1" stop-color="#090b11"/></linearGradient></defs><path d="M0 0H96L229 203 174 520 57 720H0Z" fill="url(#f)"/><path d="M1200 0H1104L971 203 1026 520 1143 720H1200Z" fill="url(#f)"/><path d="M92 5L221 202 163 532M1108 5L979 202 1037 532" fill="none" stroke="#b5a1c9" stroke-width="2" opacity=".28"/><path d="M0 692L135 616M1200 692L1065 616" stroke="#cfb7e7" stroke-width="2" opacity=".4"/>`, 1200, 720);
