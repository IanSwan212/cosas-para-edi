// Textos del ramo.
import { START, TOTAL_FLOWERS, formatDate } from "./calendar.js?v=mvq7uqvw";

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
