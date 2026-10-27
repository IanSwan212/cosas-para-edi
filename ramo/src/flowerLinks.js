// Clic o toque sobre una flor abierta: abre su enlace. Un arrastre (girar el
// ramo) no cuenta como clic.
import * as THREE from "three";
import { LINKS } from "./links.js?v=mvq5qzhd";
import { dateForFlower, formatDate } from "./calendar.js?v=mvq5qzhd";

export function setupFlowerLinks({ canvas, camera, group, label }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;

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

  function showLabel(hit, x, y) {
    if (!hit) {
      label.hidden = true;
      canvas.style.cursor = "";
      return;
    }
    label.textContent = `${hit.link.title} · ${formatDate(dateForFlower(hit.day))}`;
    label.hidden = false;
    label.style.transform = `translate(${Math.min(window.innerWidth - label.offsetWidth - 12, x + 14)}px, ${y - 34}px)`;
    canvas.style.cursor = "pointer";
  }

  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" && e.buttons === 0) showLabel(flowerAt(e.clientX, e.clientY), e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerleave", () => showLabel(null));
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; // fue un arrastre
    const hit = flowerAt(e.clientX, e.clientY);
    if (hit) location.href = hit.link.url;
  });
}
