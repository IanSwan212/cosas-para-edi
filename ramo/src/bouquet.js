// Composición del ramo y escena 3D.
//
// Las 29 posiciones se calculan pensando en el ramo completo: una espiral de
// ángulo áureo sobre una cúpula ovalada. Como la espiral crece del centro hacia
// fuera, con pocas flores el ramo ya se ve centrado y equilibrado, y cada flor
// nueva se suma por el borde a otra altura y profundidad.
import * as THREE from "three";
import { createFlower } from "./flower.js";

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
export const TIE = new THREE.Vector3(0, 0.25, 0.1); // punto donde convergen los tallos

export function computeSlots(flowers) {
  const N = flowers.length;
  const rx = 1.6, ry = 2.45, cy = 3.25, depth = 1.15;
  // Foco lejano detrás del ramo: las flores miran casi de frente, como en el video.
  const focus = new THREE.Vector3(0, cy - 0.9, -5.5);
  return flowers.map((cfg, i) => {
    const r = Math.sqrt((i + 0.55) / (N + 0.55));
    const a = i * GOLDEN + 1.2;
    const head = new THREE.Vector3(
      rx * r * Math.cos(a),
      cy + ry * r * Math.sin(a) * 0.92 + (1 - r) * 0.25,
      depth * Math.sqrt(Math.max(0, 1 - r * r * 0.82)) - 0.15 + Math.sin(i * 1.7) * 0.08
        // Capas alternas delante/detrás para que las flores vecinas no se atraviesen.
        + (i % 2 ? -0.32 : 0.28) * (1 - r)
    );
    const dir = head.clone().sub(focus).normalize();
    // Tallo: base del manojo → atadura común → curva suave → flor.
    const base = new THREE.Vector3(head.x * 0.05, -1.15, TIE.z + head.z * 0.04);
    const tie = new THREE.Vector3(head.x * 0.06, TIE.y, TIE.z + head.z * 0.05);
    const mid = new THREE.Vector3(head.x * 0.42, TIE.y + (head.y - TIE.y) * 0.45, head.z * 0.45 + 0.05);
    const curve = new THREE.CatmullRomCurve3([base, tie, mid, head], false, "centripetal");
    return { head, dir, curve };
  });
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor("#000000", 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  // Iluminación suave: cielo cálido, luz principal, contraluz frío y relleno.
  scene.add(new THREE.HemisphereLight("#fff1f4", "#0b1a0d", 0.85));
  const key = new THREE.DirectionalLight("#fff4e6", 2.1);
  key.position.set(-3, 6, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#b8c8ff", 1.1);
  rim.position.set(4, 3, -6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight("#ffd9e4", 0.45);
  fill.position.set(5, -1, 4);
  scene.add(fill);

  const bouquet = new THREE.Group();
  scene.add(bouquet);

  function resize(width, height, { sizeRenderer = true } = {}) {
    if (sizeRenderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
    }
    camera.aspect = width / height;
    // Encuadre: el ramo completo (alto ≈ 7.6, ancho ≈ 5.2) cabe en cualquier proporción.
    const h = 8.4, w = 5.3;
    const vfov = (camera.fov * Math.PI) / 180;
    const distH = h / 2 / Math.tan(vfov / 2);
    const distW = w / 2 / (Math.tan(vfov / 2) * camera.aspect);
    const dist = Math.max(distH, distW);
    const mobile = camera.aspect < 0.8;
    camera.position.set(0, 2.5, dist + 0.6);
    camera.lookAt(0, mobile ? 2.75 : 2.85, 0);
    camera.updateProjectionMatrix();
  }

  return { renderer, scene, camera, bouquet, resize };
}

/** Gestiona qué flores están en escena y su crecimiento animado. */
export function createBouquet(group, flowerDefs) {
  const slots = computeSlots(flowerDefs);
  const built = new Map(); // índice → flor
  const anim = new Map(); // índice → {from, to, start, duration}

  const get = (i) => {
    if (!built.has(i)) {
      const f = createFlower(flowerDefs[i], slots[i]);
      built.set(i, f);
      group.add(f.root);
    }
    return built.get(i);
  };

  return {
    slots,
    /**
     * Muestra exactamente `count` flores.
     * @param instantBelow  flores con índice menor aparecen ya abiertas
     * @param stagger       segundos entre flores animadas
     */
    show(count, { now, instantBelow = 0, stagger = 0.45, duration = 3.2, reverseDuration = 1.1 }) {
      let k = 0;
      for (let i = 0; i < flowerDefs.length; i++) {
        if (i < count) {
          const f = get(i);
          const target = anim.get(i)?.to ?? f.growth;
          if (i < instantBelow) {
            anim.delete(i);
            f.setGrowth(1);
          } else if (target < 1) {
            anim.set(i, { from: Math.max(0, f.growth), to: 1, start: now + k * stagger, duration });
            k++;
          }
        } else if (built.has(i)) {
          const f = built.get(i);
          if (f.growth > 0) anim.set(i, { from: f.growth, to: 0, start: now, duration: reverseDuration });
        }
      }
      return k;
    },
    replay(count, now, stagger) {
      for (const [, f] of built) f.setGrowth(0);
      anim.clear();
      return this.show(count, { now, stagger, duration: 4.2 });
    },
    /** Avanza las animaciones; devuelve true si alguna sigue activa. */
    update(now, swayTime, swayAmount) {
      for (const [i, a] of anim) {
        const f = built.get(i);
        const t = Math.min(1, Math.max(0, (now - a.start) / a.duration));
        f.setGrowth(a.from + (a.to - a.from) * t);
        if (t >= 1) anim.delete(i);
      }
      for (const [, f] of built) if (f.growth > 0) f.swayAt(swayTime, swayAmount);
      return anim.size > 0;
    },
    get animating() { return anim.size > 0; },
    /** Último instante en que termina alguna animación pendiente. */
    endTime() {
      let end = 0;
      for (const [, a] of anim) end = Math.max(end, a.start + a.duration);
      return end;
    },
    dispose() {
      for (const [, f] of built) { group.remove(f.root); f.dispose(); }
      built.clear();
      anim.clear();
    }
  };
}
