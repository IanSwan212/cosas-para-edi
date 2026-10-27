// Definición determinista de las 29 flores (una por día).
// Especie y color están elegidos a mano para que el ramo sea variado y
// armonioso; los detalles finos salen de un PRNG con semilla fija por flor,
// así que nada cambia entre recargas.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// [color base (cerca del centro), color de la punta]
export const PALETTE = {
  crimson: ["#7a0619", "#e2213f"],
  rose: ["#b3264f", "#f47a9b"],
  blush: ["#e7a3b4", "#fde3ea"],
  white: ["#e9e1d3", "#fffdf8"],
  butter: ["#e0a412", "#ffe27a"],
  gold: ["#c46a05", "#ffb52e"],
  coral: ["#d9483b", "#ff9a7d"],
  peach: ["#e8875f", "#ffd2b3"],
  violet: ["#4b1d73", "#9d5bd2"],
  lavender: ["#8a77c9", "#d9cdf7"],
  sky: ["#2f5fb3", "#8fb8ff"],
  magenta: ["#8c0f5e", "#e04aa6"],
  cream: ["#e9d6a4", "#fff6dc"],
  wine: ["#4d0617", "#a3152f"]
};

// Orden pensado para la composición: las primeras flores (centro) son grandes.
const PLAN = [
  ["lily", "crimson"], ["rose", "blush"], ["lily", "white"], ["tulip", "coral"], ["dahlia", "magenta"],
  ["lily", "butter"], ["rose", "crimson"], ["anemone", "white"], ["daisy", "white"], ["lily", "rose"],
  ["cosmos", "lavender"], ["tulip", "butter"], ["cluster", "sky"], ["rose", "peach"], ["dahlia", "gold"],
  ["anemone", "violet"], ["lily", "peach"], ["daisy", "blush"], ["cosmos", "magenta"], ["tulip", "wine"],
  ["cluster", "lavender"], ["rose", "cream"], ["lily", "coral"], ["daisy", "butter"], ["anemone", "sky"],
  ["dahlia", "blush"], ["cluster", "white"], ["tulip", "violet"], ["rose", "rose"]
];

const CENTER = {
  lily: "#5a2a08", rose: null, tulip: "#1c1208", dahlia: "#f2c14e", daisy: "#f2b705",
  anemone: "#15102b", cosmos: "#f5c518", cluster: "#ffe066"
};

const PETALS = {
  lily: [6, 6], rose: [16, 22], tulip: [6, 6], dahlia: [26, 34], daisy: [18, 24],
  anemone: [6, 7], cosmos: [8, 8], cluster: [5, 5]
};

export const FLOWERS = PLAN.map(([species, colorName], i) => {
  const r = rng(1000 + i * 7919);
  const [lo, hi] = PETALS[species];
  const big = species === "lily" || species === "rose" || species === "dahlia";
  return {
    id: `flor-${String(i + 1).padStart(2, "0")}`,
    day: i + 1,
    species,
    colorName,
    colors: PALETTE[colorName],
    center: CENTER[species],
    petalCount: lo + Math.floor(r() * (hi - lo + 1)),
    // Las primeras flores (centro del ramo) son un poco más grandes.
    size: (big ? 0.92 : 0.76) * (1.1 - 0.25 * (i / 28)) * (0.92 + r() * 0.16),
    stemThickness: 0.022 + r() * 0.01,
    leafCount: 2 + Math.floor(r() * 3),
    leafShape: r() < 0.5 ? "lanceolate" : "oval",
    leafTwist: r() * Math.PI * 2,
    tilt: (r() - 0.5) * 0.35,
    spin: r() * Math.PI * 2,
    phase: r() * Math.PI * 2
  };
});
