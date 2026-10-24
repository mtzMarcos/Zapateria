// Panel en un navegador de verdad con un admin temporal: portada (foto, textos y
// link), tarjetas del inicio, categorías y subcategorías, logo de marca y precio
// anterior. Al terminar deja todo como estaba.
// Va última: escribe en la base directo al restaurar y eso no refresca la caché
// del servidor de pruebas. Si no hay Edge ni Chrome instalado, se omite.
import { mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { abrirNavegador, borrarAdmin, check, crearAdmin, db, espera, rutaNavegador, terminar } from "./utilidades.mjs";

if (!rutaNavegador()) {
  console.log("Sin Edge ni Chrome: prueba omitida.");
  process.exit(0);
}
const sharp = createRequire(join(process.cwd(), "/"))("sharp");

// Imágenes de prueba (se generan acá).
const carpeta = mkdtempSync(join(tmpdir(), "pruebas-panel-"));
const svg = (w, h, texto, fondo) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${fondo}"/><text x="50%" y="55%" font-family="Arial" font-size="${h / 4}" fill="#111" text-anchor="middle" dominant-baseline="middle">${texto}</text></svg>`);
const fotoPortada = join(carpeta, "portada.jpg");
const fotoTarjeta = join(carpeta, "tarjeta.jpg");
const logo = join(carpeta, "logo.png");
await sharp(svg(1920, 800, "PORTADA DE PRUEBA", "#cbd5e1")).jpeg().toFile(fotoPortada);
await sharp(svg(400, 200, "LOGO", "#ffffff")).png().toFile(logo);
await sharp(svg(900, 1200, "TARJETA", "#fde68a")).jpeg().toFile(fotoTarjeta);

const { data: portadasAntes } = await db.from("home_slides").select("*").order("position");
const { data: tarjetasAntes } = await db.from("home_cards").select("*").order("position");
const { data: categoriasAntes } = await db.from("categories").select("id, name, slug, parent_id, position");
const zapatillas = categoriasAntes.find((c) => c.slug === "zapatillas");
const botas = categoriasAntes.find((c) => c.slug === "botas");
const { data: marca } = await db.from("brands").select("id, name, slug, logo_path").not("slug", "is", null).order("name").limit(1).single();
const { data: producto } = await db.from("products").select("id, price, compare_at_price").like("slug", "ejemplo-%").limit(1).single();
let admin;
let nav;

try {
  if (portadasAntes.length === 0) throw new Error("No hay portadas: corré la migración 20261026000000_portada_y_secciones.sql");
  admin = await crearAdmin();
  nav = await abrirNavegador({ ancho: 1280 });

  await nav.ir("/admin/login");
  await nav.escribir('input[name="email"]', admin.email);
  await nav.escribir('input[name="password"]', admin.password);
  await nav.evaluar(`document.querySelector("form button[type=submit]").click()`);
  check(await nav.hasta(`location.pathname === "/admin/pedidos"`), "login en el panel");

  // --- Portada: foto de la primera
  await nav.ir("/admin/portada");
  check(await nav.evaluar(`document.body.innerText.includes("Fotos grandes del inicio")`), "la página Portada carga");
  await nav.elegirArchivo(0, fotoPortada);
  const primera = portadasAntes[0].id;
  let ruta = null;
  for (let t = 0; t < 30 && !ruta; t++) {
    await espera(700);
    ruta = (await db.from("home_slides").select("image_path").eq("id", primera).single()).data.image_path;
  }
  check(/^portada\/[0-9a-f-]{36}\.jpg$/.test(ruta ?? ""), "subir la foto de una portada");

  // --- Portada: textos, link y validación
  await nav.ir("/admin/portada");
  await nav.escribir('[name="titulo"]', "Título de prueba");
  await nav.escribir('[name="destino"]', "/outlet");
  await nav.evaluar(`document.querySelector('[name="titulo"]').form.querySelector("button[type=submit]").click()`);
  check(await nav.hasta(`document.body.innerText.includes("Portada guardada.")`), "guardar los textos de la portada");
  const guardada = (await db.from("home_slides").select("title, button_url").eq("id", primera).single()).data;
  check(guardada.title === "Título de prueba" && guardada.button_url === "/outlet", "título y link guardados");
  await nav.escribir('[name="destino"]', "otro");
  await espera(300);
  await nav.escribir('[name="linkOtro"]', "//otro-sitio.com");
  await nav.evaluar(`document.querySelector('[name="titulo"]').form.querySelector("button[type=submit]").click()`);
  check(await nav.hasta(`document.body.innerText.includes('El link tiene que empezar con "/"')`), "rechaza un link a otro sitio");
  check(await nav.evaluar(`document.querySelector('[name="linkOtro"]')?.value === "//otro-sitio.com"`), "después del error conserva lo escrito");

  await nav.ir("/");
  check(
    await nav.evaluar(`!!document.querySelector('[aria-roledescription="carrusel"] picture img') && document.body.textContent.includes("Título de prueba")`),
    "la tienda muestra la foto y el título nuevos",
  );

  // --- Tarjetas del inicio: foto y título de la primera (Tendencias)
  await nav.ir("/admin/portada");
  const tarjeta = tarjetasAntes[0];
  const inputsArchivo = await nav.evaluar(`document.querySelectorAll("input[type=file]").length`);
  await nav.elegirArchivo(inputsArchivo - tarjetasAntes.length, fotoTarjeta);
  let rutaTarjeta = null;
  for (let t = 0; t < 30 && !rutaTarjeta; t++) {
    await espera(700);
    rutaTarjeta = (await db.from("home_cards").select("image_path").eq("section", tarjeta.section).single()).data.image_path;
  }
  check(/^portada\/[0-9a-f-]{36}\.jpg$/.test(rutaTarjeta ?? ""), `subir la foto de la tarjeta ${tarjeta.section}`);
  await nav.ir("/admin/portada");
  const titulo = `document.getElementById("tarjeta-titulo-${tarjeta.section}")`;
  await nav.escribir(`#tarjeta-titulo-${tarjeta.section}`, "Tarjeta de prueba");
  await nav.evaluar(`${titulo}.form.querySelector("button[type=submit]").click()`);
  check(await nav.hasta(`document.body.innerText.includes("Tarjeta guardada.")`), "guardar el título de la tarjeta");
  await nav.ir("/");
  check(
    await nav.evaluar(`(() => { const a = document.querySelector('a[href="/${tarjeta.section}"]:has(h3)'); return !!a?.querySelector("img") && a.textContent.includes("Tarjeta de prueba"); })()`),
    "el inicio muestra la tarjeta con la foto y el título nuevos",
  );

  // --- Categorías: subcategoría nueva, orden con flechas y reglas de un solo nivel
  if (zapatillas && botas) {
    await nav.ir("/admin/categorias");
    await nav.escribir('form input[name="nombre"]', "Subcategoría de prueba");
    await nav.escribir("#nueva-madre", zapatillas.id);
    await nav.evaluar(`document.querySelector("#nueva-madre").form.querySelector("button[type=submit]").click()`);
    check(await nav.hasta(`document.body.innerText.includes('"Subcategoría de prueba" agregada.')`), "agregar una subcategoría dentro de Zapatillas");
    const hermanas = async () =>
      (await db.from("categories").select("name").eq("parent_id", zapatillas.id).order("position").order("name")).data.map((c) => c.name);
    const antes = await hermanas();
    check(antes.at(-1) === "Subcategoría de prueba", "queda última entre las subcategorías de Zapatillas");
    await nav.hasta(`!!document.querySelector('[aria-label="Subir Subcategoría de prueba"]')`);
    await nav.evaluar(`document.querySelector('[aria-label="Subir Subcategoría de prueba"]').click()`);
    let despues = antes;
    for (let t = 0; t < 20 && despues.at(-2) !== "Subcategoría de prueba"; t++) {
      await espera(400);
      despues = await hermanas();
    }
    check(despues.at(-2) === "Subcategoría de prueba" && despues.at(-1) === antes.at(-2), "la flecha ↑ la sube un lugar");
    check(
      await nav.evaluar(`document.getElementById("madre-${zapatillas.id}").disabled`),
      "una categoría con subcategorías no se puede poner dentro de otra",
    );
    const nueva = (await db.from("categories").select("id").eq("name", "Subcategoría de prueba").single()).data;
    const { error: dosNiveles } = await db.from("categories").update({ parent_id: nueva.id }).eq("id", botas.id);
    check(dosNiveles?.code === "23514", "la base rechaza subcategorías de una subcategoría");
    await nav.evaluar(`[...document.querySelectorAll("button")].find((b) => b.textContent === "Borrar" && b.closest("div.p-3")?.querySelector('input[name="nombre"]')?.value === "Zapatillas").click()`);
    check(await nav.hasta(`document.body.innerText.includes("Tiene subcategorías")`), "no deja borrar una categoría con subcategorías");
    await nav.evaluar(`[...document.querySelectorAll("button")].find((b) => b.textContent === "Borrar" && b.closest("div.p-3")?.querySelector('input[name="nombre"]')?.value === "Subcategoría de prueba").click()`);
    check(await nav.hasta(`!document.querySelector('[aria-label="Subir Subcategoría de prueba"]')`), "borrar la subcategoría");

    await nav.ir(`/admin/productos/${producto.id}`);
    check(
      await nav.evaluar(`!!document.querySelector('#categoria optgroup[label="Zapatillas"] option[value="${zapatillas.id}"]')`),
      "producto: las subcategorías aparecen agrupadas bajo Zapatillas",
    );
  }

  // --- Logo de marca
  await nav.ir("/admin/marcas");
  const fila = `[...document.querySelectorAll("li")].find((li) => li.querySelector('input[name="nombre"]')?.value === ${JSON.stringify(marca.name)})`;
  await nav.hasta(`!!${fila}?.querySelector("input[type=file]")`);
  const indice = await nav.evaluar(`[...document.querySelectorAll("input[type=file]")].indexOf(${fila}.querySelector("input[type=file]"))`);
  await nav.elegirArchivo(indice, logo);
  let rutaLogo = null;
  for (let t = 0; t < 30 && !rutaLogo; t++) {
    await espera(700);
    rutaLogo = (await db.from("brands").select("logo_path").eq("id", marca.id).single()).data.logo_path;
  }
  check(/^marcas\//.test(rutaLogo ?? ""), `subir el logo de ${marca.name}`);
  await nav.ir("/");
  check(await nav.evaluar(`!!document.querySelector('a[href="/marcas/${marca.slug}"] img')`), "la franja de marcas muestra el logo");

  // --- Precio anterior
  await nav.ir(`/admin/productos/${producto.id}`);
  const enviar = `document.querySelector('[name="precioAnterior"]').form.querySelector("button[type=submit]").click()`;
  await nav.escribir('[name="precioAnterior"]', "1");
  await nav.evaluar(enviar);
  check(await nav.hasta(`document.body.innerText.includes("El precio anterior tiene que ser mayor")`), "precio anterior menor al precio: error claro");
  await nav.escribir('[name="precioAnterior"]', String(Number(producto.price) + 10000));
  await nav.evaluar(enviar);
  check(await nav.hasta(`document.body.innerText.includes("Cambios guardados.")`), "precio anterior válido: se guarda");
  const precio = (await db.from("products").select("compare_at_price").eq("id", producto.id).single()).data.compare_at_price;
  check(Number(precio) === Number(producto.price) + 10000, "queda en la base");
} finally {
  // Dejar todo como estaba: archivos de prueba, portadas, logo, precio y admin.
  const { data: ahora } = await db.from("home_slides").select("image_path, mobile_image_path");
  const { data: tarjetasAhora } = await db.from("home_cards").select("image_path");
  const { data: m } = await db.from("brands").select("logo_path").eq("id", marca.id).single();
  const previos = new Set([
    marca.logo_path,
    ...portadasAntes.flatMap((s) => [s.image_path, s.mobile_image_path]),
    ...tarjetasAntes.map((t) => t.image_path),
  ]);
  const archivos = [
    ...(ahora ?? []).flatMap((s) => [s.image_path, s.mobile_image_path]),
    ...(tarjetasAhora ?? []).map((t) => t.image_path),
    m?.logo_path,
  ].filter((r) => r && !previos.has(r));
  for (const t of tarjetasAntes) {
    await db
      .from("home_cards")
      .update({ title: t.title, subtitle: t.subtitle, image_path: t.image_path, active: t.active })
      .eq("section", t.section);
  }
  // Categorías: se borra la de prueba (si quedó) y vuelven las posiciones y madres de antes.
  await db.from("categories").delete().eq("name", "Subcategoría de prueba");
  for (const c of categoriasAntes) {
    await db.from("categories").update({ parent_id: c.parent_id, position: c.position }).eq("id", c.id);
  }
  for (const s of portadasAntes) {
    await db
      .from("home_slides")
      .update({
        title: s.title, subtitle: s.subtitle, button_text: s.button_text, button_url: s.button_url,
        image_path: s.image_path, mobile_image_path: s.mobile_image_path, active: s.active, position: s.position,
      })
      .eq("id", s.id);
  }
  await db.from("brands").update({ logo_path: marca.logo_path }).eq("id", marca.id);
  await db.from("products").update({ compare_at_price: producto.compare_at_price }).eq("id", producto.id);
  if (archivos.length) await db.storage.from("product-images").remove(archivos);
  // Lo restaurado se escribió directo en la base: guardar el anuncio sin cambios
  // desde el panel refresca la caché de la tienda (si no, el servidor de pruebas
  // seguiría mostrando la portada y el logo de prueba).
  if (nav) {
    await nav.ir("/admin/portada");
    await nav.evaluar(`[...document.querySelectorAll("button")].find((b) => b.textContent === "Guardar anuncio")?.click()`);
    check(await nav.hasta(`document.body.innerText.includes("Anuncio guardado.")`), "al terminar, la tienda vuelve a mostrar lo de antes (caché refrescada)");
    nav.cerrar();
  }
  await borrarAdmin(admin);
  console.log(`\nLimpieza: ${archivos.length} archivos de prueba borrados; portadas, tarjetas, categorías, logo y precio restaurados; admin temporal borrado.`);
  terminar("Panel en el navegador");
}
