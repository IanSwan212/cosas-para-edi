// Pone ?v=<versión> en los imports locales, el script principal y las hojas de estilo,
// para que el navegador nunca mezcle archivos viejos (en caché) con nuevos.
// Uso: node tools/stamp.mjs   (ejecutar antes de cada commit que cambie la web)
import fs from "node:fs";
import path from "node:path";

const version = Date.now().toString(36);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const stampJs = (text) =>
  text
    .replace(/(from\s+["'])(\.{1,2}\/[^"'?]+\.js)(\?v=[^"']*)?(["'])/g, `$1$2?v=${version}$4`)
    .replace(/(import\(\s*["'])(\.{1,2}\/[^"'?]+\.js)(\?v=[^"']*)?(["'])/g, `$1$2?v=${version}$4`);
const stampHtml = (text) =>
  text
    .replace(/(src=["'])((?:\.\/)?src\/(?:main|entry)\.js)(\?v=[^"']*)?(["'])/g, `$1$2?v=${version}$4`)
    .replace(/(href=["'])(styles\.css)(\?v=[^"']*)?(["'])/g, `$1$2?v=${version}$4`);

let files = 0;
for (const dir of ["src", "ramo/src"]) {
  for (const name of fs.readdirSync(path.join(root, dir))) {
    if (!name.endsWith(".js")) continue;
    const p = path.join(root, dir, name);
    const before = fs.readFileSync(p, "utf8");
    const after = stampJs(before);
    if (after !== before) { fs.writeFileSync(p, after); files++; }
  }
}
for (const html of ["index.html", "ramo/index.html"]) {
  const p = path.join(root, html);
  const before = fs.readFileSync(p, "utf8");
  const after = stampHtml(before);
  if (after !== before) { fs.writeFileSync(p, after); files++; }
}
console.log(`versión ${version}: ${files} archivos actualizados`);
