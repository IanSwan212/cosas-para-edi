// Geometría procedural: pétalos, hojas y tallos como superficies curvadas reales.
import * as THREE from "three";

const tmp = new THREE.Color();
const tmp2 = new THREE.Color();

// Perfiles de ancho a lo largo del pétalo (u = 0 base, 1 punta).
const PROFILES = {
  pointed: (u) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.85),       // lirio, dalia
  round: (u) => Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.pow(u, 1.35))), 0.55), // rosa, anémona
  long: (u) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.6)), 0.7) * (1 - 0.25 * u), // margarita
  cup: (u) => Math.pow(Math.sin(Math.PI * Math.min(0.995, Math.pow(u, 1.6))), 0.45), // tulipán
  notch: (u) => Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.pow(u, 1.25))), 0.5) // cosmos
};

/**
 * Pétalo en su marco local: crece hacia +Y, la cara interior mira a −Z.
 * cup: curvatura transversal (bordes hacia dentro); curl: la punta se dobla hacia fuera (+Z).
 */
export function petalGeometry({ length = 1, width = 0.4, cup = 0.4, curl = 0, profile = "pointed",
  base = "#ff0000", tip = "#ffffff", nu = 14, nv = 8, notch = 0, ruffle = 0 }) {
  const prof = PROFILES[profile];
  const pos = [], col = [], idx = [];
  const cBase = new THREE.Color(base), cTip = new THREE.Color(tip);
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const w = width * prof(u);
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      let y = length * u;
      if (notch) y -= notch * length * Math.pow(u, 6) * (1 - v * v); // muesca en la punta
      const x = v * w * 0.5;
      const z = -cup * w * 0.5 * v * v + curl * length * u * u
        + ruffle * w * 0.08 * Math.sin(v * 9 + u * 5) * u;            // borde ondulado
      pos.push(x, y, z);
      // Degradado base→punta, con el nervio central un poco más oscuro (volumen).
      tmp.copy(cBase).lerp(cTip, Math.pow(u, 0.8));
      tmp.multiplyScalar(0.86 + 0.14 * Math.abs(v));
      col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j, b = a + nv + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function leafGeometry({ length = 0.6, width = 0.18, shape = "lanceolate", fold = 0.35 }) {
  const dark = shape === "oval" ? "#1f5a24" : "#24692b";
  const light = shape === "oval" ? "#5fa44a" : "#6dbb52";
  const g = petalGeometry({
    length, width, cup: fold, curl: 0.18, profile: shape === "oval" ? "round" : "pointed",
    base: dark, tip: light, nu: 10, nv: 6
  });
  // Nervio central más claro.
  const colors = g.getAttribute("color");
  for (let i = 0; i < colors.count; i++) {
    const j = i % 7;
    if (j === 3) {
      tmp2.fromBufferAttribute(colors, i).lerp(tmp.set("#a9d98a"), 0.45);
      colors.setXYZ(i, tmp2.r, tmp2.g, tmp2.b);
    }
  }
  return g;
}

/** Tallo como tubo a lo largo de una curva; su crecimiento se anima con drawRange. */
export function stemGeometry(curve, radius) {
  const tubular = 48, radial = 6;
  const g = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  // Afinar hacia la flor.
  const p = g.getAttribute("position");
  const n = g.getAttribute("normal");
  for (let j = 0; j <= tubular; j++) {
    const t = j / tubular;
    const k = 1 - 0.45 * t;
    const c = curve.getPointAt(t);
    for (let i = 0; i <= radial; i++) {
      const id = j * (radial + 1) + i;
      p.setXYZ(id, c.x + (p.getX(id) - c.x) * k, c.y + (p.getY(id) - c.y) * k, c.z + (p.getZ(id) - c.z) * k);
    }
  }
  p.needsUpdate = true;
  n.needsUpdate = true;
  g.userData.segmentIndices = radial * 6; // índices por segmento a lo largo
  g.userData.tubular = tubular;
  return g;
}
