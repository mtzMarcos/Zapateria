// Tienda pública: secciones, menú del encabezado, tarjetas del inicio,
// subcategorías, marcas, buscador y sugerencias, páginas
// que no existen, SEO y páginas legales. Lo que debería aparecer se calcula con
// los datos de la base (productos visibles), no está fijo en la prueba.
import { BASE, check, db, nuevoCliente, terminar } from "./utilidades.mjs";

const c = nuevoCliente();
const sinTildes = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
/** Nombres de las tarjetas de producto de una página, ordenados. */
const tarjetas = async (ruta) =>
  [...(await c.get(ruta)).html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1]).toSorted();
const nombres = (lista) => lista.map((p) => p.name).toSorted();
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const { data: productos } = await db
  .from("products")
  .select("name, slug, audience, is_trending, is_sports, is_outlet, compare_at_price, price, brands(name, slug), category_id")
  .eq("active", true);
// Categoría de cada producto con su madre (si es una subcategoría).
const { data: filasCategorias } = await db.from("categories").select("id, name, slug, parent_id");
const categoriaPorId = new Map(filasCategorias.map((c) => [c.id, c]));
for (const p of productos) {
  const c = categoriaPorId.get(p.category_id);
  p.categoria = c ?? null;
  p.madre = c?.parent_id ? categoriaPorId.get(c.parent_id) : null;
}

// --- Secciones del menú
const secciones = {
  mujer: (p) => p.audience === "mujer" || p.audience === "unisex",
  hombre: (p) => p.audience === "hombre" || p.audience === "unisex",
  ninos: (p) => p.audience === "ninos",
  tendencias: (p) => p.is_trending,
  deportes: (p) => p.is_sports,
  outlet: (p) => p.is_outlet,
};
for (const [slug, incluye] of Object.entries(secciones)) {
  const esperado = nombres(productos.filter(incluye));
  const visto = await tarjetas(`/${slug}`);
  check(igual(visto, esperado), `/${slug}: ${visto.length} productos, los que corresponden`);
}
const outlet = (await c.get("/outlet")).html;
const conDescuento = productos.filter((p) => p.is_outlet && p.compare_at_price);
check(
  conDescuento.every((p) => outlet.includes(`-${Math.round((1 - p.price / p.compare_at_price) * 100)}%`)),
  "Outlet: muestra el % de descuento de los que tienen precio anterior",
);
check(outlet.includes("line-through"), "Outlet: precio anterior tachado");
const home = (await c.get("/")).html;
const encabezado = home.slice(home.indexOf("<header"), home.indexOf("</header>"));
const inicioMenu = encabezado.indexOf('aria-label="Secciones"');
const menu = encabezado.slice(inicioMenu, encabezado.indexOf("</nav>", inicioMenu));
check(
  igual([...menu.matchAll(/<a [^>]*href="\/(\w+)"/g)].map((m) => m[1]), ["hombre", "mujer", "ninos"]),
  "el menú del encabezado tiene Hombre, Mujer y Niños (en ese orden)",
);
check(!/href="\/(tendencias|deportes|outlet)"/.test(encabezado), "Tendencias, Deportes y Outlet ya no están en el encabezado");

// --- Tarjetas del inicio: las visibles de secciones con productos, en orden
const { data: filasTarjetas } = await db.from("home_cards").select("section, title, image_path, active").order("position");
const tarjetasEsperadas = filasTarjetas.filter((t) => t.active && productos.some(secciones[t.section])).map((t) => t.section);
const zonaTarjetas = home.slice(home.indexOf(">Destacados</h2>"), home.indexOf(">Novedades</h2>"));
const tarjetasVistas = home.includes(">Destacados</h2>") ? [...zonaTarjetas.matchAll(/href="\/(\w+)"/g)].map((m) => m[1]) : [];
check(igual(tarjetasVistas, tarjetasEsperadas), `inicio: tarjetas de ${tarjetasVistas.join(", ") || "ninguna"} debajo de la portada`);
const sinFoto = filasTarjetas.some((t) => tarjetasEsperadas.includes(t.section) && !t.image_path);
if (sinFoto) check(zonaTarjetas.includes("[Completar: foto]"), "tarjeta sin foto: aviso para completarla");

// --- Subcategorías: la madre incluye a sus subcategorías; la subcategoría, solo lo suyo
const conSub = productos.find((p) => p.madre);
if (conSub) {
  const madre = conSub.madre;
  const enMadre = (p) => p.categoria?.id === madre.id || p.madre?.id === madre.id;
  check(
    igual(await tarjetas(`/productos?categoria=${madre.slug}`), nombres(productos.filter(enMadre))),
    `${madre.name}: incluye las de sus subcategorías`,
  );
  const sub = conSub.categoria;
  check(
    igual(await tarjetas(`/productos?categoria=${sub.slug}`), nombres(productos.filter((p) => p.categoria?.id === sub.id))),
    `${madre.name} → ${sub.name}: solo las suyas`,
  );
  const seccion = Object.keys(secciones).find((k) => secciones[k](conSub));
  check(
    igual(
      await tarjetas(`/${seccion}?categoria=${sub.slug}`),
      nombres(productos.filter((p) => secciones[seccion](p) && p.categoria?.id === sub.id)),
    ),
    `/${seccion}?categoria=${sub.slug}: sección y subcategoría juntas`,
  );
  const listado = (await c.get(`/productos?categoria=${sub.slug}`)).html;
  const columna = listado.slice(listado.indexOf('aria-label="Filtros"'), listado.indexOf("</aside>"));
  check(
    // React escribe aria-current antes que href: se busca el link entero, sin depender del orden.
    columna.includes(`categoria=${madre.slug}"`) &&
      [...columna.matchAll(/<a [^>]*>/g)].some(
        ([a]) => a.includes(`href="/productos?categoria=${sub.slug}"`) && a.includes('aria-current="true"'),
      ),
    "columna de filtros: la subcategoría elegida, marcada dentro de su categoría",
  );
  const fichaSub = (await c.get(`/productos/${conSub.slug}`)).html;
  check(fichaSub.indexOf(`>${madre.name}</a>`) > 0 && fichaSub.indexOf(`>${madre.name}</a>`) < fichaSub.indexOf(`>${sub.name}</a>`), "producto: Productos / categoría / subcategoría arriba");
}

