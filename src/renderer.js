// Renderizado Canvas 2D con capa fuera de pantalla.
// Las palabras se dibujan en `layer`; el canvas visible compone esa capa con un
// resplandor (sombra del bitmap completo, una sola operación por fotograma) y
// aplica la escala del latido. Cuando todo está asentado, la capa ya no se
// vuelve a dibujar: solo se recompone.

import { fontString } from "./fontManager.js?v=mvrlbbgq";

const smoothBump = (x, start, dur) => {
  if (x < start || x > start + dur) return 0;
  const s = Math.sin((Math.PI * (x - start)) / dur);
  return s * s;
};

export class Renderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.layer = document.createElement("canvas");
    this.lctx = this.layer.getContext("2d");
    this.config = config;
    this.particles = [];
    this.final = null;
    this.layerSettled = false;
    this.settledAt = Infinity;
    this.glowEnabled = config.glowIntensity > 0;
    this.slowFrames = 0;
    this.hovered = null;
    this.beatScale = 1;
  }

  resize(width, height) {
    // Limita la densidad en pantallas muy grandes para proteger el rendimiento.
    const maxPixels = 3840 * 2400;
    let dpr = window.devicePixelRatio || 1;
    if (width * height * dpr * dpr > maxPixels) dpr = Math.sqrt(maxPixels / (width * height));
    this.dpr = dpr;
    this.width = width;
    this.height = height;
    for (const c of [this.canvas, this.layer]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    }
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.layerSettled = false;
  }

  setScene({ particles, final, mask, timeline, baseSize }) {
    this.particles = particles;
    this.final = final;
    this.mask = mask;
    this.timeline = timeline;
    this.baseSize = baseSize;
    this.settledAt = Math.max(
      ...particles.map((p) => p.delay + p.duration),
      timeline.finalStart + timeline.finalDuration
    );
    this.layerSettled = false;
    this.glow = this.config.glowIntensity * Math.max(0.7, Math.min(1.6, baseSize / 11));
  }

  heartbeatAt(time) {
    if (!this.config.heartbeatEnabled || this.reducedMotion) return 1;
    const x = (time - this.timeline.beatStart) / 1000;
    const amp = this.config.heartbeatScale - 1;
    // Doble pulsación «lub-dub»: el segundo latido es más débil.
    return 1 + amp * (smoothBump(x, 0, 0.34) + 0.55 * smoothBump(x, 0.4, 0.46));
  }

  drawLayer(time) {
    const c = this.lctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    for (const p of this.particles) {
      p.update(time);
      p.render(c);
    }
    this.drawFinal(c, time, 1);
    c.globalAlpha = 1;
  }

  drawFinal(c, time, alpha) {
    const f = this.final;
    const T = this.timeline;
    const k = Math.min(1, Math.max(0, (time - T.finalStart) / T.finalDuration));
    if (k <= 0) return;
    const e = k * k * (3 - 2 * k);
    c.globalAlpha = e * alpha;
    c.direction = "ltr";
    c.textAlign = "center";
    c.font = fontString(f.size);
    if ("letterSpacing" in c) c.letterSpacing = `${(f.size * 0.12).toFixed(1)}px`;
    c.fillStyle = "#ff4d6a";
    c.fillText(f.text, f.x, f.baseline + (1 - e) * 3);
    if ("letterSpacing" in c) c.letterSpacing = "0px";
  }

  /* ---------- Modo mensaje: el texto se infla dentro del corazón ---------- */

  setMessage({ tokens, size, caption, lang, dir = "ltr" }) {
    if (!this.msgLayer) {
      this.msgLayer = document.createElement("canvas");
      this.mctx = this.msgLayer.getContext("2d");
    }
    this.msgLayer.width = this.layer.width;
    this.msgLayer.height = this.layer.height;
    const cx = this.mask.cx, cy = this.mask.cy - 1.5 * this.mask.scale;
    let maxD = 1;
    for (const t of tokens) {
      t.cx = t.x + t.w / 2;
      t.d = Math.hypot(t.cx - cx, t.cy - cy);
      maxD = Math.max(maxD, t.d);
    }
    for (const t of tokens) t.delay = (t.d / maxD) * 750;
    this.msg = {
      tokens, size, caption, lang, dir,
      font: fontString(size),
      start: performance.now(),
      state: "in",
      settled: false
    };
  }

  clearMessage() {
    if (this.msg && this.msg.state !== "out") {
      this.msg.state = "out";
      this.msg.outStart = performance.now();
      this.msg.settled = false;
    }
  }

  get messageActive() {
    return !!this.msg && this.msg.state !== "out";
  }

  /** ¿Hace falta seguir pidiendo fotogramas para la animación del mensaje? */
  get messageAnimating() {
    return !!this.msg && !this.msg.settled;
  }

  /** Presencia del modo mensaje (0..1) y escala de «inflado». */
  messageState(now) {
    const m = this.msg;
    if (!m) return { k: 0, inflate: 1 };
    const t = now - m.start;
    if (m.state === "out") {
      const o = Math.min(1, (now - m.outStart) / 480);
      if (o >= 1) { this.msg = null; return { k: 0, inflate: 1 }; }
      const e = o * o * (3 - 2 * o);
      return { k: 1 - e, inflate: 1 - 0.025 * Math.sin(Math.PI * o), out: e };
    }
    // Resorte amortiguado: crece, rebota y se asienta.
    const inflate = 1 + 0.06 * Math.exp(-t / 420) * Math.sin((t / 1000) * Math.PI * 2 * 1.35);
    if (t > 2200) m.settled = true;
    return { k: Math.min(1, t / 500), inflate: m.settled ? 1 : inflate, t };
  }

  drawMessage(now, st) {
    const m = this.msg;
    const c = this.mctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    c.font = m.font;
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.direction = m.dir;
    const cx = this.mask.cx, cy = this.mask.cy - 1.5 * this.mask.scale;
    const backOut = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
    for (const tk of m.tokens) {
      let p, alpha;
      if (st.out !== undefined) {
        p = 1 - 0.75 * st.out;
        alpha = 1 - st.out;
      } else {
        const q = Math.min(1, Math.max(0, (st.t - tk.delay) / 650));
        if (q <= 0) continue;
        p = 0.2 + 0.8 * backOut(q);
        alpha = Math.min(1, q * 1.8);
      }
      c.globalAlpha = alpha;
      c.fillStyle = tk.kind === "chorus" ? "#ff3d5e" : tk.kind === "sep" ? "rgba(255,23,68,0.55)" : "#ffc2cc";
      const dx = (cx + (tk.cx - cx) * p) - tk.cx;
      const dy = (cy + (tk.cy - cy) * p) - tk.cy;
      c.fillText(tk.text, tk.x + dx, tk.baseline + dy);
    }
    // Rótulo del idioma bajo la punta del corazón
    if (m.caption) {
      c.globalAlpha = st.k * 0.75;
      c.textAlign = "center";
      c.font = fontString(Math.max(11, Math.min(14, m.size)));
      c.fillStyle = "#ff8a9d";
      const y = Math.min(this.height - 12, this.mask.bottom + 26);
      c.fillText(m.caption, this.mask.cx, y);
    }
    c.globalAlpha = 1;
  }

  render(time, dt) {
    if (!this.mask || !this.layer.width || !this.layer.height) return;
    // Degradación automática: si los fotogramas son lentos, se quita el resplandor.
    if (dt > 30) this.slowFrames++;
    else if (dt > 0) this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 20) this.glowEnabled = false;

    const settled = time >= this.settledAt;
    if (!settled || !this.layerSettled) {
      this.drawLayer(time);
      this.layerSettled = settled;
    }

    const ctx = this.ctx;
    const now = performance.now();
    const st = this.messageState(now);
    const s = (this.beatScale = this.heartbeatAt(time) * st.inflate);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    const cx = this.mask.cx, cy = this.mask.cy - 1.5 * this.mask.scale;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
    // En modo mensaje, las traducciones se atenúan y dejan sitio al texto.
    const layerAlpha = 1 - 0.86 * st.k;
    if (this.glowEnabled) {
      // La sombra del bitmap actúa como un halo suave; un pulso de brillo acompaña al latido.
      ctx.shadowColor = this.config.primaryColor;
      ctx.shadowBlur = this.glow * this.dpr * (1 + (s - 1) * 12);
      ctx.globalAlpha = 0.55 * layerAlpha;
      ctx.drawImage(this.layer, 0, 0, this.width, this.height);
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    }
    ctx.globalAlpha = layerAlpha;
    ctx.drawImage(this.layer, 0, 0, this.width, this.height);
    ctx.globalAlpha = 1;

    if (this.msg) {
      // drawMessage puede vaciar this.msg al terminar la salida: se comprueba antes de cachear.
      if (!this.msg.cached) this.drawMessage(now, st);
      if (this.msg) this.msg.cached = this.msg.settled;
      if (this.glowEnabled) {
        ctx.shadowColor = this.config.primaryColor;
        ctx.shadowBlur = this.glow * this.dpr;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(this.msgLayer, 0, 0, this.width, this.height);
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(this.msgLayer, 0, 0, this.width, this.height);
      // «TE AMO» conserva su brillo completo.
      this.drawFinal(ctx, time, st.k * 0.86);
      ctx.globalAlpha = 1;
    }

    if (this.hovered && !this.msg) {
      const p = this.hovered;
      ctx.font = p.font;
      ctx.direction = p.direction;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = this.config.primaryColor;
      ctx.shadowBlur = 8 * this.dpr;
      ctx.fillStyle = "#ff8a9d";
      ctx.fillText(p.text, p.targetX, p.targetY);
    }
    ctx.restore();
  }

  /** Convierte coordenadas de pantalla al espacio del layout (deshace el latido). */
  toLayout(x, y) {
    const cx = this.mask.cx, cy = this.mask.cy - 1.5 * this.mask.scale;
    return { x: cx + (x - cx) / this.beatScale, y: cy + (y - cy) / this.beatScale };
  }
}
