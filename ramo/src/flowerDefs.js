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

// [color base (garganta), color de la punta]. Los tonos de los lirios del video:
// rojos, rosas y magentas, blancos y cremas, amarillos, duraznos y vinos.
export const PALETTE = {
  red: ["#8a0b12", "#ef2b2b"], scarlet: ["#9c1408", "#ff4a2e"], crimson: ["#6e0418", "#d81b3c"],
  cherry: ["#7d0a2a", "#e0334f"], ruby: ["#5a0610", "#b8142a"],
  magenta: ["#8c0f5e", "#e64fb0"], orchid: ["#9a2f86", "#f08ad6"], rose: ["#b3264f", "#f47a9b"],
  pink: ["#c24a78", "#ffa3c4"], fuchsia: ["#a0105a", "#ff5aa8"], blush: ["#d98aa0", "#fde1ea"],
  white: ["#d9d0c0", "#fffdf8"], cream: ["#d9c48f", "#fff4d6"], ivory: ["#cbbfa4", "#fffaf0"],
  pearl: ["#d6c9cf", "#fff7fb"], linen: ["#c9b49a", "#fff0e0"],
  yellow: ["#c98a06", "#ffe04a"], butter: ["#d9a514", "#fff08a"], gold: ["#b8620a", "#ffbe2e"],
  lemon: ["#b9a10c", "#fff36a"], amber: ["#b45309", "#ffb347"],
  peach: ["#d9764f", "#ffd0b0"], salmon: ["#c9514f", "#ffaa98"], apricot: ["#c96a24", "#ffc38c"],
  coral: ["#cc3f35", "#ff9178"], tangerine: ["#c2410c", "#ff8f4a"],
  wine: ["#4d0617", "#9e1a35"], burgundy: ["#3f0a18", "#8a1c3a"], mauve: ["#7a4a5a", "#d9a8b8"]
};

// Como en el video, todas son lirios: cada uno con su color, tamaño y giro.
// Orden pensado para la composición: las primeras (centro del ramo) son las más grandes
// y los colores se alternan para que no se junten dos tonos parecidos.
const ORDER = ["red", "white", "magenta", "yellow", "peach", "crimson", "cream", "pink", "gold", "wine",
  "ivory", "scarlet", "orchid", "salmon", "butter", "rose", "linen", "cherry", "apricot", "blush",
  "lemon", "burgundy", "pearl", "coral", "fuchsia", "amber", "mauve", "tangerine", "ruby"];
const PLAN = ORDER.map((c) => ["lily", c]);

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
    phase: r() * Math.PI * 2,
    // Los capullos se abren uno tras otro, como en el video.
    bloomDelay: r() * 0.14
  };
});
