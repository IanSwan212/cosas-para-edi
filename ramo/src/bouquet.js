// Composición del ramo y escena 3D.
//
// Las 29 cabezas se reparten sobre una cúpula redonda (espiral de Fibonacci
// sobre un elipsoide), cada una mirando hacia fuera desde el centro del ramo,
// para que se vea bien desde cualquier lado al girarlo. La espiral empieza en
// la cima y baja: con pocas flores el ramo ya está centrado, y cada flor nueva
// se suma alrededor a otra altura.
import * as THREE from "three";
import { createFlower } from "./flower.js?v=mvue8paf";

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
export const TIE = new THREE.Vector3(0, 0.25, 0); // punto donde convergen los tallos

export function computeSlots(flowers) {
  const N = flowers.length;
  const center = new THREE.Vector3(0, 2.9, 0);
  const rx = 2.6, ry = 2.5, rz = 2.6;
  // Banda alrededor del ramo (de ~30° bajo la cima a algo bajo el ecuador): así las
  // flores miran hacia los lados y se aprecian de frente y de perfil, no solo desde arriba.
  const cosTop = 0.86, cosBottom = -0.42;

  // 1) Reparto inicial: espiral de Fibonacci dentro de la banda.
  const normals = flowers.map((cfg, i) => {
    const t = (i + 0.5) / N;
    const c = cosTop - t * (cosTop - cosBottom);
    const sp = Math.sqrt(1 - c * c);
    const az = i * GOLDEN + 0.6;
    return new THREE.Vector3(sp * Math.cos(az), c, sp * Math.sin(az));
  });
  const onEllipsoid = (n) => new THREE.Vector3(center.x + n.x * rx, center.y + n.y * ry, center.z + n.z * rz);

  // 2) Relajación determinista: cada par se separa hasta dejar un hueco entre sus
  //    cabezas (radio ≈ largo del pétalo + margen), para que cada flor tenga su espacio.
  const radius = flowers.map((cfg) => cfg.size * 1.05 + 0.12);
  for (let iter = 0; iter < 600; iter++) {
    const push = normals.map(() => new THREE.Vector3());
    for (let i = 0; i < N; i++) {
      const pi = onEllipsoid(normals[i]);
      for (let j = i + 1; j < N; j++) {
        const pj = onEllipsoid(normals[j]);
        const d = pi.distanceTo(pj);
        const want = radius[i] + radius[j];
        if (d < want) {
          const dir = pi.clone().sub(pj).normalize().multiplyScalar(((want - d) / want) * 0.22);
          push[i].add(dir);
          push[j].sub(dir);
        }
      }
    }
    normals.forEach((n, i) => {
      n.add(push[i]);
      n.y = Math.min(cosTop, Math.max(cosBottom, n.y));
      n.normalize();
    });
  }

  return flowers.map((cfg, i) => {
    const n = normals[i];
    const head = onEllipsoid(n);
    // Mira hacia fuera, casi horizontal, apenas inclinada hacia arriba.
    const dir = new THREE.Vector3(n.x / rx, (n.y / ry) * 0.45 + 0.18, n.z / rz).normalize();
    // Tallo: base del manojo → atadura común → curva suave → flor.
    const base = new THREE.Vector3(head.x * 0.05, -1.15, head.z * 0.05);
    const tie = new THREE.Vector3(head.x * 0.06, TIE.y, head.z * 0.06);
    const mid = new THREE.Vector3(head.x * 0.45, TIE.y + (head.y - TIE.y) * 0.5, head.z * 0.45);
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
  scene.add(new THREE.HemisphereLight("#fff1f4", "#0b1a0d", 1.05));
  const key = new THREE.DirectionalLight("#fff4e6", 2.6);
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
    // Pestaña abierta en segundo plano: aún no hay tamaño; se reintenta al llegar el evento resize.
    if (!(width > 0 && height > 0)) return;
    if (sizeRenderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
    }
    camera.aspect = width / height;
    // Encuadre: el ramo completo (alto ≈ 7.6, ancho ≈ 5.2) cabe en cualquier proporción.
    const h = 9.4, w = 7.0;
    const vfov = (camera.fov * Math.PI) / 180;
    const distH = h / 2 / Math.tan(vfov / 2);
    const distW = w / 2 / (Math.tan(vfov / 2) * camera.aspect);
    const dist = Math.max(distH, distW) + 0.6;
    const mobile = camera.aspect < 0.8;
    view.target.set(0, mobile ? 2.45 : 2.55, 0);
    view.distance = dist;
    // Solo la primera vez se coloca la cámara; después la mueve el usuario.
    if (!view.placed || !Number.isFinite(camera.position.x + camera.position.y + camera.position.z)) {
      camera.position.set(0, 3.6, dist); // casi de frente, apenas desde arriba
      camera.lookAt(view.target);
      view.placed = true;
    }
    camera.updateProjectionMatrix();
  }

  const view = { target: new THREE.Vector3(), distance: 14, placed: false };
  return { renderer, scene, camera, bouquet, resize, view };
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
      return this.show(count, { now, stagger });
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
