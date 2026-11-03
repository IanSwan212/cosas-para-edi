// Geometrías y materiales de la bugambilia. Todo se construye una sola vez:
//  - Ramas: un solo BufferGeometry de tubos. El crecimiento ocurre en el shader: cada anillo
//    sabe su centro, su posición a lo largo de la rama y su ventana de tiempo, y se encoge
//    hacia su centro mientras el frente de crecimiento no ha llegado.
//  - Hojas y espinas: InstancedMesh con su ventana de tiempo por instancia; la hoja se
//    despliega (se abre desde la nervadura) y se mece en el shader.
//  - Brácteas y florecitas: InstancedMesh cuyas matrices se actualizan en la CPU (bracts.js),
//    porque su vuelo necesita la pose exacta del instante en que se sueltan.
// Los materiales de sombra repiten la misma deformación para que la sombra crezca con la planta.
import * as THREE from "three";

const srgb = (c) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);

function inject(material, uniforms, key, header, beginNormal, beginVertex) {
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\n" + header)
      .replace("#include <beginnormal_vertex>", beginNormal ?? "#include <beginnormal_vertex>")
      .replace("#include <begin_vertex>", beginVertex);
  };
  material.customProgramCacheKey = () => key;
  return material;
}

function withDepth(mesh, uniforms, key, header, beginVertex) {
  mesh.customDepthMaterial = inject(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), uniforms, key + "-depth", header, null, beginVertex);
  mesh.castShadow = true;
}

// ---------- Ramas ----------

const BRANCH_GLSL = `
uniform float uTime;
attribute vec3 aCenter;
attribute float aS;
attribute vec2 aWin;
vec3 growBranch(vec3 p) {
  float g = clamp((uTime - aWin.x) / (aWin.y - aWin.x), 0.0, 1.0);
  float f = clamp((g * 1.06 - aS) / 0.06, 0.0, 1.0);
  return aCenter + (p - aCenter) * f;
}`;
const BRANCH_VERTEX = "vec3 transformed = growBranch(position);";

const BARK = { old: [0.33, 0.22, 0.16], mid: [0.4, 0.29, 0.19], young: [0.38, 0.44, 0.2], stalk: [0.55, 0.6, 0.3] };
const SEGMENTS = [12, 9, 7, 6, 5];

