// Una flor completa (tallo + hojas + cabeza) con su animación de crecimiento.
// setGrowth(p), p ∈ [0, 1]: 0 = nada, 1 = flor abierta. El estado visual depende
// solo de p, así que se puede reproducir, invertir o saltar a cualquier punto.
import * as THREE from "three";
import { petalGeometry, leafGeometry, stemGeometry } from "./geometry.js?v=mvq5j85t";

const DEG = Math.PI / 180;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);

// Materiales compartidos por todo el ramo.
const MAT = {
  petal: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0 }),
  leaf: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.6 }),
  stem: new THREE.MeshStandardMaterial({ color: "#3f8a3a", roughness: 0.7 }),
  sepal: new THREE.MeshStandardMaterial({ color: "#3b7a33", roughness: 0.65 })
};
const solidCache = new Map();
const solid = (color, rough = 0.6) => {
  const key = color + rough;
  if (!solidCache.has(key)) solidCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough }));
  return solidCache.get(key);
};
const SPHERE = new THREE.SphereGeometry(1, 16, 12);
const THIN = new THREE.CylinderGeometry(0.5, 0.5, 1, 5, 1).translate(0, 0.5, 0);

/** Corona de pétalos: añade pivotes con ángulo de cierre/apertura y retardo. */
function ring(head, geo, { count, radius = 0, closed, open, phase = 0, delay = 0, step }) {
  const petals = [];
  for (let k = 0; k < count; k++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = phase + (step ?? (Math.PI * 2) / count) * k;
    const mesh = new THREE.Mesh(geo, MAT.petal);
    mesh.position.z = radius;
    pivot.add(mesh);
    head.add(pivot);
    petals.push({ mesh, closed, open, delay: delay + (k / count) * 0.08 });
  }
  return petals;
}

