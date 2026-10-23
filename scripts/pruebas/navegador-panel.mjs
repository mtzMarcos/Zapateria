// Panel en un navegador de verdad con un admin temporal: portada (foto, textos y
// link), logo de marca y precio anterior. Al terminar deja todo como estaba.
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
const logo = join(carpeta, "logo.png");
await sharp(svg(1920, 800, "PORTADA DE PRUEBA", "#cbd5e1")).jpeg().toFile(fotoPortada);
await sharp(svg(400, 200, "LOGO", "#ffffff")).png().toFile(logo);

const { data: portadasAntes } = await db.from("home_slides").select("*").order("position");
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
  nav?.cerrar();
  // Dejar todo como estaba: archivos de prueba, portadas, logo, precio y admin.
  const { data: ahora } = await db.from("home_slides").select("image_path, mobile_image_path");
  const { data: m } = await db.from("brands").select("logo_path").eq("id", marca.id).single();
  const previos = new Set([marca.logo_path, ...portadasAntes.flatMap((s) => [s.image_path, s.mobile_image_path])]);
  const archivos = [...(ahora ?? []).flatMap((s) => [s.image_path, s.mobile_image_path]), m?.logo_path].filter((r) => r && !previos.has(r));
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
  await borrarAdmin(admin);
  console.log(`\nLimpieza: ${archivos.length} archivos de prueba borrados; portadas, logo y precio restaurados; admin temporal borrado.`);
  terminar("Panel en el navegador");
}
