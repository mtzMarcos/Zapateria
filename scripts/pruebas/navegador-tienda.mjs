// Tienda en un navegador de verdad (Edge sin pantalla, con JavaScript): celular,
// carrito, filtros, buscador, arrepentimiento, transiciones y "reducir movimiento".
// Si no hay Edge ni Chrome instalado, se omite.
import { abrirNavegador, borrarPedidos, check, crearPedido, espera, rutaNavegador, talle, terminar } from "./utilidades.mjs";

if (!rutaNavegador()) {
  console.log("Sin Edge ni Chrome: prueba omitida.");
  process.exit(0);
}

const creados = [];
let nav;
try {
  // --- Celular
  nav = await abrirNavegador({ ancho: 390 });
  for (const ruta of ["/", "/productos", "/outlet", "/productos/ejemplo-nike-air-max-90", "/carrito", "/checkout", "/terminos"]) {
    await nav.ir(ruta, 2500);
    const ancho = await nav.evaluar("document.documentElement.scrollWidth");
    check(ancho === 390, `celular ${ruta}: no se desborda de costado (${ancho}px)`);
  }

  await nav.ir("/productos/ejemplo-nike-air-max-90");
  const boton = `[...document.querySelectorAll("form button")].find((b) => /talle|carrito|Agregando/i.test(b.textContent) && !b.getAttribute("aria-label"))`;
  await nav.evaluar(`${boton}.click()`);
  check(await nav.hasta(`document.querySelector("legend").textContent.includes("Elegí un talle para continuar")`, 3000), "producto sin talle elegido: el botón pide elegir uno");
  check(await nav.evaluar(`(() => { const b = ${boton}.closest("div.fixed").getBoundingClientRect(); return Math.round(b.bottom) === innerHeight; })()`), "barra de compra fija abajo");
  await nav.evaluar(`[...document.querySelectorAll("button[aria-pressed]")].find((b) => b.textContent === "40").click()`);
  await espera(300);
  await nav.evaluar(`${boton}.click()`);
  check(await nav.hasta(`document.querySelector("[aria-live]")?.textContent.includes("Agregado al carrito (talle 40)")`), "agrega al carrito con JavaScript");
  check(await nav.hasta(`document.querySelector('a[href="/carrito"]').textContent.includes("1 producto")`), "el ícono del carrito se actualiza");

  await nav.ir("/productos?talle=40");
  await nav.evaluar(`[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Filtrar")).click()`);
  check(await nav.hasta(`document.querySelector("dialog").open`, 3000), "abre el panel de filtros");
  await nav.evaluar(`[...document.querySelectorAll("dialog a")].find((a) => a.textContent === "Botas").click()`);
  check(await nav.hasta(`location.search.includes("categoria=botas") && !document.querySelector("dialog").open`), "elegir un filtro navega y cierra el panel");
  check(await nav.evaluar(`[...document.querySelectorAll('ul[aria-label="Filtros aplicados"] a')].map((a) => a.textContent).join(",") === "Botas,Talle 40"`), "muestra los filtros aplicados como chips");

  await nav.ir("/");
  await nav.evaluar(`document.querySelector('button[aria-label="Buscar productos"]').click()`);
  await espera(300);
  await nav.escribir("[role=dialog] input", "nike");
  check(await nav.hasta(`document.querySelectorAll("[role=dialog] li a").length > 0`, 5000), "buscador del celular: sugerencias mientras se escribe");

  // Botón de arrepentimiento con JavaScript.
  const pedido = await crearPedido({ variante: await talle("ejemplo-topper-rock", "40"), status: "delivered", email: "navegador@ejemplo.com" });
  creados.push(pedido.id);
  await nav.ir("/arrepentimiento");
  await nav.escribir("#pedido", "abc");
  await nav.escribir("#email", "no-es-email");
  await nav.evaluar(`document.querySelector("form button[type=submit]").click()`);
  check(await nav.hasta(`document.body.innerText.includes("Revisá el número de pedido y el email")`), "arrepentimiento: muestra el error");
  check(await nav.evaluar(`document.querySelector("#pedido").value === "abc"`), "arrepentimiento: conserva lo escrito");
  await nav.escribir("#pedido", `#${pedido.order_number}`);
  await nav.escribir("#email", "Navegador@Ejemplo.com");
  await nav.evaluar(`document.querySelector("form button[type=submit]").click()`);
  check(await nav.hasta(`/ARR-${pedido.order_number}-[A-Z0-9]{4}/.test(document.querySelector("[role=status]")?.innerText ?? "")`), "arrepentimiento: muestra el código de solicitud");
  nav.cerrar();

  // --- Compu: buscador y transición de la tarjeta al producto
  nav = await abrirNavegador({ ancho: 1280 });
  await nav.cdp("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__transiciones = []; const orig = document.startViewTransition?.bind(document);
      if (orig) document.startViewTransition = (a) => { const t = orig(a); t.ready.then(() => window.__transiciones.push(document.getAnimations().map((x) => (x.effect?.pseudoElement ?? "") + " " + x.effect?.getTiming().duration))).catch(() => {}); return t; };`,
  });
  await nav.ir("/");
  await nav.evaluar(`document.querySelector("form[role=search] input").focus()`);
  await nav.escribir("form[role=search] input", "adi");
  check(await nav.hasta(`document.querySelectorAll("form[role=search] li a").length > 0`, 5000), "buscador de la compu: sugerencias debajo del campo");
  const card = `document.querySelector('a[href="/productos/ejemplo-nike-air-max-90"]')`;
  check(await nav.evaluar(`${card}.querySelectorAll("img").length === 2`), "tarjeta con segunda foto para pasar el mouse");
  await nav.evaluar(`${card}.click()`);
  check(await nav.hasta(`location.pathname === "/productos/ejemplo-nike-air-max-90" && window.__transiciones.length > 0`), "navegar de la tarjeta al producto inicia una transición");
  const anims = (await nav.evaluar("window.__transiciones[0]")) ?? [];
  check(anims.some((a) => /::view-transition-group\(foto-/.test(a)), "la foto de la tarjeta viaja hasta la del producto");
  check(anims.some((a) => /::view-transition-new\(.*\) 200$/.test(a)), "la página nueva aparece con un fundido corto");
  nav.cerrar();

  // --- "Reducir movimiento": sin animaciones
  nav = await abrirNavegador({ ancho: 1280, reducir: true });
  await nav.ir("/productos");
  check(await nav.evaluar(`getComputedStyle(document.querySelector("li.aparecer")).animationName === "none"`), "reducir movimiento: sin aparición al hacer scroll");
  check(await nav.evaluar(`parseFloat(getComputedStyle(document.querySelector("li.aparecer img")).transitionDuration) < 0.01`), "reducir movimiento: sin zoom animado");
  nav.cerrar();
  nav = null;
} finally {
  nav?.cerrar();
  await borrarPedidos(creados);
  terminar("Tienda en el navegador");
}