/** Construye la cabeza según la especie. Devuelve pétalos y piezas que aparecen al abrir. */
function buildHead(cfg) {
  const s = cfg.size;
  const [base, tip] = cfg.colors;
  const head = new THREE.Group();
  const petals = [];
  const extras = [];
  const n = cfg.petalCount;
  const addExtra = (mesh, scale) => { head.add(mesh); extras.push({ mesh, scale }); };

  switch (cfg.species) {
    case "lily": {
      // Estrella de seis pétalos vista de frente, como los lirios del video.
      const geoOuter = petalGeometry({ length: 1.08 * s, width: 0.36 * s, cup: 0.5, curl: 0.22, profile: "pointed", base, tip, spots: true, veins: 0.35 });
      const geoInner = petalGeometry({ length: 1.0 * s, width: 0.42 * s, cup: 0.55, curl: 0.2, profile: "pointed", base, tip, ruffle: 0.6, spots: true, veins: 0.35 });
      petals.push(...ring(head, geoOuter, { count: 3, closed: 5 * DEG, open: 80 * DEG, phase: cfg.spin }));
      petals.push(...ring(head, geoInner, { count: 3, closed: 3 * DEG, open: 74 * DEG, phase: cfg.spin + Math.PI / 3, delay: 0.06 }));
      // Estambres con anteras.
      for (let k = 0; k < 6; k++) {
        const g = new THREE.Group();
        g.rotation.set(32 * DEG, cfg.spin + (k * Math.PI) / 3 + 0.3, 0, "YXZ");
        const fil = new THREE.Mesh(THIN, solid("#d8e8a0"));
        fil.scale.set(0.012 * s, 0.55 * s, 0.012 * s);
        const anther = new THREE.Mesh(SPHERE, solid(cfg.center, 0.8));
        anther.scale.set(0.035 * s, 0.07 * s, 0.035 * s);
        anther.position.y = 0.56 * s;
        g.add(fil, anther);
        addExtra(g, 1);
      }
      break;
    }
    case "rose": {
      // Capas en espiral: las interiores casi cerradas, las exteriores abiertas.
      const layers = [3, 5, 6, Math.max(2, n - 14)];
      let k = 0;
      layers.forEach((count, L) => {
        const f = L / (layers.length - 1);
        const geo = petalGeometry({
          length: (0.34 + 0.3 * f) * s, width: (0.36 + 0.24 * f) * s, cup: 1.0 - 0.25 * f, curl: 0.14 * f,
          profile: "round", base, tip: f > 0.5 ? tip : base, nu: 10, nv: 8
        });
        petals.push(...ring(head, geo, {
          count, radius: 0.02 * s * L, closed: (2 + 6 * f) * DEG, open: (12 + 66 * f) * DEG,
          phase: cfg.spin + k * 2.39996, delay: (1 - f) * 0.25
        }));
        k += count;
      });
      break;
    }
    case "tulip": {
      const geo = petalGeometry({ length: 0.85 * s, width: 0.56 * s, cup: 1.15, curl: -0.04, profile: "cup", base, tip });
      petals.push(...ring(head, geo, { count: 3, closed: 3 * DEG, open: 26 * DEG, phase: cfg.spin }));
      petals.push(...ring(head, geo, { count: 3, radius: -0.01 * s, closed: 2 * DEG, open: 18 * DEG, phase: cfg.spin + Math.PI / 3, delay: 0.1 }));
      break;
    }
    case "dahlia": {
      const rings = [Math.round(n * 0.42), Math.round(n * 0.33), n - Math.round(n * 0.42) - Math.round(n * 0.33)];
      rings.forEach((count, L) => {
        const geo = petalGeometry({ length: (0.5 - 0.1 * L) * s, width: (0.17 - 0.02 * L) * s, cup: 0.8, curl: 0.06, profile: "pointed", base, tip });
        petals.push(...ring(head, geo, { count, closed: 4 * DEG, open: (86 - 22 * L) * DEG, phase: cfg.spin + L * 0.37, delay: L * 0.12 }));
      });
      const disc = new THREE.Mesh(SPHERE, solid(cfg.center, 0.8));
      disc.scale.set(0.09 * s, 0.06 * s, 0.09 * s);
      addExtra(disc, 1);
      break;
    }
    case "daisy": {
      const geo = petalGeometry({ length: 0.72 * s, width: 0.12 * s, cup: 0.25, curl: 0.06, profile: "long", base: tip, tip, nu: 10, nv: 4 });
      petals.push(...ring(head, geo, { count: n, radius: 0.1 * s, closed: 6 * DEG, open: 86 * DEG, phase: cfg.spin }));
      const disc = new THREE.Mesh(SPHERE, solid(cfg.center, 0.85));
      disc.scale.set(0.17 * s, 0.09 * s, 0.17 * s);
      addExtra(disc, 1);
      break;
    }
    case "anemone": {
      const geo = petalGeometry({ length: 0.56 * s, width: 0.52 * s, cup: 0.45, curl: 0.05, profile: "round", base, tip, ruffle: 0.4 });
      petals.push(...ring(head, geo, { count: n, closed: 5 * DEG, open: 74 * DEG, phase: cfg.spin }));
      const disc = new THREE.Mesh(SPHERE, solid(cfg.center, 0.9));
      disc.scale.set(0.12 * s, 0.09 * s, 0.12 * s);
      addExtra(disc, 1);
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2;
        const dot = new THREE.Mesh(SPHERE, solid("#2a2342", 0.9));
        dot.scale.setScalar(0.022 * s);
        dot.position.set(Math.cos(a) * 0.16 * s, 0.05 * s, Math.sin(a) * 0.16 * s);
        addExtra(dot, 1);
      }
      break;
    }
    case "cosmos": {
      const geo = petalGeometry({ length: 0.62 * s, width: 0.34 * s, cup: 0.18, curl: 0.04, profile: "notch", base, tip, notch: 0.12 });
      petals.push(...ring(head, geo, { count: n, closed: 5 * DEG, open: 84 * DEG, phase: cfg.spin }));
      const disc = new THREE.Mesh(SPHERE, solid(cfg.center, 0.85));
      disc.scale.set(0.1 * s, 0.07 * s, 0.1 * s);
      addExtra(disc, 1);
      break;
    }
    case "cluster": {
      // Ramillete de florecillas de cinco pétalos.
      const geo = petalGeometry({ length: 0.2 * s, width: 0.19 * s, cup: 0.3, profile: "round", base, tip, nu: 6, nv: 4 });
      const spots = [[0, 0.18, 0], [0.2, 0.06, 0.08], [-0.19, 0.05, 0.1], [0.06, 0.02, -0.2], [-0.08, 0.1, 0.2], [0.16, 0.12, -0.12]];
      spots.forEach(([x, y, z], k) => {
        const floret = new THREE.Group();
        floret.position.set(x * s, y * s, z * s);
        floret.rotation.set(z * 2.5, 0, -x * 2.5);
        head.add(floret);
        petals.push(...ring(floret, geo, { count: 5, closed: 6 * DEG, open: 80 * DEG, phase: cfg.spin + k, delay: k * 0.08 }));
        const eye = new THREE.Mesh(SPHERE, solid(cfg.center, 0.8));
        eye.scale.setScalar(0.035 * s);
        floret.add(eye);
        extras.push({ mesh: eye, scale: 1 });
      });
      break;
    }
  }

  // Cáliz verde bajo la flor.
  const sepal = new THREE.Mesh(SPHERE, MAT.sepal);
  sepal.scale.set(0.07 * s, 0.09 * s, 0.07 * s);
  sepal.position.y = -0.03 * s;
  head.add(sepal);
  for (const e of extras) e.base = e.mesh.scale.clone();
  return { head, petals, extras };
}

