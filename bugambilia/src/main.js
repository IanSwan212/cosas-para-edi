// Escena de la bugambilia: renderizador, luces, cámara, reloj único y controles.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildPlant } from "./plant.js?v=mw1myqzz";
import { TIMING, DURATION, windAt } from "./timeline.js?v=mw1myqzz";
import { bractState, flowerState, assignMessage, heartPoints } from "./bracts.js?v=mw1myqzz";
import { createBranchMesh, createLeafMesh, createThornMesh, createBractMesh, createFlowerMesh, srgb } from "./meshes.js?v=mw1myqzz";
import { createSky, createHills } from "./sky.js?v=mw1myqzz";
import { AsciiView, markAsGround } from "./ascii.js?v=mw1myqzz";

// El sol del atardecer: bajo, detrás de la planta y un poco a la izquierda (de frente a la cámara).
const SUN = new THREE.Vector3(-0.24, 0.1, -1).normalize();
const HAZE = new THREE.Color().setRGB(0.2, 0.12, 0.13, THREE.SRGBColorSpace);
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = HAZE;

const plant = buildPlant();
const { center, radius, min, max } = plant.bounds;

// ---------- Luces: el sol bajo da contraluz y sombras largas; cielo y un relleno cálido de frente ----------
const uniforms = { uTime: { value: 0 }, uWind: { value: 0 }, uGlow: { value: 0.2 }, uSunView: { value: new THREE.Vector3() } };
scene.add(new THREE.HemisphereLight(0xc99aa4, 0x3a2018, 0.6)); // cielo rosado: el fucsia no se vuelve violeta
const sun = new THREE.DirectionalLight(0xffa25a, 3.2);
sun.position.set(...center).addScaledVector(SUN, 20);
sun.target.position.set(...center);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -radius * 1.4, right: radius * 1.4, top: radius * 1.4, bottom: -radius * 1.4, near: 5, far: 40 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xffc6ae, 0.65);
fill.position.set(center[0] + 2, 3, center[2] + 7);
scene.add(fill);

// ---------- Cielo, cordilleras y suelo de tierra que se pierde en la bruma ----------
const sky = createSky(SUN.toArray(), uniforms);
scene.add(sky, createHills(SUN.toArray()));
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2),
  markAsGround(new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.075, 0.05, 0.045, THREE.SRGBColorSpace), roughness: 1 })));
ground.receiveShadow = true;
scene.add(ground);

// ---------- La planta ----------
const branches = createBranchMesh(plant, uniforms);
const leaves = createLeafMesh(plant, uniforms);
const thorns = createThornMesh(plant, uniforms);
const bracts = createBractMesh(plant, uniforms);
const flowers = createFlowerMesh(plant);
scene.add(branches, leaves, thorns, bracts, flowers);

