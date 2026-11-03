// Escena de la bugambilia: renderizador, luces, cámara, reloj único y controles.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildPlant } from "./plant.js";
import { TIMING, DURATION, windAt, phaseAt } from "./timeline.js";
import { bractState, flowerState, assignMessage, heartPoints } from "./bracts.js";
import { createBranchMesh, createLeafMesh, createThornMesh, createBractMesh, createFlowerMesh, srgb } from "./meshes.js";
import { createSky, createHills } from "./sky.js";
import { AsciiView, markAsGround } from "./ascii.js";

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
scene.add(new THREE.HemisphereLight(0x8c80bd, 0x3a2018, 0.6));
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

// «Te amo» en letra manuscrita, muestreado de un canvas, dentro del contorno de un corazón.
async function messagePoints() {
  const FONT = '280px "Great Vibes", "Segoe Script", cursive';
  try { await document.fonts.load(FONT); } catch (e) {}
  const W = 1000, H = 400, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d", { willReadFrequently: true });
  x.font = FONT;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff";
  const TEXT = "Te amo";
  x.fillText(TEXT, W / 2, H / 2);
  x.strokeStyle = "#fff";
  x.lineWidth = 4; // la letra manuscrita es fina: se engrosa un poco para que se lea hecha de pétalos
  x.lineJoin = "round";
  x.strokeText(TEXT, W / 2, H / 2);
  const data = x.getImageData(0, 0, W, H).data;
  const k = 1.6 / x.measureText(TEXT).width; // el texto mide 1.6 de ancho (el corazón va de -1 a 1)
  let pts = [];
  for (let step = 4; step < 40; step++) {
    pts = [];
    for (let py = 0, row = 0; py < H; py += step, row++) {
      for (let px = row % 2 ? step / 2 : 0; px < W; px += step) {
        if (data[(Math.floor(py) * W + Math.floor(px)) * 4 + 3] > 140) {
          pts.push({ x: (px - W / 2) * k, y: -(py - H / 2) * k + 0.36, order: 0.45 + 0.55 * (px / W), text: true });
        }
      }
    }
    if (pts.length <= 760) break;
  }
  return heartPoints().concat(pts);
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

// ---------- Reloj único y controles ----------
const clock = { t: 0, playing: true, speed: 1 };
const ui = {
  play: document.getElementById("play"),
  restart: document.getElementById("restart"),
  speed: document.getElementById("speed"),
  bloom: document.getElementById("bloom"),
  scrub: document.getElementById("scrub"),
  phase: document.getElementById("phase"),
  bar: document.getElementById("player"),
};
const SPEEDS = [0.5, 1, 2];
ui.scrub.max = String(DURATION);

function setPlaying(on) {
  clock.playing = on;
  ui.play.setAttribute("aria-pressed", String(!on));
  const label = on ? "Pausar" : "Reproducir";
  ui.play.setAttribute("aria-label", label);
  ui.play.title = label;
}
ui.play.addEventListener("click", () => {
  if (!clock.playing && clock.t >= DURATION + 6) clock.t = 0;
  setPlaying(!clock.playing);
});
ui.restart.addEventListener("click", () => { clock.t = 0; setPlaying(true); });
ui.speed.addEventListener("click", () => {
  clock.speed = SPEEDS[(SPEEDS.indexOf(clock.speed) + 1) % SPEEDS.length];
  ui.speed.textContent = `${clock.speed}×`.replace("0.5", "½");
});
ui.bloom.addEventListener("click", () => { clock.t = TIMING.peak.start + 1.2; setPlaying(false); });
let scrubbing = false;
ui.scrub.addEventListener("input", () => { scrubbing = true; clock.t = Number(ui.scrub.value); });
ui.scrub.addEventListener("change", () => { scrubbing = false; });

// La barra se aparta cuando no se usa, para que la planta sea la protagonista.
let idle;
const wake = () => { ui.bar.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => ui.bar.classList.add("idle"), 3500); };
window.addEventListener("pointermove", wake);
window.addEventListener("pointerdown", wake);
window.addEventListener("keydown", wake);
wake();

let last = performance.now();
let lastPhase = "";
function loop(now) {
  if (canvas.width !== Math.round(window.innerWidth * renderer.getPixelRatio())) frame();
  // Tiempo real aunque el navegador dibuje pocos cuadros por segundo; solo se descarta un
  // salto grande (pestaña en segundo plano) para no brincar partes de la animación.
  const gap = (now - last) / 1000;
  const dt = gap > 1 ? 0 : gap;
  last = now;
  if (clock.playing) clock.t = Math.min(clock.t + dt * clock.speed, DURATION + 40);
  updatePlant(clock.t);
  if (!scrubbing) ui.scrub.value = String(Math.min(clock.t, DURATION));
  const ph = phaseAt(clock.t).name;
  if (ph !== lastPhase) { ui.phase.textContent = ph; lastPhase = ph; }
  controls.update(dt);
  ascii.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Para revisar cuadros concretos desde la consola.
window.__bugambilia = {
  plant, clock, scene, camera, renderer, render: (t) => { clock.t = t; setPlaying(false); updatePlant(t); controls.update(); ascii.render(); },
};
