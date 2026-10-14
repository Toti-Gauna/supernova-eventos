export const planetVertex = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalWorld;
  varying vec3 vWorld;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const planetFragment = /* glsl */ `
  uniform vec3 uDark;
  uniform vec3 uMineral;
  uniform vec3 uRim;
  uniform float uSeed;
  uniform float uSignature;
  uniform float uHighlight;
  uniform sampler2D uSurface;
  uniform sampler2D uClouds;
  uniform float uSolarBody;
  uniform float uPhase;
  varying vec3 vLocal;
  varying vec3 vNormalWorld;
  varying vec3 vWorld;
  void main() {
    vec3 p = normalize(vLocal);
    vec3 n = normalize(vNormalWorld);
    vec3 light = normalize(vec3(-8., 6., 5.));
    float diffuse = smoothstep(-.2, .88, dot(n, light));
    vec2 uv = vec2(atan(p.x, p.z) / 6.2831853 + .5, asin(clamp(p.y, -1., 1.)) / 3.1415926 + .5);
    vec3 surface = texture2D(uSurface, uv).rgb;
    if (uSolarBody > 1.5 && uSolarBody < 2.5) {
      vec4 clouds = texture2D(uClouds, vec2(fract(uv.x + uPhase * .027), uv.y));
      surface = mix(surface, clouds.rgb, clouds.a * .82);
    }
    vec3 eye = normalize(cameraPosition - vWorld);
    float fresnel = pow(1. - max(dot(n, eye), 0.), 7.);
    float rimLight = .14 + .7 * max(0., dot(n, light));
    vec3 lit = mix(uDark * .03, surface * (.07 + diffuse * 1.1), diffuse * .96 + .04);
    lit += uRim * fresnel * (rimLight * .12 + uHighlight * .075);
    gl_FragColor = vec4(lit, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform vec3 uRim;
  varying vec3 vNormalWorld;
  varying vec3 vWorld;
  void main() {
    vec3 eye = normalize(cameraPosition - vWorld);
    float edge = pow(1. - abs(dot(normalize(vNormalWorld), eye)), 6.0);
    float light = .18 + .82 * max(dot(normalize(vNormalWorld), normalize(vec3(-8.,6.,5.))), 0.);
    gl_FragColor = vec4(uRim, min(.16, edge * light * .16));
    #include <colorspace_fragment>
  }
`;

export const ringVertex = /* glsl */ `
  varying vec2 vRing;
  void main() {
    vRing = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ringFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uInner;
  uniform float uOuter;
  uniform float uFragmented;
  uniform float uSolarBody;
  varying vec2 vRing;
  void main() {
    float radius = length(vRing);
    float radial = (radius - uInner) / (uOuter - uInner);
    float edge = smoothstep(0., .025, radial) * (1. - smoothstep(.975, 1., radial));
    float antialias = max(fwidth(radial), .008);
    float filament = 1. - smoothstep(.045, .045 + antialias, abs(radial - .44));
    float companion = 1. - smoothstep(.011, .011 + antialias, abs(radial - .77));
    float saturn = step(4.5, uSolarBody) * (1. - step(5.5, uSolarBody));
    float cassini = 1. - smoothstep(.016, .026, abs(radial - .72));
    float broad = (.45 + .18 * sin(radial * 135.)) * (1. - cassini * .9);
    float angle = atan(vRing.y, vRing.x);
    if (uFragmented > .5 && fract((angle + 3.1415926) / 6.2831853 * 18.) > .76) discard;
    float lit = .22 + .78 * pow(.5 + .5 * cos(angle + 2.), 2.);
    gl_FragColor = vec4(uColor * lit, edge * mix(filament * .72 + companion * .22, broad, saturn));
    #include <colorspace_fragment>
  }
`;

// The hybrid renderer uses flat illustration planes, never sphere geometry.
export const illustratedPlanetVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

export const illustratedPlanetFragment = /* glsl */ `
  uniform sampler2D uSurface;
  uniform sampler2D uClouds;
  uniform float uPhase;
  uniform float uSolarBody;
  uniform float uTilt;
  uniform float uOpacity;
  uniform vec3 uRim;
  varying vec2 vUv;
  void main() {
    vec2 disc = (vUv - .5) * vec2(600. / 140., 400. / 140.);
    float radius2 = dot(disc, disc);
    if (radius2 >= 1.) discard;
    float edge = 1. - smoothstep(.992, 1., radius2);
    float c = cos(uTilt), s = sin(uTilt);
    vec2 axis = mat2(c, -s, s, c) * disc;
    float depth = sqrt(max(0., 1. - radius2));
    vec2 surfaceUv = vec2(fract(atan(axis.x, depth) / 6.2831853 + .5 + uPhase / 6.2831853), asin(clamp(axis.y, -1., 1.)) / 3.1415926 + .5);
    vec3 surface = texture2D(uSurface, surfaceUv).rgb;
    if (uSolarBody > 1.5 && uSolarBody < 2.5) {
      vec4 clouds = texture2D(uClouds, vec2(fract(surfaceUv.x + uPhase * .027), surfaceUv.y));
      surface = mix(surface, clouds.rgb, clouds.a * .82);
    }
    vec3 normal = vec3(disc, depth);
    float diffuse = smoothstep(-.24, .94, dot(normal, normalize(vec3(-.55, .65, 1.))));
    vec3 color = surface * (.07 + diffuse * .93);
    float rim = pow(1. - depth, 7.) * (.15 + .85 * diffuse);
    color += uRim * rim * .09;
    gl_FragColor = vec4(color, edge * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
