// Utilidades de las pruebas automáticas (ver scripts/pruebas/correr.mjs).
//
// Las pruebas corren contra un servidor de producción local (npm run build)
// en el puerto 3124 y contra la base de Supabase de .env.local. Todo lo que
// crean (pedidos, admins, archivos) lo borran al terminar, y el stock que
// tocan lo dejan como estaba. Los pedidos reales no se tocan.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(join(process.cwd(), "/"));
const { createClient } = require("@supabase/supabase-js");

export const BASE = process.env.PRUEBAS_URL ?? "http://localhost:3124";
/** Clave del webhook con la que corre el servidor de pruebas (correr.mjs). */
export const SECRETO_WEBHOOK = "clave-de-prueba";

/** Cliente con la clave secreta (saltea RLS): para preparar y revisar datos. */
export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
/** Cliente con la clave pública: para comprobar lo que NO puede hacer el público. */
export const publico = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Comprobaciones ----------------------------------------------------------

let fallas = 0;
let total = 0;

export function check(condicion, mensaje) {
  total++;
  if (!condicion) fallas++;
  console.log(`${condicion ? "OK  " : "FALLA"} ${mensaje}`);
}

/** Imprime el resultado y deja el código de salida (1 si algo falló). */
export function terminar(nombre) {
  console.log(`\n${nombre}: ${total - fallas}/${total} OK${fallas ? ` · ${fallas} FALLAS` : ""}`);
  process.exitCode = fallas ? 1 : 0;
}

/** Quita los <!-- --> que React mete entre textos, para poder buscar frases. */
export const limpio = (html) => html.replace(/<!-- -->/g, "");

// --- Cliente HTTP con cookies --------------------------------------------------

/** Un "navegador sin JavaScript": guarda cookies y envía formularios con sus campos ocultos. */
export function nuevoCliente() {
  const jar = new Map();
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const guardar = (res) => {
    for (const c of res.headers.getSetCookie()) {
      const [par, ...attrs] = c.split(";");
      const i = par.indexOf("=");
      const [k, v] = [par.slice(0, i).trim(), par.slice(i + 1)];
      if (!v || attrs.some((a) => /max-age=0/i.test(a) || /expires=Thu, 01 Jan 1970/i.test(a))) jar.delete(k);
      else jar.set(k, v);
    }
  };
  const respuesta = async (res) => ({
    status: res.status,
    location: res.headers.get("location"),
    html: limpio(await res.text()),
  });

  return {
    jar,
    async get(ruta) {
      const res = await fetch(BASE + ruta, { headers: { cookie: cookie() }, redirect: "manual" });
      guardar(res);
      return respuesta(res);
    },
    /** Envía un formulario (de formularios()) con campos extra, como lo haría el navegador. */
    async enviar(ruta, form, campos = {}) {
      const fd = new FormData();
      for (const [k, v] of form.ocultos) fd.append(k, v);
      for (const [k, v] of Object.entries(campos)) fd.append(k, v);
      const res = await fetch(BASE + ruta, {
        method: "POST",
        body: fd,
        headers: { cookie: cookie(), origin: BASE },
        redirect: "manual",
      });
      guardar(res);
      return respuesta(res);
    },
  };
}

