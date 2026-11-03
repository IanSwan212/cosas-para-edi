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

const SS = 3; // puntos de muestra por lado en cada celda

const FRAG = /* glsl */ `
  #define SS ${SS}
  uniform sampler2D tScene;
  uniform sampler2D tGlyphs;
  uniform vec2 cell;     // tamaño de celda en píxeles del framebuffer
  uniform vec2 grid;     // columnas, filas
  uniform float glyphs;
  uniform float exposure;
  vec3 aces(vec3 x) { x *= exposure; return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
  // Cada celda mira SS×SS puntos de la escena (supermuestreo): toma el color promedio de lo que
  // más la cubre y, en los bordes, usa un glifo más ligero según cuánta planta hay en la celda,
  // así las brácteas, hojas y ramas conservan su silueta en lugar de verse en bloques.
  void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 c = floor(frag / cell);
    vec2 local = fract(frag / cell);
    vec4 sumSky = vec4(0.0), sumGround = vec4(0.0), sumObj = vec4(0.0);
    for (int j = 0; j < SS; j++) for (int i = 0; i < SS; i++) {
      vec4 t = texture2D(tScene, (c * float(SS) + vec2(float(i), float(j)) + 0.5) / (grid * float(SS)));
      if (t.a < 0.25) sumSky += vec4(t.rgb, 1.0);
      else if (t.a < 0.75) sumGround += vec4(t.rgb, 1.0);
      else sumObj += vec4(t.rgb, 1.0);
    }
    float cover = sumObj.a / float(SS * SS);
    // El cielo ya trae colores de pantalla; lo demás es luz lineal: tonos y luego sRGB.
    vec3 skyCol = sumSky.a > 0.0 ? sumSky.rgb / sumSky.a : vec3(0.0);
    vec3 groundCol = sumGround.a > 0.0 ? pow(aces(sumGround.rgb / sumGround.a), vec3(1.0 / 2.2)) : vec3(0.0);
    vec3 under = sumSky.a >= sumGround.a ? skyCol : groundCol;
    if (cover < 0.2) {
      if (sumSky.a >= sumGround.a) {
        // Caracteres ralos (. , :) que se espesan cerca del sol, sobre el color del cielo casi
        // entero, para que se lea como un degradado suave y no como rayas. El sol va lleno.
        float lum = dot(skyCol, vec3(0.299, 0.587, 0.114));
        float idx = clamp(floor(pow(lum, 5.0) * (glyphs - 1.0)), 1.0, glyphs - 1.0);
        float mask = texture2D(tGlyphs, vec2((idx + local.x) / glyphs, local.y)).r;
        float base = mix(0.8, 0.92, smoothstep(0.78, 0.9, lum));
        gl_FragColor = lum > 0.915 ? vec4(skyCol, 1.0) : vec4(min(skyCol * (base + 0.28 * mask), vec3(1.0)), 1.0);
      } else {
        float lum = dot(groundCol, vec3(0.299, 0.587, 0.114));
        float idx = clamp(floor(pow(lum, 1.1) * 1.6 * (glyphs - 1.0)), 1.0, glyphs - 1.0);
        float mask = texture2D(tGlyphs, vec2((idx + local.x) / glyphs, local.y)).r;
        gl_FragColor = vec4(groundCol * (0.75 + 0.5 * mask), 1.0);
      }
      return;
    }
    vec3 col = pow(aces(sumObj.rgb / sumObj.a), vec3(1.0 / 2.2));
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    // En los bordes (cobertura parcial) el glifo es más ligero: el contorno se suaviza.
    float edge = smoothstep(0.2, 0.85, cover);
    float idx = clamp(floor(pow(lum, 0.8) * 1.15 * edge * (glyphs - 1.0)), 1.0, glyphs - 1.0);
    float mask = texture2D(tGlyphs, vec2((idx + local.x) / glyphs, local.y)).r;
    // Como en el ramo: el color se lleva a su brillo máximo conservando el tono, y la
    // luminosidad se expresa con la densidad del glifo, sobre un fondo tenue del mismo color.
    float peak = max(max(col.r, col.g), col.b);
    vec3 hue = col / max(peak, 0.001);
    // Para que se vea más real, el color casi no se exagera.
    vec3 bright = mix(min(col * 1.15, vec3(1.0)), hue * min(1.0, peak * 1.2), 0.2);
    bright.b *= 0.86; // entre glifos oscuros el magenta tiende a verse violeta: se calienta un poco
    // Cada celda conserva casi todo su color (la imagen se lee como una foto) y el glifo le da textura.
    vec3 ink = min(bright * (0.68 + 0.5 * mask), vec3(1.0));
    gl_FragColor = vec4(mix(under * 0.85, ink, edge), 1.0);
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
    // Celdas muy finas: unos 280 caracteres en el lado corto; los glifos dan textura sin
    // perder la forma de la planta.
    const cellH = Math.max(3, Math.min(5, Math.min(width, height) / 280)) * dpr;
    const cellW = cellH * 0.62;
    const cols = Math.ceil((width * dpr) / cellW);
    const rows = Math.ceil((height * dpr) / cellH);
    this.target.setSize(cols * SS, rows * SS);
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
