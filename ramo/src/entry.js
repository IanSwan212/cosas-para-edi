// Punto de entrada: el ramo necesita WebGL. Si no está disponible, se explica
// en pantalla en lugar de dejar la página en negro.
const probe = document.createElement("canvas");
if (probe.getContext("webgl2") || probe.getContext("webgl")) {
  await import("./main.js?v=mvq5mb5z");
} else {
  const p = document.getElementById("progress");
  p.dataset.fixed = "1";
  p.textContent = "Tu navegador tiene desactivado WebGL. Activa la «aceleración por hardware» en la configuración de Chrome y recarga.";
}
