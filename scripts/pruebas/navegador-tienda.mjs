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

  // Pie: secciones plegables y el botón de arrepentimiento siempre a la vista.
  await nav.ir("/");
  check(
    await nav.evaluar(`(() => { const f = document.querySelector("footer"); const a = f.querySelector('a[href="/arrepentimiento"]'); return f.querySelectorAll("details").length === 3 && a.checkVisibility() && !a.closest("details"); })()`),
    "pie en el celular: 3 secciones plegables y el botón de arrepentimiento a la vista",
  );

  await nav.ir("/productos/ejemplo-nike-air-max-90");
  // Galería: fundido cruzado al cambiar de foto (deslizar o puntitos).
  const diapositivas = `[...document.querySelector('[aria-roledescription="galería"]').querySelectorAll(":scope > div.col-start-1")]`;
  check(await nav.evaluar(`getComputedStyle(${diapositivas}[1]).transitionDuration === "0.5s"`), "galería: las fotos cambian con un fundido (500 ms)");
  await nav.evaluar(`document.querySelector('[aria-label="Ver foto 2"]').click()`);
  check(await nav.hasta(`${diapositivas}[1].getAttribute("aria-hidden") === "false" && ${diapositivas}[0].getAttribute("aria-hidden") === "true"`, 3000), "galería: los puntitos cambian de foto");
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
  check(await nav.evaluar(`${card}.querySelectorAll("img").length === 1`), "tarjeta: una sola foto (sin cambio al pasar el mouse)");
  // Zoom al pasar el mouse: animado (no de golpe), también en las fotos con fundido de carga.
  await nav.evaluar("window.scrollTo(0, document.body.scrollHeight)");
  await espera(1500);
  const fotoAbajo = `[...document.querySelectorAll("li.subir img")].at(-1)`;
  await nav.evaluar(`${fotoAbajo}.scrollIntoView({ block: "center" })`);
  await espera(600);
  const centro = await nav.evaluar(`(() => { const b = ${fotoAbajo}.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  await nav.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: centro.x, y: centro.y });
  await espera(150);
  const aMitad = await nav.evaluar(`parseFloat(getComputedStyle(${fotoAbajo}).scale)`);
  await espera(700);
  const alFinal = await nav.evaluar(`parseFloat(getComputedStyle(${fotoAbajo}).scale)`);
  check(aMitad > 1 && aMitad < 1.05 && alFinal === 1.05, `zoom al pasar el mouse: animado hasta 5 % (${aMitad.toFixed(3)} → ${alFinal})`);
  await nav.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
  await nav.evaluar("window.scrollTo(0, 0)");
  // Carrusel de la portada: fundido cruzado.
  const portadas = `[...document.querySelectorAll('[aria-roledescription="diapositiva"]')]`;
  if (await nav.evaluar(`${portadas}.length > 1`)) {
    // La que se ve justo antes del clic (el carrusel pasa solo cada 6 segundos).
    const antes = await nav.evaluar(`(() => { document.querySelector('[aria-label="Portada siguiente"]').click(); return ${portadas}.findIndex((p) => p.getAttribute("aria-hidden") === "false"); })()`);
    const total = await nav.evaluar(`${portadas}.length`);
    const siguiente = (antes + 1) % total;
    check(await nav.hasta(`${portadas}[${siguiente}].getAttribute("aria-hidden") === "false"`, 3000), "carrusel: la flecha pasa a la portada siguiente");
    check(await nav.evaluar(`getComputedStyle(${portadas}[${siguiente}]).transitionDuration === "0.7s" && ${portadas}[${antes}].inert`), "carrusel: fundido cruzado (700 ms) y la portada oculta no recibe clics");
  }
  await nav.evaluar(`${card}.click()`);
  check(await nav.hasta(`location.pathname === "/productos/ejemplo-nike-air-max-90" && window.__transiciones.length > 0`), "navegar de la tarjeta al producto inicia una transición");
  const anims = (await nav.evaluar("window.__transiciones[0]")) ?? [];
  check(anims.some((a) => /::view-transition-group\(foto-/.test(a)), "la foto de la tarjeta viaja hasta la del producto");
  check(anims.some((a) => /::view-transition-new\(.*\) 200$/.test(a)), "la página nueva aparece con un fundido corto");
  nav.cerrar();

  // --- Fundido de las fotos al cargar: se aplica a las que todavía no cargaron cuando
  // arranca el JavaScript. Para probarlo siempre igual, el navegador retiene las fotos
  // de productos hasta que la página arrancó y recién ahí las deja cargar.
  nav = await abrirNavegador({ ancho: 1280 });
  const retenidas = [];
  nav.al("Fetch.requestPaused", (p) => retenidas.push(p.requestId));
  await nav.cdp("Fetch.enable", { patterns: [{ urlPattern: "*/_next/image*", requestStage: "Request" }] });
  await nav.ir("/productos", 3500);
  const fotoCard = `document.querySelector("li.subir img")`;
  check(
    await nav.evaluar(`${fotoCard}.classList.contains("foto-suave") && !${fotoCard}.hasAttribute("data-cargada") && getComputedStyle(${fotoCard}).opacity === "0"`),
    "foto que todavía no cargó: espera oculta",
  );
  for (const id of retenidas.splice(0)) await nav.cdp("Fetch.continueRequest", { requestId: id });
  await nav.cdp("Fetch.disable");
  check(await nav.hasta(`${fotoCard}.hasAttribute("data-cargada")`, 8000), "al cargar, la foto aparece");
  check(await nav.evaluar(`getComputedStyle(${fotoCard}).transitionDuration.split(",")[0].trim() === "0.4s"`), "con un fundido de 400 ms");
  nav.cerrar();

  // --- "Reducir movimiento": sin animaciones
  nav = await abrirNavegador({ ancho: 1280, reducir: true });
  await nav.ir("/productos");
  check(await nav.evaluar(`getComputedStyle(document.querySelector("li.subir")).animationName === "none"`), "reducir movimiento: sin aparición al hacer scroll");
  check(await nav.evaluar(`parseFloat(getComputedStyle(document.querySelector("li.subir img")).transitionDuration) < 0.01`), "reducir movimiento: sin zoom ni fundido de fotos");
  await nav.ir("/productos/ejemplo-nike-air-max-90");
  check(await nav.evaluar(`parseFloat(getComputedStyle(document.querySelector('[aria-roledescription="galería"] > div.col-start-1')).transitionDuration) < 0.01`), "reducir movimiento: la galería cambia sin fundido");
  nav.cerrar();
  nav = null;
} finally {
  nav?.cerrar();
  await borrarPedidos(creados);
  terminar("Tienda en el navegador");
}
