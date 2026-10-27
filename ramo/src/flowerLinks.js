// Flores con enlace: al pasar el cursor (o tocar, en pantallas táctiles) se
// muestra una tarjeta con la vista previa del sitio. Con ratón, un clic sobre
// la flor lo abre; en táctil, el botón «Abrir» de la tarjeta. Un arrastre
// (girar el ramo) no cuenta como clic.
import * as THREE from "three";
import { LINKS } from "./links.js?v=mvq7uqvw";
import { dateForFlower, formatDate } from "./calendar.js?v=mvq7uqvw";

export function setupFlowerLinks({ canvas, camera, group, label: card }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const img = card.querySelector(".flower-card-img");
  const title = card.querySelector(".flower-card-title");
  const date = card.querySelector(".flower-card-date");
  const open = card.querySelector(".flower-card-open");
  let down = null;
  let shownDay = 0;

  // Precarga de las imágenes de vista previa.
  for (const link of Object.values(LINKS)) if (link.preview) new Image().src = link.preview;

  function flowerAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(group.children, true)) {
      let o = hit.object;
      while (o && !/^flor-\d+$/.test(o.name)) o = o.parent;
      if (!o || !o.visible) continue;
      const day = +o.name.slice(5);
      return LINKS[day] ? { day, link: LINKS[day] } : null;
    }
    return null;
  }

  function show(hit, x, y, touch) {
    if (!hit) {
      card.hidden = true;
      shownDay = 0;
      canvas.style.cursor = "";
      return;
    }
    if (shownDay !== hit.day) {
      img.hidden = !hit.link.preview;
      if (hit.link.preview) img.src = hit.link.preview;
      title.textContent = hit.link.title;
      date.textContent = `Flor del ${formatDate(dateForFlower(hit.day))}`;
      open.href = hit.link.url;
      shownDay = hit.day;
    }
    card.classList.toggle("touch", touch);
    card.hidden = false;
    // Cerca del punto, sin salirse de la pantalla.
    const w = card.offsetWidth, h = card.offsetHeight;
    const left = Math.max(10, Math.min(window.innerWidth - w - 10, x + 16));
    const top = Math.max(10, Math.min(window.innerHeight - h - 10, y - h - 16 < 10 ? y + 16 : y - h - 16));
    card.style.transform = `translate(${left}px, ${top}px)`;
    canvas.style.cursor = touch ? "" : "pointer";
  }

  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" && e.buttons === 0) show(flowerAt(e.clientX, e.clientY), e.clientX, e.clientY, false);
  });
  canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") show(null); });
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; // fue un arrastre
    const hit = flowerAt(e.clientX, e.clientY);
    if (e.pointerType === "mouse") {
      if (hit) location.href = hit.link.url;
    } else {
      // Táctil: el primer toque muestra la vista previa; «Abrir» lleva al sitio.
      show(hit, e.clientX, e.clientY, true);
    }
  });
}