const desescapar = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Formularios con Server Action de una página: su HTML y sus campos ocultos ($ACTION…). */
export function formularios(html) {
  return [...html.matchAll(/<form[\s\S]*?<\/form>/g)]
    .map((m) => m[0])
    .filter((f) => f.includes("$ACTION"))
    .map((f) => ({
      html: f,
      ocultos: [...f.matchAll(/<input[^>]*type="hidden"[^>]*>/g)]
        .map((i) => i[0])
        .filter((i) => /name="\$ACTION/.test(i))
        .map((i) => [desescapar(i.match(/name="([^"]*)"/)[1]), desescapar(i.match(/value="([^"]*)"/)?.[1] ?? "")]),
    }));
}

/** El primer formulario cuyo HTML contiene `texto`. */
export function formularioCon(html, texto) {
  const form = formularios(html).find((f) => f.html.includes(texto));
  if (!form) throw new Error(`No se encontró un formulario con "${texto}"`);
  return form;
}

/** Cookie "carrito" con estas líneas [{ v: idDelTalle, q: cantidad }]. */
export const cookieCarrito = (lineas) => encodeURIComponent(JSON.stringify(lineas));

// --- Datos de prueba -----------------------------------------------------------

/** Un talle de un producto de ejemplo, con su producto. */
export async function talle(slug, size) {
  const { data, error } = await db
    .from("product_variants")
    .select("id, stock, size, products!inner(id, name, price, slug)")
    .eq("products.slug", slug)
    .eq("size", size)
    .single();
  if (error) throw new Error(`Falta el talle ${size} de ${slug} (¿están cargados los datos de ejemplo?): ${error.message}`);
  return data;
}

export async function stockDe(varianteId) {
  return (await db.from("product_variants").select("stock").eq("id", varianteId).single()).data.stock;
}

/** Crea un pedido directo en la base (sin pasar por el checkout). Devuelve { id, order_number }. */
export async function crearPedido({ variante, status = "paid", cantidad = 1, entrega = "shipping", email = "prueba@ejemplo.com", nombre = "Prueba Automática", extra = {} }) {
  const precio = Number(variante.products.price);
  const envio = entrega === "shipping";
  const { data, error } = await db
    .from("orders")
    .insert({
      customer_name: nombre,
      customer_email: email,
      customer_phone: "11 2345-6789",
      delivery_method: entrega,
      status,
      ...(envio && {
        shipping_zone_name: "CABA",
        address_street: "Calle de Prueba",
        address_number: "123",
        address_city: "CABA",
        address_province: "Ciudad Autónoma de Buenos Aires",
        address_postal_code: "1425",
      }),
      subtotal: precio * cantidad,
      shipping_cost: envio ? 6000 : 0,
      total: precio * cantidad + (envio ? 6000 : 0),
      ...(!["pending_payment", "payment_rejected"].includes(status) && {
        mp_payment_id: `prueba-${crypto.randomUUID()}`,
        paid_at: new Date().toISOString(),
      }),
      ...extra,
    })
    .select("id, order_number")
    .single();
  if (error) throw error;
  const { error: errorItems } = await db.from("order_items").insert({
    order_id: data.id,
    product_id: variante.products.id,
    variant_id: variante.id,
    product_name: variante.products.name,
    size: variante.size,
    unit_price: precio,
    quantity: cantidad,
  });
  if (errorItems) throw errorItems;
  return data;
}

export async function borrarPedidos(ids) {
  if (ids.length) await db.from("orders").delete().in("id", ids);
}

/** Admin temporal (se borra con borrarAdmin). */
export async function crearAdmin() {
  const email = `prueba-${Date.now()}-${Math.round(Math.random() * 1e6)}@ejemplo.com`;
  const password = crypto.randomUUID();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  await db.from("admins").insert({ user_id: data.user.id });
  return { id: data.user.id, email, password };
}

export async function borrarAdmin(admin) {
  if (admin) await db.auth.admin.deleteUser(admin.id); // la fila de admins se borra sola (cascade)
}

/** Inicia sesión en el panel con un cliente de nuevoCliente(). */
export async function login(cliente, admin) {
  const form = formularios((await cliente.get("/admin/login")).html)[0];
  return cliente.enviar("/admin/login", form, { email: admin.email, password: admin.password });
}

// --- Navegador (Edge) ------------------------------------------------------------

const RUTAS_EDGE = [
  process.env.EDGE,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

/** Ruta de Edge/Chrome, o null si no hay (las pruebas con navegador se omiten). */
export const rutaNavegador = () => RUTAS_EDGE.find((r) => existsSync(r)) ?? null;

/**
 * Abre Edge sin pantalla y devuelve helpers por DevTools Protocol.
 * Simula "sin preferencia de movimiento" salvo que se pida `reducir`.
 */
export async function abrirNavegador({ ancho = 1280, alto = 900, reducir = false, puerto = 9400 + Math.round(Math.random() * 500) } = {}) {
  const navegador = spawn(rutaNavegador(), [
    "--headless=new",
    `--remote-debugging-port=${puerto}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "pruebas-edge-"))}`,
    "--no-first-run",
    "about:blank",
  ]);
  let info;
  for (let i = 0; i < 75 && !info; i++) {
    await espera(200);
    info = await fetch(`http://127.0.0.1:${puerto}/json/list`).then((r) => r.json()).catch(() => null);
  }
  const ws = new WebSocket(info.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pendientes = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pendientes.has(m.id)) pendientes.get(m.id)(m);
  });
  const cdp = (method, params = {}) =>
    new Promise((res) => {
      pendientes.set(++id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluar = async (expr) =>
    (await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.result?.value;
  const movil = ancho < 700;
  await cdp("Page.enable");
  await cdp("DOM.enable");
  // Sin pantalla la ventana no tiene el foco y los campos no reciben eventos de foco.
  await cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
  await cdp("Emulation.setDeviceMetricsOverride", { width: ancho, height: alto, deviceScaleFactor: 1, mobile: movil });
  if (movil) await cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await cdp("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: reducir ? "reduce" : "no-preference" },
      { name: "hover", value: movil ? "none" : "hover" },
      { name: "pointer", value: movil ? "coarse" : "fine" },
    ],
  });

  return {
    cdp,
    evaluar,
    async ir(ruta, ms = 3000) {
      await cdp("Page.navigate", { url: BASE + ruta });
      await espera(ms);
    },
    /** Espera hasta que la expresión dé verdadero (o se acabe el tiempo). */
    async hasta(expr, ms = 15000) {
      for (let t = 0; t < ms; t += 250) {
        if (await evaluar(expr)) return true;
        await espera(250);
      }
      return false;
    },
    /** Escribe en un campo como lo haría una persona (React se entera del cambio). */
    escribir(selector, valor) {
      return evaluar(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set.call(el, ${JSON.stringify(valor)});
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      })()`);
    },
    /** Elige un archivo en el input[type=file] número `indice` de la página. */
    async elegirArchivo(indice, archivo) {
      const { root } = (await cdp("DOM.getDocument", { depth: -1, pierce: true })).result;
      const { nodeIds } = (await cdp("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "input[type=file]" })).result;
      await cdp("DOM.setFileInputFiles", { nodeId: nodeIds[indice], files: [archivo] });
    },
    cerrar() {
      ws.close();
      navegador.kill();
    },
  };
}