// «Es que te amo tanto» en letra manuscrita, arriba en el cielo, y al final un corazón pequeño.
// Las coordenadas son las del marco del mensaje (ver updateFrame); en pantallas angostas
// el texto va en dos renglones.
async function messagePoints() {
  const FONT = '200px "Great Vibes", "Segoe Script", cursive';
  try { await document.fonts.load(FONT); } catch (e) {}
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const narrow = aspect < 0.9;
  const lines = narrow ? ["Es que", "te amo tanto"] : ["Es que te amo tanto"];
  const LH = 210, PAD = 90, W = 1900, H = LH * lines.length + PAD * 2;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d", { willReadFrequently: true });
  x.font = FONT;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = x.strokeStyle = "#fff";
  x.lineWidth = 4; // la letra manuscrita es fina: se engrosa un poco para que se lea hecha de pétalos
  x.lineJoin = "round";
  const lineY = (i) => PAD + LH * (i + 0.5);
  lines.forEach((l, i) => { x.fillText(l, W / 2, lineY(i)); x.strokeText(l, W / 2, lineY(i)); });
  const data = x.getImageData(0, 0, W, H).data;

  // Tamaño visible en unidades del mensaje, para que todo quede dentro del cielo.
  const unit = Math.min(0.44, 0.45 * aspect);
  const halfW = (0.5 * aspect) / unit, halfH = 0.5 / unit;
  const widths = lines.map((l) => x.measureText(l).width);
  const hs = 0.12; // medio ancho del corazón
  const k = Math.min(2.0, halfW * 1.84 - hs * 3.4) / Math.max(...widths);
  const yc = halfH * (narrow ? 0.5 : 0.6);
  const toY = (py) => -(py - H / 2) * k + yc;

  // El texto y el corazón quedan centrados juntos.
  const last = lines.length - 1;
  const shift = -(hs * 2.6) / 2;
  let pts = [];
  for (let step = 4; step < 40; step++) {
    pts = [];
    for (let py = 0, row = 0; py < H; py += step, row++) {
      const li = Math.min(lines.length - 1, Math.max(0, Math.floor((py - PAD) / LH)));
      for (let px = row % 2 ? step / 2 : 0; px < W; px += step) {
        if (data[(Math.floor(py) * W + Math.floor(px)) * 4 + 3] > 140) {
          pts.push({ x: (px - W / 2) * k + (li === last ? shift : 0), y: toY(py), order: ((li + px / W) / lines.length) * 0.86, text: true });
        }
      }
    }
    if (pts.length <= 1000) break;
  }

  // El corazón, pequeño, justo después de la última palabra; se dibuja al final.
  const hx = (widths[last] / 2) * k + hs * 1.6 + shift, hy = toY(lineY(last)) + hs * 0.2;
  const heart = heartPoints(60).map((p) => ({ x: p.x * hs + hx, y: p.y * hs + hy, order: 0.88 + (p.order / 0.55) * 0.12, k: 0.42 }));
  return pts.concat(heart);
}
messagePoints().then((pts) => assignMessage(plant, pts));

const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), sc = new THREE.Vector3();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const colorCache = new Map();
const colorOf = (c) => {
  const k = c.join();
  let v = colorCache.get(k);
  if (!v) { v = srgb(c); if (colorCache.size < 4000) colorCache.set(k, v); }
  return v;
};

// Marco del mensaje: un plano entre la cámara y la planta, siempre de frente a quien mira.
const msgFrame = { c: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1], scale: 1 };
const _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _c = new THREE.Vector3();
function updateFrame() {
  camera.updateMatrixWorld();
  sky.position.copy(camera.position); // la cúpula sigue a la cámara
  _r.setFromMatrixColumn(camera.matrixWorld, 0);
  _u.setFromMatrixColumn(camera.matrixWorld, 1);
  _f.setFromMatrixColumn(camera.matrixWorld, 2);
  const dc = camera.position.distanceTo(controls.target) * 0.7;
  const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dc;
  _c.copy(camera.position).addScaledVector(_f, -dc).addScaledVector(_u, visH * 0.03);
  msgFrame.c = _c.toArray(); msgFrame.r = _r.toArray(); msgFrame.u = _u.toArray(); msgFrame.f = _f.toArray();
  msgFrame.scale = Math.min(visH * 0.44, visH * camera.aspect * 0.45);
  uniforms.uSunView.value.copy(SUN).transformDirection(camera.matrixWorldInverse);
}

function updatePlant(t) {
  uniforms.uTime.value = t;
  uniforms.uWind.value = windAt(t);
  updateFrame();
  let i = 0;
  for (const tri of plant.triads) {
    for (const b of tri.bracts) {
      const s = bractState(tri, b, t, TIMING, msgFrame);
      if (!s) bracts.setMatrixAt(i, ZERO);
      else {
        bracts.setMatrixAt(i, m4.compose(pp.set(...s.pos), qq.set(...s.q), sc.setScalar(s.scale)));
        bracts.setColorAt(i, colorOf(s.color));
      }
      i++;
    }
  }
  bracts.instanceMatrix.needsUpdate = true;
  bracts.instanceColor.needsUpdate = true;
  plant.triads.forEach((tri, j) => {
    const f = flowerState(tri, t);
    flowers.setMatrixAt(j, f ? m4.compose(pp.set(...f.pos), qq.set(...f.q), sc.setScalar(f.scale)) : ZERO);
  });
  flowers.instanceMatrix.needsUpdate = true;
}