export function createBranchMesh(plant, uniforms) {
  const pos = [], nor = [], col = [], cen = [], ss = [], win = [], idx = [];
  const tmp = new THREE.Color();
  for (const b of plant.branches) {
    const seg = SEGMENTS[b.depth];
    const base = pos.length / 3;
    let N = new THREE.Vector3(...perpOf(b.tans[0]));
    const T = new THREE.Vector3(), Bv = new THREE.Vector3(), off = new THREE.Vector3();
    for (let i = 0; i <= b.n; i++) {
      T.set(...b.tans[i]);
      N.addScaledVector(T, -N.dot(T)).normalize(); // transporte paralelo: sin torsiones bruscas
      Bv.crossVectors(T, N);
      const s = i / b.n, r = b.radii[i], c = b.pts[i];
      const tone = b.depth <= 1 ? mixC(BARK.old, BARK.mid, s * b.depth)
        : b.depth === 2 ? mixC(BARK.mid, BARK.young, smooth(0.45, 1, s))
        : b.depth === 3 ? mixC(BARK.mid, BARK.young, 0.55 + 0.45 * s) : BARK.stalk;
      for (let k = 0; k <= seg; k++) {
        const a = (k / seg) * Math.PI * 2;
        off.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(Bv, Math.sin(a));
        pos.push(c[0] + off.x * r, c[1] + off.y * r, c[2] + off.z * r);
        nor.push(off.x, off.y, off.z);
        const streak = 0.84 + 0.16 * Math.abs(Math.sin(k * 2.7 + i * 0.35 + b.depth));
        tmp.copy(srgb(tone)).multiplyScalar(streak);
        col.push(tmp.r, tmp.g, tmp.b);
        cen.push(c[0], c[1], c[2]);
        ss.push(s);
        win.push(b.t0, b.t1);
      }
    }
    for (let i = 0; i < b.n; i++) {
      for (let k = 0; k < seg; k++) {
        const a = base + i * (seg + 1) + k, d = a + seg + 1;
        idx.push(a, d, a + 1, a + 1, d, d + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("aCenter", new THREE.Float32BufferAttribute(cen, 3));
  g.setAttribute("aS", new THREE.Float32BufferAttribute(ss, 1));
  g.setAttribute("aWin", new THREE.Float32BufferAttribute(win, 2));
  g.setIndex(idx);
  const m = inject(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }), uniforms, "branch", BRANCH_GLSL, null, BRANCH_VERTEX);
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  withDepth(mesh, uniforms, "branch", BRANCH_GLSL, BRANCH_VERTEX);
  mesh.receiveShadow = true;
  return mesh;
}

function perpOf(v) {
  const ref = Math.abs(v[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  return new THREE.Vector3(...v).cross(new THREE.Vector3(...ref)).normalize().toArray();
}
const mixC = (a, b, k) => a.map((x, i) => x + (b[i] - x) * Math.min(1, Math.max(0, k)));
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------- Hojas y espinas ----------

// Hoja de bugambilia: pecíolo corto, lámina ovada con base ancha y punta fina, plegada en V
// sobre la nervadura y un poco arqueada. Mide 1 de largo; la instancia le da su tamaño.
function leafGeometry() {
  const nu = 3, nv = 9, pos = [], col = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const blade = v < 0.14 ? 0 : (v - 0.14) / 0.86;
    const w = v < 0.14 ? 0.03 : Math.max(0.03, 0.4 * Math.pow(Math.sin(Math.PI * Math.pow(blade, 0.62)), 0.9));
    for (let i = 0; i <= 2 * nu; i++) {
      const u = i / nu - 1, x = u * w;
      const z = Math.abs(x) * 0.3 - 0.14 * v * v + 0.012 * Math.sin(u * 6 + v * 9) * blade;
      pos.push(x, v, z);
      const rib = Math.abs(u) < 0.1 ? 1.18 : 1 - 0.14 * Math.abs(u);
      const k = v < 0.14 ? 1.1 : rib;
      col.push(k, k, v < 0.14 ? 0.8 : k);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < 2 * nu; i++) {
    const a = j * (2 * nu + 1) + i, b = a + 2 * nu + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const LEAF_GLSL = `
uniform float uTime;
uniform float uWind;
attribute vec2 aWin;
attribute float aPhase;
void growLeaf(inout vec3 p, inout vec3 n) {
  float g = clamp((uTime - aWin.x) / (aWin.y - aWin.x), 0.0, 1.0);
  float e = 1.0 - pow(1.0 - g, 3.0);
  // Desplegado: cada mitad gira sobre la nervadura (eje Y) desde casi cerrada.
  float fold = (1.0 - e) * 1.25 * sign(p.x);
  float c = cos(fold), s = sin(fold);
  p.xz = vec2(p.x * c - p.z * s, p.x * s + p.z * c);
  n.xz = vec2(n.x * c - n.z * s, n.x * s + n.z * c);
  // Vaivén con el viento, desde el pecíolo.
  float a = sin(uTime * 1.6 + aPhase) * (0.05 + 0.12 * uWind) * e;
  c = cos(a); s = sin(a);
  p.yz = vec2(p.y * c - p.z * s, p.y * s + p.z * c);
  n.yz = vec2(n.y * c - n.z * s, n.y * s + n.z * c);
  p *= e * (1.0 + 0.08 * sin(g * 3.14159));
}`;
const LEAF_NORMAL = "vec3 objectNormal = vec3(normal); { vec3 _p = position; growLeaf(_p, objectNormal); }";
const LEAF_VERTEX = "vec3 transformed = vec3(position); { vec3 _n = vec3(0.0, 0.0, 1.0); growLeaf(transformed, _n); }";

const GROW_GLSL = `
uniform float uTime;
attribute vec2 aWin;
attribute float aPhase;`;
const GROW_VERTEX = "vec3 transformed = position * (1.0 - pow(1.0 - clamp((uTime - aWin.x) / (aWin.y - aWin.x), 0.0, 1.0), 3.0));";

function instanced(geometry, items, material, uniforms, key, header, normalChunk, vertexChunk) {
  const mesh = new THREE.InstancedMesh(geometry, inject(material, uniforms, key, header, normalChunk, vertexChunk), items.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const win = new Float32Array(items.length * 2), phase = new Float32Array(items.length);
  items.forEach((it, i) => {
    m.compose(p.set(...it.pos), q.set(...it.q), s.setScalar(it.size));
    mesh.setMatrixAt(i, m);
    if (it.color) mesh.setColorAt(i, srgb(it.color));
    win[i * 2] = it.t0; win[i * 2 + 1] = it.t1;
    phase[i] = it.phase ?? 0;
  });
  geometry.setAttribute("aWin", new THREE.InstancedBufferAttribute(win, 2));
  geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
  mesh.frustumCulled = false;
  withDepth(mesh, uniforms, key, header, vertexChunk);
  return mesh;
}

export function createLeafMesh(plant, uniforms) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.62, metalness: 0 });
  return instanced(leafGeometry(), plant.leaves, mat, uniforms, "leaf", LEAF_GLSL, LEAF_NORMAL, LEAF_VERTEX);
}

export function createThornMesh(plant, uniforms) {
  const g = new THREE.ConeGeometry(0.16, 1, 5, 3).translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + 0.3 * p.getY(i) ** 2); // espina curva
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: srgb([0.42, 0.34, 0.2]), roughness: 0.8 });
  return instanced(g, plant.thorns, mat, uniforms, "thorn", GROW_GLSL, null, GROW_VERTEX);
}

// ---------- Brácteas ----------

// Bráctea: ovada, base estrecha, punta sutil, cóncava hacia el centro de la tríada y con
// un borde apenas ondulado, como papel. Mide 1 de largo.
function bractGeometry() {
  const nu = 3, nv = 8, pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const w = 0.36 * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72)), 0.8) + 0.012;
    for (let i = 0; i <= 2 * nu; i++) {
      const u = i / nu - 1, x = u * w;
      const z = -0.5 * w * u * u + 0.12 * v * v + 0.014 * Math.sin(u * 7 + v * 11) * v;
      pos.push(x, v, z);
      uv.push(u * 0.5 + 0.5, v);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < 2 * nu; i++) {
    const a = j * (2 * nu + 1) + i, b = a + 2 * nu + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Textura de nervaduras: una vena central y venas laterales finas, más claras que el tejido.
function veinTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 256;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0, 0, 128, 0);
  bg.addColorStop(0, "rgb(170,170,170)");
  bg.addColorStop(0.5, "rgb(228,228,228)");
  bg.addColorStop(1, "rgb(170,170,170)");
  x.fillStyle = bg;
  x.fillRect(0, 0, 128, 256);
  x.strokeStyle = "rgba(255,255,255,0.75)";
  x.lineWidth = 3;
  x.beginPath(); x.moveTo(64, 256); x.quadraticCurveTo(66, 120, 64, 8); x.stroke();
  x.lineWidth = 1.4;
  x.strokeStyle = "rgba(255,255,255,0.5)";
  for (let k = 0; k < 8; k++) {
    const y = 236 - k * 26;
    for (const side of [-1, 1]) {
      x.beginPath();
      x.moveTo(64, y);
      x.quadraticCurveTo(64 + side * 30, y - 20, 64 + side * 54, y - 58);
      x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function createBractMesh(plant, uniforms) {
  const count = plant.triads.length * 3;
  const mat = new THREE.MeshStandardMaterial({ map: veinTexture(), side: THREE.DoubleSide, roughness: 0.55, metalness: 0 });
  // Un poco de luz propia: el color fucsia no se apaga en las zonas de sombra (efecto papel translúcido).
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = uniforms.uGlow;
    sh.fragmentShader = "uniform float uGlow;\n" + sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * uGlow;");
  };
  mat.customProgramCacheKey = () => "bract";
  const mesh = new THREE.InstancedMesh(bractGeometry(), mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.setColorAt(0, new THREE.Color());
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  return mesh;
}

// Florecita verdadera: tubo verde claro y una estrella blanca de cinco lóbulos con centro amarillo.
export function createFlowerMesh(plant) {
  const parts = [];
  const tube = new THREE.CylinderGeometry(0.07, 0.1, 1, 6, 1, true).translate(0, 0.5, 0);
  parts.push([tube, [0.82, 0.86, 0.66]]);
  const star = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.14 : 0.36;
    i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(r, 0);
  }
  parts.push([new THREE.ShapeGeometry(star).rotateX(-Math.PI / 2).translate(0, 1, 0), [0.98, 0.97, 0.92]]);
  parts.push([new THREE.CircleGeometry(0.07, 8).rotateX(-Math.PI / 2).translate(0, 1.005, 0), [0.97, 0.85, 0.3]]);
  const pos = [], nor = [], col = [];
  for (const [g, c] of parts) {
    const n = g.toNonIndexed();
    const lc = srgb(c);
    pos.push(...n.attributes.position.array);
    nor.push(...n.attributes.normal.array);
    for (let i = 0; i < n.attributes.position.count; i++) col.push(lc.r, lc.g, lc.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }), plant.triads.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  return mesh;
}

export { srgb };
