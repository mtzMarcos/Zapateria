// Calcula y guarda el color de las fotos de portada que no lo tienen (por
// ejemplo, las que se subieron antes de que existiera el degradado).
//
//   npm run portadas:colores              (solo las que no tienen color)
//   npm run portadas:colores -- --todas   (recalcula todas)
//
// Usa el mismo método que el panel al subir una foto (src/lib/color-dominante.ts):
// color dominante del tercio de abajo de la foto, achicada a 64 px de ancho.
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(join(process.cwd(), "/"));
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const todas = process.argv.includes("--todas");

async function colorDominante(buffer) {
  const { data, info } = await sharp(buffer).resize({ width: 64 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const desde = Math.floor(info.height * (2 / 3));
  const grupos = new Map();
  for (let y = desde; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] < 128) continue; // transparente
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const clave = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const grupo = grupos.get(clave) ?? { n: 0, r: 0, g: 0, b: 0 };
      grupo.n++;
      grupo.r += r;
      grupo.g += g;
      grupo.b += b;
      grupos.set(clave, grupo);
    }
  }
  let mayor;
  for (const grupo of grupos.values()) if (!mayor || grupo.n > mayor.n) mayor = grupo;
  if (!mayor) return null;
  const hex = (v) => Math.round(v / mayor.n).toString(16).padStart(2, "0");
  return `#${hex(mayor.r)}${hex(mayor.g)}${hex(mayor.b)}`;
}

const { data: portadas, error } = await db
  .from("home_slides")
  .select("id, title, image_path, mobile_image_path, image_color, mobile_image_color")
  .order("position");
if (error) throw new Error(`No se pudieron leer las portadas: ${error.message}`);

let guardados = 0;
for (const p of portadas) {
  for (const [ruta, columna, actual, cual] of [
    [p.image_path, "image_color", p.image_color, "compu"],
    [p.mobile_image_path, "mobile_image_color", p.mobile_image_color, "celular"],
  ]) {
    if (!ruta || (actual && !todas)) continue;
    const { data: archivo, error: errorDescarga } = await db.storage.from("product-images").download(ruta);
    if (errorDescarga) {
      console.error(`"${p.title}" (${cual}): no se pudo descargar la foto: ${errorDescarga.message}`);
      continue;
    }
    const color = await colorDominante(Buffer.from(await archivo.arrayBuffer()));
    const { error: errorGuardar } = await db.from("home_slides").update({ [columna]: color }).eq("id", p.id);
    if (errorGuardar) console.error(`"${p.title}" (${cual}): ${errorGuardar.message}`);
    else {
      guardados++;
      console.log(`"${p.title}" (${cual}): ${color}`);
    }
  }
}
console.log(`\n${guardados} colores guardados.${guardados ? " Si la tienda ya estaba abierta, el cambio se ve al guardar cualquier cosa en el panel o en el próximo deploy." : ""}`);
