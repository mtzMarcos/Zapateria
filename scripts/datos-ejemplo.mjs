/**
 * Datos de ejemplo para probar la tienda (marcas, categorías, productos,
 * talles con stock y fotos generadas).
 *
 *   npm run ejemplo:cargar   Carga los datos. Si ya estaban, los vuelve a
 *                            crear desde cero (se puede correr las veces que haga falta).
 *   npm run ejemplo:borrar   Borra todos los productos de ejemplo y sus fotos,
 *                            y las marcas/categorías de ejemplo que no se estén usando.
 *
 * Los productos de ejemplo se reconocen por el slug (todos empiezan con
 * "ejemplo-"), así que el script nunca toca productos reales.
 * Usa la clave secreta de .env.local (saltea RLS): solo se corre en tu PC.
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "product-images";
const TALLES = ["36", "37", "38", "39", "40", "41", "42", "43", "44"];

const MARCAS = [
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "Puma", slug: "puma" },
  { name: "Topper", slug: "topper" },
];

const CATEGORIAS = [
  { name: "Zapatillas", slug: "zapatillas", position: 1 },
  { name: "Botas", slug: "botas", position: 2 },
  { name: "Ojotas", slug: "ojotas", position: 3 },
];

// Subcategorías de Zapatillas. Training y Básquet quedan sin productos: no se
// ven en la tienda, pero sirven para probar el panel.
const SUBCATEGORIAS = [
  { name: "Urbanas", slug: "urbanas", position: 1, madre: "zapatillas" },
  { name: "Running", slug: "running", position: 2, madre: "zapatillas" },
  { name: "Training", slug: "training", position: 3, madre: "zapatillas" },
  { name: "Básquet", slug: "basquet", position: 4, madre: "zapatillas" },
  { name: "Skate", slug: "skate", position: 5, madre: "zapatillas" },
];

// Público, secciones del menú (Tendencias, Deportes, Outlet) y precio anterior
// (tachado) de cada producto de ejemplo, para que los menús no queden vacíos.
const EXTRAS = {
  "ejemplo-nike-air-max-90": { audience: "hombre", is_trending: true },
  "ejemplo-nike-revolution-7": { audience: "mujer", is_sports: true, is_outlet: true, compare_at_price: 109999 },
  "ejemplo-adidas-superstar": { audience: "unisex", is_trending: true },
  "ejemplo-adidas-ultraboost-light": { audience: "unisex", is_sports: true },
  "ejemplo-puma-suede-classic": { audience: "mujer", is_trending: true, is_outlet: true, compare_at_price: 139999 },
  "ejemplo-topper-rock": { audience: "ninos" },
  "ejemplo-topper-bota-trekking": { audience: "hombre", is_sports: true },
  "ejemplo-puma-bota-urbana": { audience: "mujer" },
  "ejemplo-adidas-adilette": { audience: "unisex", is_outlet: true, compare_at_price: 49999 },
  "ejemplo-nike-victori-one": { audience: "ninos", is_sports: true },
};

// stock: un número por talle, del 36 al 44. colores: uno por foto.
// categoria: la principal (también elige el dibujo de la foto); subcategoria: opcional.
const PRODUCTOS = [
  {
    slug: "ejemplo-nike-air-max-90",
    subcategoria: "urbanas",
    name: "Nike Air Max 90",
    marca: "nike",
    categoria: "zapatillas",
    price: 159999,
    stock: [0, 2, 4, 6, 5, 3, 2, 1, 0],
    colores: ["#dc2626", "#1f2937", "#f5f5f4"],
    description:
      "Clásica con cámara de aire visible en el talón.\nCapellada de cuero y malla, suela de goma.",
  },
  {
    slug: "ejemplo-nike-revolution-7",
    subcategoria: "running",
    name: "Nike Revolution 7",
    marca: "nike",
    categoria: "zapatillas",
    price: 89999,
    stock: [3, 3, 5, 8, 8, 6, 4, 2, 1],
    colores: ["#2563eb", "#111827"],
    description: "Zapatilla liviana para correr o para el día a día. Espuma suave y malla respirable.",
  },
  {
    slug: "ejemplo-adidas-superstar",
    subcategoria: "urbanas",
    name: "Adidas Superstar",
    marca: "adidas",
    categoria: "zapatillas",
    price: 129999,
    stock: [1, 0, 3, 4, 0, 5, 2, 0, 0],
    colores: ["#f5f5f4", "#111827"],
    description: "La de la puntera de goma. Cuero blanco con las tres tiras negras.",
  },
  {
    slug: "ejemplo-adidas-ultraboost-light",
    subcategoria: "running",
    name: "Adidas Ultraboost Light",
    marca: "adidas",
    categoria: "zapatillas",
    price: 219999,
    stock: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    colores: ["#0f766e"],
    description: "Running de alto rendimiento. Producto agotado a propósito para probar la tienda.",
  },
  {
    slug: "ejemplo-puma-suede-classic",
    subcategoria: "urbanas",
    name: "Puma Suede Classic",
    marca: "puma",
    categoria: "zapatillas",
    price: 109999,
    stock: [2, 4, 4, 3, 2, 2, 1, 0, 0],
    colores: ["#7c3aed", "#b91c1c"],
    description: "Gamuza suave con la franja lateral de siempre.",
  },
  {
    slug: "ejemplo-topper-rock",
    subcategoria: "skate",
    name: "Topper Rock",
    marca: "topper",
    categoria: "zapatillas",
    price: 54999,
    stock: [5, 6, 8, 10, 10, 8, 6, 3, 2],
    colores: ["#111827", "#f5f5f4"],
    description: "Zapatilla de lona, cómoda y económica. Ideal para todos los días.",
  },
  {
    slug: "ejemplo-topper-bota-trekking",
    name: "Topper Bota Trekking",
    marca: "topper",
    categoria: "botas",
    price: 99999,
    stock: [0, 1, 2, 3, 3, 2, 2, 1, 1],
    colores: ["#78350f", "#57534e"],
    description: "Bota de media caña para caminatas. Suela con buen agarre y refuerzo en la puntera.",
  },
  {
    slug: "ejemplo-puma-bota-urbana",
    name: "Puma Bota Urbana",
    marca: "puma",
    categoria: "botas",
    price: 149999,
    stock: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    colores: ["#1c1917"],
    description: "Bota de cuero para la ciudad. Producto agotado a propósito para probar la tienda.",
  },
  {
    slug: "ejemplo-adidas-adilette",
    name: "Adidas Adilette",
    marca: "adidas",
    categoria: "ojotas",
    price: 39999,
    stock: [4, 6, 6, 8, 8, 6, 4, 0, 0],
    colores: ["#1e3a8a", "#111827"],
    description: "Ojota de pala ancha para la pileta o para estar en casa.",
  },
  {
    slug: "ejemplo-nike-victori-one",
    name: "Nike Victori One",
    marca: "nike",
    categoria: "ojotas",
    price: 34999,
    stock: [0, 2, 0, 3, 1, 0, 2, 0, 1],
    colores: ["#ea580c"],
    description: "Ojota con plantilla acolchada. Pocas unidades por talle.",
  },
];

// ---------------------------------------------------------------------
// Fotos de ejemplo: un dibujo simple del calzado con el nombre del producto.
// ---------------------------------------------------------------------

const SILUETAS = {
  zapatillas:
    '<path d="M150 520 L150 420 Q155 360 225 350 L330 340 Q370 270 450 275 L475 345 Q570 375 660 440 Q710 475 700 520 Z"/>' +
    '<rect x="130" y="515" width="590" height="50" rx="25" fill="#ffffff" stroke="#00000033" stroke-width="4"/>',
  botas:
    '<path d="M170 520 L170 190 Q170 170 190 170 L340 170 Q355 170 355 190 L360 370 Q570 390 660 450 Q705 480 700 520 Z"/>' +
    '<rect x="150" y="515" width="570" height="55" rx="18" fill="#292524"/>',
  ojotas:
    '<rect x="140" y="500" width="580" height="45" rx="22"/>' +
    '<path d="M300 500 Q420 360 560 500" fill="none" stroke-width="60" stroke-linecap="round" stroke="#00000055"/>',
};

function escaparXml(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function generarFoto(producto, marca, color, indice) {
  // La segunda foto y las siguientes muestran el otro lado (espejado).
  const espejo = indice % 2 === 1 ? 'transform="translate(850 0) scale(-1 1)"' : "";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 850 800">
  <rect width="850" height="800" fill="${indice % 2 ? "#e7e5e4" : "#f5f5f4"}"/>
  <text x="425" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="40"
        font-weight="700" letter-spacing="8" fill="#57534e">${escaparXml(marca.toUpperCase())}</text>
  <g fill="${color}" stroke="#00000022" stroke-width="3" ${espejo}>${SILUETAS[producto.categoria]}</g>
  <text x="425" y="680" text-anchor="middle" font-family="Arial, sans-serif" font-size="44"
        font-weight="700" fill="#1c1917">${escaparXml(producto.name)}</text>
  <text x="425" y="735" text-anchor="middle" font-family="Arial, sans-serif" font-size="26"
        fill="#a8a29e">FOTO DE EJEMPLO</text>
</svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}

// ---------------------------------------------------------------------

function conectar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function ok({ data, error }, accion) {
  if (error) throw new Error(`${accion}: ${error.message}`);
  return data;
}

async function borrarProductos(supabase) {
  const productos = ok(
    await supabase
      .from("products")
      .select("id, product_images(storage_path)")
      .in("slug", PRODUCTOS.map((p) => p.slug)),
    "Buscar productos de ejemplo",
  );
  if (productos.length === 0) return 0;

  const archivos = productos.flatMap((p) => p.product_images.map((i) => i.storage_path));
  if (archivos.length > 0) {
    ok(await supabase.storage.from(BUCKET).remove(archivos), "Borrar fotos");
  }
  // Talles y registros de fotos se borran solos (on delete cascade).
  ok(
    await supabase.from("products").delete().in("id", productos.map((p) => p.id)),
    "Borrar productos",
  );
  return productos.length;
}

// Borra las marcas/categorías de ejemplo que no tengan productos (ni subcategorías).
// Si el dueño ya les asignó productos reales o subcategorías propias, quedan.
async function borrarTaxonomias(supabase, tabla, items, columna) {
  const filas = ok(
    await supabase.from(tabla).select("id, name").in("slug", items.map((i) => i.slug)),
    `Buscar ${tabla}`,
  );
  const quedan = [];
  for (const fila of filas) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq(columna, fila.id);
    const { count: hijas } =
      tabla === "categories"
        ? await supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", fila.id)
        : { count: 0 };
    if (count || hijas) {
      quedan.push(fila.name);
      continue;
    }
    ok(await supabase.from(tabla).delete().eq("id", fila.id), `Borrar ${fila.name}`);
  }
  return quedan;
}

async function cargar(supabase) {
  const borrados = await borrarProductos(supabase);
  if (borrados) console.log(`Se borraron ${borrados} productos de ejemplo anteriores.`);

  // Si la marca o categoría ya existe (mismo slug), se reutiliza.
  const marcas = ok(
    await supabase.from("brands").upsert(MARCAS, { onConflict: "slug" }).select("id, slug, name"),
    "Cargar marcas",
  );
  const categorias = ok(
    await supabase
      .from("categories")
      .upsert(CATEGORIAS, { onConflict: "slug" })
      .select("id, slug"),
    "Cargar categorías",
  );
  const madrePorSlug = new Map(categorias.map((c) => [c.slug, c.id]));
  const subcategorias = ok(
    await supabase
      .from("categories")
      .upsert(
        SUBCATEGORIAS.map(({ madre, ...sub }) => ({ ...sub, parent_id: madrePorSlug.get(madre) })),
        { onConflict: "slug" },
      )
      .select("id, slug"),
    "Cargar subcategorías",
  );
  categorias.push(...subcategorias);
  const marcaPorSlug = new Map(marcas.map((m) => [m.slug, m]));
  const categoriaPorSlug = new Map(categorias.map((c) => [c.slug, c.id]));
  console.log(`Marcas: ${marcas.length}. Categorías y subcategorías: ${categorias.length}.`);

  const ahora = Date.now();
  for (const [i, p] of PRODUCTOS.entries()) {
    const marca = marcaPorSlug.get(p.marca);
    const [producto] = ok(
      await supabase
        .from("products")
        .insert({
          slug: p.slug,
          name: p.name,
          description: `${p.description}\n\nProducto de ejemplo para probar la tienda.`,
          price: p.price,
          active: true,
          brand_id: marca.id,
          category_id: categoriaPorSlug.get(p.subcategoria ?? p.categoria),
          ...EXTRAS[p.slug],
          // Fechas escalonadas para que el orden "más nuevos" sea siempre el mismo.
          created_at: new Date(ahora - i * 60_000).toISOString(),
        })
        .select("id"),
      `Crear ${p.name}`,
    );

    ok(
      await supabase
        .from("product_variants")
        .insert(TALLES.map((size, t) => ({ product_id: producto.id, size, stock: p.stock[t] }))),
      `Talles de ${p.name}`,
    );

    const fotos = [];
    for (const [f, color] of p.colores.entries()) {
      const path = `${producto.id}/${randomUUID()}.webp`;
      const imagen = await generarFoto(p, marca.name, color, f);
      ok(
        await supabase.storage.from(BUCKET).upload(path, imagen, { contentType: "image/webp" }),
        `Subir foto de ${p.name}`,
      );
      fotos.push({ product_id: producto.id, storage_path: path, alt: p.name, position: f });
    }
    ok(await supabase.from("product_images").insert(fotos), `Fotos de ${p.name}`);

    const total = p.stock.reduce((a, b) => a + b, 0);
    console.log(`  ✓ ${p.name} (${fotos.length} fotos, stock total ${total})`);
  }
}

async function borrar(supabase) {
  const borrados = await borrarProductos(supabase);
  console.log(`Se borraron ${borrados} productos de ejemplo (con sus talles y fotos).`);

  const marcas = await borrarTaxonomias(supabase, "brands", MARCAS, "brand_id");
  // Primero las subcategorías: una categoría con subcategorías no se puede borrar.
  const subcategorias = await borrarTaxonomias(supabase, "categories", SUBCATEGORIAS, "category_id");
  const categorias = await borrarTaxonomias(supabase, "categories", CATEGORIAS, "category_id");
  const quedan = [...marcas, ...subcategorias, ...categorias];
  if (quedan.length > 0) {
    console.log(`Quedan (tienen productos reales): ${quedan.join(", ")}.`);
  }
}

const comando = process.argv[2];
const acciones = { cargar, borrar };
if (!acciones[comando]) {
  console.error("Uso: node scripts/datos-ejemplo.mjs cargar|borrar");
  process.exit(1);
}

try {
  await acciones[comando](conectar());
  console.log(
    "\nListo. Si la tienda no muestra los cambios, reiniciá `npm run dev` " +
      "o guardá cualquier cosa en el panel (eso refresca la caché del catálogo).",
  );
} catch (error) {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
}
