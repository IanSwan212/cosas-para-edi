// Atardecer: cúpula de cielo con degradado de horizonte dorado a cénit azul violáceo, halo y
// disco del sol, nubes estiradas iluminadas por debajo, y dos cordilleras lejanas en la bruma.
// La cúpula se dibuja siempre al fondo (profundidad máxima) y sigue a la cámara.
// Sus colores ya son de pantalla: la vista ASCII no les aplica mapeo de tonos.
import * as THREE from "three";
import { markAsGround } from "./ascii.js?v=mw1mgq2a";

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAG = `
uniform vec3 uSun;
uniform float uTime;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y, e = clamp(h, 0.0, 1.0);
  float sd = max(dot(d, uSun), 0.0);
  vec2 hz = normalize(d.xz + 1e-5);
  float toward = dot(hz, normalize(uSun.xz)) * 0.5 + 0.5;

  // Degradado por altura (colores ya en pantalla, sin mapeo de tonos para que no se laven):
  // dorado en el horizonte, coral, malva y azul profundo arriba.
  vec3 col = mix(vec3(1.0, 0.7, 0.36), vec3(0.97, 0.48, 0.34), smoothstep(0.0, 0.06, e));
  col = mix(col, vec3(0.66, 0.36, 0.48), smoothstep(0.04, 0.2, e));
  col = mix(col, vec3(0.27, 0.24, 0.45), smoothstep(0.16, 0.45, e));
  col = mix(col, vec3(0.09, 0.11, 0.27), smoothstep(0.4, 0.95, e));
  // Del lado contrario al sol el cielo bajo es más frío y apagado.
  col *= mix(mix(vec3(0.6, 0.55, 0.78), vec3(1.05, 1.0, 0.95), toward), vec3(1.0), smoothstep(0.1, 0.6, e));

  // Halo del sol (dispersión hacia adelante) y el disco, casi tocando el horizonte.
  col += vec3(0.95, 0.45, 0.15) * pow(sd, 6.0) * 0.35;
  col += vec3(1.0, 0.58, 0.25) * pow(sd, 60.0) * 0.45;
  col = min(col, vec3(1.0));
  col = mix(col, vec3(1.0, 0.93, 0.64), smoothstep(0.99955, 0.99972, sd)); // disco dorado

  // Nubes: estratos estirados que se desplazan muy despacio; más encendidas cerca del sol.
  if (h > 0.0) {
    vec2 uv = d.xz / (h + 0.1);
    float n = fbm(uv * vec2(0.55, 1.6) + vec2(uTime * 0.006, 0.0));
    float band = smoothstep(0.015, 0.07, h) * (1.0 - smoothstep(0.32, 0.6, h));
    float cl = smoothstep(0.52, 0.8, n) * band;
    float lit = pow(sd, 3.0) * 0.9 + 0.35 * (1.0 - smoothstep(0.0, 0.25, h)) * toward;
    vec3 cloud = mix(vec3(0.33, 0.18, 0.3), vec3(1.0, 0.52, 0.38), clamp(lit, 0.0, 1.0));
    cloud += vec3(0.6, 0.35, 0.12) * pow(sd, 20.0) * smoothstep(0.6, 0.75, n); // bordes dorados
    col = mix(col, cloud, cl * 0.9);
  } else {
    col = mix(vec3(0.42, 0.24, 0.2), vec3(0.08, 0.05, 0.07), smoothstep(0.0, 0.15, -h));
  }
  gl_FragColor = vec4(min(col, vec3(1.0)), 0.0); // alfa 0: la vista ASCII sabe que esta celda es cielo
}`;

export function createSky(sunDir, uniforms) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: new THREE.Vector3(...sunDir) }, uTime: uniforms.uTime },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), mat);
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  return sky;
}

// Cordilleras lejanas: siluetas con la bruma del atardecer, más claras y cálidas las del fondo.
function ridge(radius, height, seed, near, far, sunDir) {
  const N = 220, pos = [], col = [], idx = [];
  const sunAz = Math.atan2(sunDir[2], sunDir[0]);
  const c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    let y = 0;
    for (let k = 1; k <= 4; k++) y += Math.sin(a * (k * 3 + seed) + seed * k * 1.7) / k;
    y = height * (0.55 + 0.3 * y + 0.15 * Math.sin(a * 23 + seed));
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    const glow = Math.max(0, Math.cos(a - sunAz)) ** 3; // la cresta hacia el sol toma luz
    pos.push(x, -0.5, z, x, y, z);
    c.setRGB(...near, THREE.SRGBColorSpace); col.push(c.r, c.g, c.b);
    c.setRGB(...far.map((v, j) => v + glow * [0.12, 0.05, 0.02][j]), THREE.SRGBColorSpace); col.push(c.r, c.g, c.b);
    if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, markAsGround(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide })));
  m.renderOrder = -1;
  return m;
}

export function createHills(sunDir) {
  const group = new THREE.Group();
  group.add(ridge(70, 2.4, 2, [0.33, 0.2, 0.22], [0.42, 0.26, 0.3], sunDir));
  group.add(ridge(48, 1.6, 5, [0.2, 0.12, 0.13], [0.26, 0.15, 0.18], sunDir));
  return group;
}