// --- Marcas
const marcas = [...new Map(productos.filter((p) => p.brands).map((p) => [p.brands.slug, p.brands])).values()];
for (const m of marcas.slice(0, 3)) {
  const visto = await tarjetas(`/marcas/${m.slug}`);
  check(igual(visto, nombres(productos.filter((p) => p.brands?.slug === m.slug))), `/marcas/${m.slug}: solo sus productos (${visto.length})`);
}
check(marcas.every((m) => home.includes(`href="/marcas/${m.slug}"`)), "la franja del inicio tiene todas las marcas con productos");

// --- Buscador
const buscar = async (q) => tarjetas(`/productos?q=${encodeURIComponent(q)}`);
const coincide = (p, q) => {
  const texto = sinTildes([p.name, p.brands?.name, p.categoria?.name, p.madre?.name, { ninos: "niños chicos", unisex: "unisex mujer hombre" }[p.audience] ?? p.audience].join(" "));
  return sinTildes(q).split(/\s+/).every((w) => texto.includes(w));
};
for (const q of [marcas[0].name.toUpperCase(), "zapatillas mujer", "NIÑOS", "ojota", "zapatillas running"]) {
  const visto = await buscar(q);
  check(igual(visto, nombres(productos.filter((p) => coincide(p, q)))), `buscar “${q}”: ${visto.length} resultados correctos`);
}
check((await c.get("/productos?q=zzzzqqq")).html.includes("No encontramos productos para"), "búsqueda sin resultados: lo dice");
let s = await fetch(`${BASE}/api/buscar?q=${encodeURIComponent(marcas[0].name.slice(0, 3))}`).then((r) => r.json());
check(s.productos.length > 0 && s.productos.length <= 6 && s.productos.every((p) => p.slug && p.nombre && typeof p.precio === "number"), `sugerencias: hasta 6, con nombre y precio (${s.productos.length} de ${s.total})`);
s = await fetch(`${BASE}/api/buscar?q=a`).then((r) => r.json());
check(s.total === 0, "sugerencias: con menos de 2 letras no busca");

// --- Páginas que no existen
for (const ruta of ["/no-existe", "/marcas/no-existe", "/productos/no-existe"]) {
  check((await c.get(ruta)).html.includes("NEXT_HTTP_ERROR_FALLBACK;404"), `${ruta}: no encontrado`);
}

// --- SEO
const producto = productos.find((p) => p.slug.startsWith("ejemplo-")) ?? productos[0];
const cabecera = (html) => html.slice(0, html.indexOf("</head>"));
// Los robots que leen solo el HTML (WhatsApp, Facebook, Bing…) reciben siempre los
// datos en el <head>, incluso justo después de un cambio (la página se regenera).
const paraRobot = await fetch(`${BASE}/productos/${producto.slug}`, { headers: { "user-agent": "WhatsApp/2.24" } }).then((r) => r.text());
check(
  cabecera(paraRobot).includes('<meta name="description"') && cabecera(paraRobot).includes('property="og:image"'),
  "producto para WhatsApp/redes: descripción y foto en el <head>",
);
// Un navegador común también, una vez regenerada la página (la primera visita
// después de un cambio puede mandar los datos después, al final del HTML).
await c.get(`/productos/${producto.slug}`);
const ficha = (await c.get(`/productos/${producto.slug}`)).html;
check(cabecera(ficha).includes('<meta name="description"') && cabecera(ficha).includes('rel="canonical"'), "producto: descripción y canonical en el <head>");
check(ficha.includes('"@type":"Product"') && ficha.includes('"priceCurrency":"ARS"'), "producto: datos estructurados para Google");
const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text());
check(["/mujer", "/outlet", `/marcas/${marcas[0].slug}`, `/productos/${producto.slug}`, "/terminos"].every((r) => sitemap.includes(`${r}</loc>`)), "sitemap: secciones, marcas, productos y legales");
if (conSub) check(sitemap.includes(`categoria=${conSub.categoria.slug}</loc>`), "sitemap: subcategorías");
const robots = await fetch(`${BASE}/robots.txt`).then((r) => r.text());
check(["/admin", "/carrito", "/checkout", "/pedido/"].every((r) => robots.includes(`Disallow: ${r}`)), "robots.txt: no indexa panel, carrito, checkout ni pedidos");
check((await fetch(`${BASE}/opengraph-image`)).headers.get("content-type") === "image/png", "imagen para compartir");

// --- Páginas legales y pie
for (const ruta of ["/terminos", "/cambios-y-devoluciones", "/privacidad", "/arrepentimiento"]) {
  check((await c.get(ruta)).status === 200, `${ruta} responde`);
}
check(home.includes("Defensa de las y los Consumidores. Para reclamos ingrese aquí"), "pie: link a Defensa del Consumidor");
const { data: anuncio } = await db.from("site_settings").select("announcement_text, announcement_active").single();
if (anuncio.announcement_active && anuncio.announcement_text) {
  check(home.includes(anuncio.announcement_text), "inicio: barra del anuncio");
}
check(home.includes('aria-roledescription="carrusel"') || home.includes("Ver productos"), "inicio: carrusel de portadas (o presentación si no hay portadas)");

terminar("Tienda");
