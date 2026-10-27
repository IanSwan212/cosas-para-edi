// Textos del ramo y panel del modo de prueba.
import { START, END, TOTAL_FLOWERS, formatDate, addDays, daysFromCivil, toISO } from "./calendar.js";

const $ = (id) => document.getElementById(id);

export function renderText({ date, count, simulated }) {
  const progress = $("progress");
  if (count === 0) {
    $("headline").textContent = "Un día más, una flor más.";
    progress.textContent = `El ramo empieza a florecer el ${formatDate(START)}.`;
  } else {
    $("headline").textContent = "Un día más, una flor más.";
    progress.textContent = `${count} de ${TOTAL_FLOWERS} flores · ${formatDate(date)}`;
  }
  $("sim-badge").hidden = !simulated;
  document.body.classList.toggle("simulated", !!simulated);
}

export function showFinal(visible) {
  $("final").classList.toggle("visible", visible);
}

/**
 * Panel de simulación. No toca la fecha real ni el almacenamiento: solo
 * notifica la fecha elegida (o null al salir).
 */
export function setupTestPanel({ onChange, onReplay, initial }) {
  const panel = $("test-panel");
  const toggle = $("test-toggle");
  const range = $("test-range");
  const label = $("test-label");
  const first = addDays(START, -1);
  const span = daysFromCivil(END) - daysFromCivil(first) + 1; // 25 oct … 24 nov
  range.min = "0";
  range.max = String(span);

  const dateAt = (v) => addDays(first, +v);
  const sync = () => { label.textContent = formatDate(dateAt(range.value)); };

  const open = (date) => {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    const v = date ? daysFromCivil(date) - daysFromCivil(first) : 1;
    range.value = String(Math.max(0, Math.min(span, v)));
    sync();
    onChange(dateAt(range.value));
  };
  const close = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    onChange(null);
  };

  toggle.addEventListener("click", () => (panel.hidden ? open(null) : close()));
  $("test-exit").addEventListener("click", close);
  $("test-replay").addEventListener("click", () => onReplay());
  range.addEventListener("input", () => { sync(); onChange(dateAt(range.value)); });
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey && e.target === document.body) {
      panel.hidden ? open(null) : close();
    }
  });

  if (initial) open(initial);
  return { isOpen: () => !panel.hidden, iso: () => toISO(dateAt(range.value)) };
}
