// Carga de fuentes Noto: solo los glifos que aparecen en las traducciones
// (parámetro `text=` de Google Fonts, que entrega subconjuntos mínimos).

const FAMILIES = [
  "Noto Sans", // latino, cirílico, griego
  "Noto Sans Arabic",
  "Noto Sans Hebrew",
  "Noto Sans Devanagari",
  "Noto Sans Bengali",
  "Noto Sans Gurmukhi",
  "Noto Sans Gujarati",
  "Noto Sans Oriya",
  "Noto Sans Tamil",
  "Noto Sans Telugu",
  "Noto Sans Kannada",
  "Noto Sans Malayalam",
  "Noto Sans Sinhala",
  "Noto Serif Tibetan",
  "Noto Sans Thai",
  "Noto Sans Lao",
  "Noto Sans Khmer",
  "Noto Sans Myanmar",
  "Noto Sans Georgian",
  "Noto Sans Armenian",
  "Noto Sans Ethiopic",
  "Noto Sans JP",
  "Noto Sans KR",
  "Noto Sans SC",
  "Noto Sans TC"
];

export const FONT_WEIGHT = 600;
export const FONT_STACK = FAMILIES.map((f) => `"${f}"`).join(", ") + ", system-ui, sans-serif";

export function fontString(size) {
  return `${FONT_WEIGHT} ${size}px ${FONT_STACK}`;
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

export async function loadFonts(texts, timeoutMs = 8000) {
  const chars = [...new Set([...texts.join("")])].join("");
  const encoded = encodeURIComponent(chars);

  // Una hoja por familia: si una falla, el resto sigue funcionando.
  const sheets = FAMILIES.map(
    (family) =>
      new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}` +
          `:wght@${FONT_WEIGHT}&text=${encoded}&display=block`;
        link.onload = link.onerror = resolve;
        document.head.appendChild(link);
      })
  );
  await withTimeout(Promise.all(sheets), timeoutMs);

  // Fuerza la descarga real de cada cara antes de medir texto.
  await withTimeout(
    Promise.all(
      FAMILIES.map((f) => document.fonts.load(`${FONT_WEIGHT} 16px "${f}"`, chars).catch(() => null))
    ),
    timeoutMs
  );
  await document.fonts.ready;

  return FAMILIES.filter((f) => document.fonts.check(`${FONT_WEIGHT} 16px "${f}"`));
}