/**
 * @param cfg  definición de flowerDefs.js
 * @param slot {head: Vector3, dir: Vector3, curve: CatmullRomCurve3}
 */
export function createFlower(cfg, slot) {
  const root = new THREE.Group();
  root.name = cfg.id;
  const sway = new THREE.Group(); // oscilación ambiental desde la base
  root.add(sway);

  const stemGeo = stemGeometry(slot.curve, cfg.stemThickness);
  const stem = new THREE.Mesh(stemGeo, MAT.stem);
  sway.add(stem);

  // Hojas a lo largo del tallo.
  const leaves = [];
  for (let k = 0; k < cfg.leafCount; k++) {
    // Concentradas cerca de la atadura, como el follaje del video.
    const u = 0.08 + (k / Math.max(1, cfg.leafCount)) * 0.3 + ((cfg.phase * 13 + k * 0.17) % 0.07);
    const geo = leafGeometry({
      // Hojas largas y estrechas, como el follaje de la base del video.
      length: 0.95 + 0.4 * (((k + cfg.day) % 3) / 2),
      width: 0.13, shape: "lanceolate"
    });
    const holder = new THREE.Group();
    holder.position.copy(slot.curve.getPointAt(u));
    const tangent = slot.curve.getTangentAt(u);
    holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    const twist = new THREE.Group();
    twist.rotation.y = cfg.leafTwist + k * 2.3;
    const leaf = new THREE.Mesh(geo, MAT.leaf);
    leaf.rotation.x = (24 + 14 * (k % 2)) * DEG;
    twist.add(leaf);
    holder.add(twist);
    sway.add(holder);
    leaves.push({ mesh: leaf, u, holder });
  }

  const { head, petals, extras } = buildHead(cfg);
  const headHolder = new THREE.Group();
  headHolder.add(head);
  head.rotation.y = cfg.spin;
  head.rotation.z = cfg.tilt;
  sway.add(headHolder);

  const UP = new THREE.Vector3(0, 1, 0);
  const qFinal = new THREE.Quaternion().setFromUnitVectors(UP, slot.dir);
  const qTmp = new THREE.Quaternion();
  const tTmp = new THREE.Vector3();
  const segIdx = stemGeo.userData.segmentIndices;
  const tubular = stemGeo.userData.tubular;

  let current = -1;

  function setGrowth(p) {
    if (p === current) return;
    current = p;
    root.visible = p > 0;
    const stemP = easeOut(p / 0.45);
    stemGeo.setDrawRange(0, Math.max(0, Math.ceil(stemP * tubular)) * segIdx);

    // La cabeza sigue la punta del tallo y se orienta con él hasta su dirección final.
    const tp = Math.max(0.001, stemP);
    headHolder.position.copy(slot.curve.getPointAt(tp));
    tTmp.copy(slot.curve.getTangentAt(tp));
    qTmp.setFromUnitVectors(UP, tTmp);
    headHolder.quaternion.copy(qTmp).slerp(qFinal, smooth((p - 0.3) / 0.4));

    const bud = smooth((p - 0.3) / 0.25);
    headHolder.scale.setScalar(Math.max(0.0001, bud));

    for (const lf of leaves) {
      const a = smooth((stemP - lf.u) / 0.25);
      lf.holder.visible = a > 0.001;
      lf.mesh.scale.setScalar(Math.max(0.0001, a));
      lf.mesh.rotation.z = (1 - a) * 0.6;
    }

    const openStart = 0.55;
    for (const pt of petals) {
      const o = easeOut((p - openStart - pt.delay * 0.3) / (1 - openStart - 0.08));
      pt.mesh.rotation.x = pt.closed + (pt.open - pt.closed) * o;
      pt.mesh.scale.setScalar(0.6 + 0.4 * o);
    }
    const ex = smooth((p - 0.75) / 0.25);
    for (const e of extras) {
      e.mesh.visible = ex > 0.001;
      e.mesh.scale.copy(e.base).multiplyScalar(Math.max(0.0001, ex));
    }
  }

  function swayAt(t, amount = 1) {
    sway.rotation.z = Math.sin(t * 0.45 + cfg.phase) * 0.006 * amount;
    sway.rotation.x = Math.sin(t * 0.37 + cfg.phase * 1.7) * 0.004 * amount;
  }

  function dispose() {
    stemGeo.dispose();
    root.traverse((o) => {
      if (o.isMesh && o.geometry !== SPHERE && o.geometry !== THIN) o.geometry.dispose();
    });
  }

  setGrowth(0);
  return { cfg, root, setGrowth, swayAt, dispose, get growth() { return current; } };
}
