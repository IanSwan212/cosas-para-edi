// Hover/toque sobre palabras y controles que se ocultan solos.

export function setupWordInteraction({ canvas, tooltip, renderer, getHash, isEnabled, onSelect }) {
  const onFinal = (pt) => {
    const b = renderer.final?.box;
    return b && pt.x >= b.x0 && pt.x <= b.x1 && pt.y >= b.y0 && pt.y <= b.y1;
  };

  // Clic o toque: sobre una palabra muestra su mensaje; sobre «TE AMO», el original.
  // Con un mensaje visible, cualquier clic lo «desinfla».
  canvas.addEventListener("click", (e) => {
    if (!isEnabled()) return;
    if (renderer.messageActive) return onSelect?.(undefined);
    const rect = canvas.getBoundingClientRect();
    const pt = renderer.toLayout(e.clientX - rect.left, e.clientY - rect.top);
    if (onFinal(pt)) return onSelect?.(null);
    const p = getHash()?.query(pt.x, pt.y);
    if (p) onSelect?.(p.language);
  });

  let hideTimer = 0;
  let rafPending = false;
  let lastEvent = null;

  const show = (p, clientX, clientY) => {
    tooltip.textContent = `${p.language.language} · ${p.language.nativeName}`;
    tooltip.lang = "";
    tooltip.hidden = false;
    const pad = 12;
    const w = tooltip.offsetWidth;
    const h = tooltip.offsetHeight;
    const x = Math.min(window.innerWidth - w - pad, Math.max(pad, clientX - w / 2));
    const y = clientY - h - 14 < pad ? clientY + 18 : clientY - h - 14;
    tooltip.style.transform = `translate(${x}px, ${y}px)`;
  };

  const hide = () => {
    tooltip.hidden = true;
    renderer.hovered = null;
  };

  const handle = () => {
    rafPending = false;
    const e = lastEvent;
    if (!isEnabled() || renderer.messageActive) {
      canvas.style.cursor = renderer.messageActive ? "pointer" : "";
      return hide();
    }
    const rect = canvas.getBoundingClientRect();
    const pt = renderer.toLayout(e.clientX - rect.left, e.clientY - rect.top);
    if (onFinal(pt)) {
      hide();
      canvas.style.cursor = "pointer";
      return;
    }
    const p = getHash()?.query(pt.x, pt.y);
    renderer.hovered = p;
    if (p) {
      show(p, e.clientX, e.clientY);
      canvas.style.cursor = "pointer";
      clearTimeout(hideTimer);
      if (e.pointerType === "touch") hideTimer = setTimeout(hide, 2600);
    } else if (e.pointerType !== "touch") {
      canvas.style.cursor = "";
      hide();
    }
  };

  const onPointer = (e) => {
    lastEvent = e;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(handle);
    }
  };
  canvas.addEventListener("pointermove", (e) => e.pointerType !== "touch" && onPointer(e));
  canvas.addEventListener("pointerdown", (e) => e.pointerType === "touch" && onPointer(e));
  canvas.addEventListener("pointerleave", (e) => e.pointerType !== "touch" && hide());
  return { hide };
}

export function setupAutoHide(element, delay = 2800) {
  let timer = 0;
  const reveal = () => {
    element.classList.add("visible");
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!element.matches(":hover") && !element.contains(document.activeElement)) element.classList.remove("visible");
      else reveal();
    }, delay);
  };
  window.addEventListener("pointermove", reveal, { passive: true });
  window.addEventListener("pointerdown", reveal, { passive: true });
  window.addEventListener("keydown", reveal);
  element.addEventListener("focusin", reveal);
  return { reveal };
}
