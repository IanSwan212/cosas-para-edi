// Vista ASCII de la bugambilia, con el mismo método y los mismos glifos que el ramo
// (ramo/src/asciiView.js), pero pensada para un atardecer en lugar de un fondo negro.
//
// La escena se renderiza a una textura con un píxel por celda y con rango de luz completo
// (HalfFloat); este shader hace el mapeo de tonos y dibuja en cada celda un carácter elegido
// por su brillo. El alfa de la textura dice qué es cada celda:
//   0    cielo: caracteres ralos sobre su color, que se espesan hacia el sol
//   0.5  suelo y cordilleras: caracteres apagados, para que las sombras se lean sin ruido
//   1    planta, pétalos y «Te amo»: color vivo y densidad según el brillo, como en el ramo
import * as THREE from "three";

// Marca como «suelo» lo que dibuja este material (alfa 0.5 en la textura de la vista ASCII).
export function markAsGround(material) {
  material.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", "#include <opaque_fragment>\n  gl_FragColor.a = 0.5;");
  };
  material.customProgramCacheKey = () => "ground";
  return material;
}

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
  uniform float exposure;
  vec3 aces(vec3 x) { x *= exposure; return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
  void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 c = floor(frag / cell);
    vec2 local = fract(frag / cell);
    vec4 texel = texture2D(tScene, (c + 0.5) / grid);
    bool sky = texel.a < 0.25, ground = texel.a < 0.75;
    // El cielo ya trae colores de pantalla; lo demás es luz lineal: tonos y luego sRGB.
    vec3 col = sky ? texel.rgb : pow(aces(texel.rgb), vec3(1.0 / 2.2));
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    if (sky) {
      // Caracteres ralos (. , :) que se espesan cerca del sol, sobre el color del cielo casi
      // entero, para que se lea como un degradado suave y no como rayas. El sol va casi lleno.
      float idx = clamp(floor(pow(lum, 5.0) * (glyphs - 1.0)), 1.0, glyphs - 1.0);
      float mask = texture2D(tGlyphs, vec2((idx + local.x) / glyphs, local.y)).r;
      float base = mix(0.8, 0.92, smoothstep(0.78, 0.9, lum));
      // El disco del sol va lleno, sin glifo, para que se distinga de su halo.
      gl_FragColor = lum > 0.915 ? vec4(col, 1.0) : vec4(min(col * (base + 0.28 * mask), vec3(1.0)), 1.0);
      return;
    }
    if (ground) {
      float idx = clamp(floor(pow(lum, 1.1) * 1.6 * (glyphs - 1.0)), 1.0, glyphs - 1.0);
      float mask = texture2D(tGlyphs, vec2((idx + local.x) / glyphs, local.y)).r;
      gl_FragColor = vec4(col * (0.55 + 0.9 * mask), 1.0);
      return;
    }
    if (lum < 0.03) { gl_FragColor = vec4(col * 0.5, 1.0); return; }
    float idx = clamp(floor(pow(lum, 0.8) * 1.15 * (glyphs - 1.0)), 1.0, glyphs - 1.0);
    float mask = texture2D(tGlyphs, vec2((idx + local.x) / glyphs, local.y)).r;
    // Como en el ramo: el color se lleva a su brillo máximo conservando el tono, y la
    // luminosidad se expresa con la densidad del glifo, sobre un fondo tenue del mismo color.
    float peak = max(max(col.r, col.g), col.b);
    vec3 hue = col / max(peak, 0.001);
    vec3 bright = mix(min(col * 1.3, vec3(1.0)), hue * min(1.0, peak * 1.35), 0.35);
    bright.b *= 0.86; // entre glifos oscuros el magenta tiende a verse violeta: se calienta un poco
    gl_FragColor = vec4(min(bright * (0.4 + 1.0 * mask), vec3(1.0)), 1.0);
  }
`;

export class AsciiView {
  constructor({ renderer, scene, camera, exposure = 1.05 }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    });
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tScene: { value: this.target.texture },
        tGlyphs: { value: glyphAtlas() },
        cell: { value: new THREE.Vector2(6, 9) },
        grid: { value: new THREE.Vector2(1, 1) },
        glyphs: { value: RAMP.length },
        exposure: { value: exposure },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene = new THREE.Scene();
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  resize(width, height) {
    const dpr = this.renderer.getPixelRatio();
    // Celdas finas: unos 170 caracteres en el lado corto, para que «Te amo» se lea.
    const cellH = Math.max(3.8, Math.min(7, Math.min(width, height) / 170)) * dpr;
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
}