// ---------- Cámara: encuadra la planta entera según la pantalla; giro lento y discreto ----------
const camera = new THREE.PerspectiveCamera(34, 1, 0.03, 200);
// Todo se dibuja en arte ASCII de colores, como el ramo, la luna y el zorro.
const ascii = new AsciiView({ renderer, scene, camera, exposure: renderer.toneMappingExposure });
const target = new THREE.Vector3(center[0], center[1] * 0.92, center[2]);
camera.position.set(target.x + 0.4, target.y + 0.3, target.z + 7); // casi a ras: la planta contra el cielo
const controls = new OrbitControls(camera, canvas);
controls.target.copy(target);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI * 0.53;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
controls.addEventListener("start", () => { controls.autoRotate = false; });

// Si la página carga con tamaño cero (pestaña oculta), se espera a tener tamaño real.
function frame() {
  const w = window.innerWidth, h = window.innerHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  ascii.resize(w, h);
  camera.aspect = w / h;
  const half = THREE.MathUtils.degToRad(camera.fov / 2);
  const height = max[1] - min[1], width = Math.max(max[0] - min[0], max[2] - min[2]);
  const fit = width / 4 + Math.max((height / 2) * 1.18 / Math.tan(half), (width / 2) * (camera.aspect < 1 ? 1.02 : 1.12) / (Math.tan(half) * camera.aspect));
  let dir = camera.position.clone().sub(target).normalize();
  if (!Number.isFinite(dir.x)) dir = new THREE.Vector3(0.06, 0.13, 1).normalize();
  camera.position.copy(target).addScaledVector(dir, fit);
  controls.minDistance = fit * 0.35;
  controls.maxDistance = fit * 1.8;
  scene.fog = new THREE.Fog(HAZE, fit * 1.3, fit * 6);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", frame);
document.addEventListener("visibilitychange", frame);
frame();

// ---------- Reloj único; al tocar la bugambilia, la animación vuelve a empezar ----------
const clock = { t: 0, playing: true, speed: 1 };
const setPlaying = (on) => { clock.playing = on; };

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function onPlant(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects([branches, leaves, bracts], false).length > 0;
}
// Un toque (no un arrastre para girar la cámara) sobre la planta la reinicia.
let down = null;
canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener("pointerup", (e) => {
  if (!down) return;
  const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 500;
  down = null;
  if (tap && onPlant(e)) { clock.t = 0; setPlaying(true); }
});
// Con mouse, la manita indica que la planta se puede tocar.
let hoverPending = false;
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || hoverPending || down) return;
  hoverPending = true;
  requestAnimationFrame(() => { hoverPending = false; canvas.style.cursor = onPlant(e) ? "pointer" : ""; });
});

let last = performance.now();
function loop(now) {
  if (canvas.width !== Math.round(window.innerWidth * renderer.getPixelRatio())) frame();
  // Tiempo real aunque el navegador dibuje pocos cuadros por segundo; solo se descarta un
  // salto grande (pestaña en segundo plano) para no brincar partes de la animación.
  const gap = (now - last) / 1000;
  const dt = gap > 1 ? 0 : gap;
  last = now;
  if (clock.playing) clock.t = Math.min(clock.t + dt * clock.speed, DURATION + 40);
  updatePlant(clock.t);
  controls.update(dt);
  ascii.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Para revisar cuadros concretos desde la consola.
window.__bugambilia = {
  plant, clock, scene, camera, renderer, render: (t) => { clock.t = t; setPlaying(false); updatePlant(t); controls.update(); ascii.render(); },
};
