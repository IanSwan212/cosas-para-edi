// Escena de la bugambilia: renderizador, luces, cámara, reloj único y controles.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildPlant } from "./plant.js";
import { TIMING, DURATION, windAt, phaseAt } from "./timeline.js";
import { bractState, flowerState } from "./bracts.js";
import { createBranchMesh, createLeafMesh, createThornMesh, createBractMesh, createFlowerMesh, srgb } from "./meshes.js";

const BG = 0x060a16;
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);

const plant = buildPlant();
const { center, radius, min, max } = plant.bounds;

// ---------- Luces: principal cálida, relleno frío, contorno por detrás y una lateral rosada ----------
scene.add(new THREE.HemisphereLight(0x8a9fd6, 0x1a1410, 0.5));
const key = new THREE.DirectionalLight(0xffe8d6, 2.2);
key.position.set(center[0] + 3, 6, center[2] + 4);
key.target.position.set(...center);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -radius * 1.3, right: radius * 1.3, top: radius * 1.3, bottom: -radius * 1.3, near: 1, far: 16 });
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight(0x9fb4ff, 0.55);
fill.position.set(-5, 2, 3);
const rim = new THREE.DirectionalLight(0xffd2ee, 1.6);
rim.position.set(-1, 3.5, -6);
const side = new THREE.DirectionalLight(0xff9acb, 0.45);
side.position.set(6, 1.2, -1);
scene.add(fill, rim, side);

// ---------- Suelo oscuro que se funde con el fondo ----------
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x080c1a, roughness: 1 }));
ground.receiveShadow = true;
scene.add(ground);

// ---------- La planta ----------
const uniforms = { uTime: { value: 0 }, uWind: { value: 0 }, uGlow: { value: 0.16 } };
const branches = createBranchMesh(plant, uniforms);
const leaves = createLeafMesh(plant, uniforms);
const thorns = createThornMesh(plant, uniforms);
const bracts = createBractMesh(plant, uniforms);
const flowers = createFlowerMesh(plant);
scene.add(branches, leaves, thorns, bracts, flowers);

const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), sc = new THREE.Vector3();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const colorCache = new Map();
const colorOf = (c) => {
  const k = c.join();
  let v = colorCache.get(k);
  if (!v) { v = srgb(c); if (colorCache.size < 4000) colorCache.set(k, v); }
  return v;
};

function updatePlant(t) {
  uniforms.uTime.value = t;
  uniforms.uWind.value = windAt(t);
  let i = 0;
  for (const tri of plant.triads) {
    for (const b of tri.bracts) {
      const s = bractState(tri, b, t);
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
const camera = new THREE.PerspectiveCamera(34, 1, 0.03, 60);
const target = new THREE.Vector3(center[0], center[1] * 0.92, center[2]);
camera.position.set(target.x + 0.4, target.y + 0.9, target.z + 7);
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
  camera.aspect = w / h;
  const half = THREE.MathUtils.degToRad(camera.fov / 2);
  const height = max[1] - min[1], width = Math.max(max[0] - min[0], max[2] - min[2]);
  const fit = width / 4 + Math.max((height / 2) * 1.18 / Math.tan(half), (width / 2) * (camera.aspect < 1 ? 1.02 : 1.12) / (Math.tan(half) * camera.aspect));
  let dir = camera.position.clone().sub(target).normalize();
  if (!Number.isFinite(dir.x)) dir = new THREE.Vector3(0.06, 0.13, 1).normalize();
  camera.position.copy(target).addScaledVector(dir, fit);
  controls.minDistance = fit * 0.35;
  controls.maxDistance = fit * 1.8;
  scene.fog = new THREE.Fog(BG, fit * 0.95, fit * 2.4);
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
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (clock.playing) clock.t = Math.min(clock.t + dt * clock.speed, DURATION + 40);
  updatePlant(clock.t);
  if (!scrubbing) ui.scrub.value = String(Math.min(clock.t, DURATION));
  const ph = phaseAt(clock.t).name;
  if (ph !== lastPhase) { ui.phase.textContent = ph; lastPhase = ph; }
  controls.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Para revisar cuadros concretos desde la consola.
window.__bugambilia = {
  plant, clock, scene, camera, renderer, render: (t) => { clock.t = t; setPlaying(false); updatePlant(t); controls.update(); renderer.render(scene, camera); },
};
