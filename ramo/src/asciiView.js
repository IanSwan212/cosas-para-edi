// Vista ASCII, como el «ASCII Lily Bouquet» del video de referencia.
// La escena 3D se renderiza a una textura con un píxel por celda; un shader
// dibuja en cada celda un carácter elegido por luminosidad (a partir de un
// atlas de glifos) y coloreado con el color de ese píxel. Todo en la GPU.
import * as THREE from "three";

const RAMP = " .,:;i!lI?tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

function glyphAtlas() {
  const w = 24, h = 36;
  const c = document.createElement("canvas");
  c.width = w * RAMP.length;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#fff";
  g.font = `700 ${h * 0.92}px "Courier New", ui-monospace, monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 0; i < RAMP.length; i++) g.fillText(RAMP[i], i * w + w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

const VERT = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tGlyphs;
  uniform vec2 cell;     // tamaño de celda en píxeles del framebuffer
  uniform vec2 grid;     // columnas, filas
  uniform float glyphs;
  void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 c = floor(frag / cell);
    // La textura intermedia guarda color lineal: se pasa a sRGB.
    vec3 col = pow(texture2D(tScene, (c + 0.5) / grid).rgb, vec3(1.0 / 2.2));
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec2 local = fract(frag / cell);
    if (lum < 0.045) {
      // Puntitos de fondo tenues, fijos, como en el video.
      float h = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
      float star = h > 0.9978 ? smoothstep(0.3, 0.05, length(local - 0.5)) * 0.5 : 0.0;
      gl_FragColor = vec4(vec3(star), 1.0);
      return;
    }
    float idx = clamp(floor(pow(lum, 0.8) * 1.15 * (glyphs - 1.0)), 1.0, glyphs - 1.0);
    float mask = texture2D(tGlyphs, vec2((idx + local.x) / glyphs, local.y)).r;
    // Los caracteres tienen poca superficie: el color se lleva a su brillo máximo
    // (conservando el tono) y la luminosidad se expresa con la densidad del glifo.
    // Se conserva el sombreado (puntas claras, garganta y vetas oscuras) y se
    // realza el brillo y la saturación para que el texto parezca luminoso.
    float peak = max(max(col.r, col.g), col.b);
    vec3 hue = col / max(peak, 0.001);
    vec3 bright = mix(min(col * 1.75, vec3(1.0)), hue * min(1.0, peak * 1.6), 0.45);
    // Fondo tenue del mismo color detrás del carácter: el pétalo se lee como una
    // superficie de texto, igual que en el video.
    gl_FragColor = vec4(min(bright * (0.38 + 1.05 * mask), vec3(1.0)), 1.0);
  }
`;

export class AsciiView {
  constructor({ renderer, scene, camera }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.target = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.target.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tScene: { value: this.target.texture },
        tGlyphs: { value: glyphAtlas() },
        cell: { value: new THREE.Vector2(6, 9) },
        grid: { value: new THREE.Vector2(1, 1) },
        glyphs: { value: RAMP.length }
      },
      depthTest: false,
      depthWrite: false
    });
    this.quadScene = new THREE.Scene();
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  resize(width, height) {
    const dpr = this.renderer.getPixelRatio();
    // Celdas muy finas, como en la referencia: ~200 caracteres en el lado corto.
    const cellH = Math.max(3.6, Math.min(6, Math.min(width, height) / 200)) * dpr;
    const cellW = cellH * 0.62;
    const cols = Math.ceil((width * dpr) / cellW);
    const rows = Math.ceil((height * dpr) / cellH);
    this.target.setSize(cols, rows);
    this.material.uniforms.cell.value.set(cellW, cellH);
    this.material.uniforms.grid.value.set(cols, rows);
  }

  render() {
    const r = this.renderer;
    r.setRenderTarget(this.target);
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    r.render(this.quadScene, this.quadCamera);
  }

  dispose() {
    this.target.dispose();
    this.material.uniforms.tGlyphs.value.dispose();
    this.material.dispose();
  }
}
