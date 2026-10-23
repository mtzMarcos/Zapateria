// Pago con Mercado Pago: cobro, página del pedido según el estado, vuelta del
// comprador y webhook (firma). No hace pagos reales: los pagos aprobados por API
// no se pueden simular con estas credenciales (ver PROGRESO.md); confirmar_pago
// se prueba aparte en sql.mjs.
import { createHmac } from "node:crypto";
import {
  BASE,
  SECRETO_WEBHOOK,
  borrarPedidos,
  check,
  crearPedido,
  db,
  formularioCon,
  nuevoCliente,
  talle,
  terminar,
} from "./utilidades.mjs";

const creados = [];
const rock = await talle("ejemplo-topper-rock", "40");

/** Firma un aviso como lo hace Mercado Pago (manifiesto id;request-id;ts). */
function firma(dataId, requestId, secreto = SECRETO_WEBHOOK) {
  const ts = String(Math.floor(Date.now() / 1000));
  let manifiesto = dataId ? `id:${dataId};` : "";
  manifiesto += `request-id:${requestId};ts:${ts};`;
  return `ts=${ts},v1=${createHmac("sha256", secreto).update(manifiesto).digest("hex")}`;
}
async function aviso(query, cabeceras = {}) {
  const res = await fetch(`${BASE}/api/mercadopago/webhook?${query}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...cabeceras },
    body: "{}",
  });
  return res.status;
}

try {
  const c = nuevoCliente();
  const pedido = await crearPedido({ variante: rock, status: "pending_payment", cantidad: 2 });
  creados.push(pedido.id);

  // --- Cobro en Mercado Pago desde la página del pedido
  let pagina = await c.get(`/pedido/${pedido.id}`);
  check(pagina.html.includes("Falta el pago") && pagina.html.includes("Pagar con Mercado Pago"), "pedido sin pagar: botón para pagar");
  const r = await c.enviar(`/pedido/${pedido.id}`, formularioCon(pagina.html, "Pagar con Mercado Pago"));
  check(r.status === 303 && /mercadopago\.com/.test(r.location ?? ""), `lleva a pagar a Mercado Pago (${r.status})`);
  const { data: conCobro } = await db.from("orders").select("mp_preference_id, total").eq("id", pedido.id).single();
  check(!!conCobro.mp_preference_id, "guarda el id del cobro");
  const pref = await fetch(`https://api.mercadopago.com/checkout/preferences/${conCobro.mp_preference_id}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  }).then((res) => res.json());
  const totalCobro = pref.items.reduce((t, i) => t + i.unit_price * i.quantity, 0);
  check(totalCobro === Number(conCobro.total), `el cobro tiene el total del pedido con el envío (${totalCobro})`);
  check(pref.external_reference === pedido.id, "el cobro lleva el id del pedido (external_reference)");
  check(!pref.notification_url, "el cobro no manda notification_url (los avisos van al webhook del panel)");

  // --- "Ya pagué" sin pagos
  pagina = await c.get(`/pedido/${pedido.id}`);
  const yaPague = await c.enviar(`/pedido/${pedido.id}`, formularioCon(pagina.html, "Ya pagué"));
  check(yaPague.html.includes("Todavía no vemos ningún pago aprobado"), "“Ya pagué” sin pagos: lo avisa");

  // --- Vuelta del comprador desde Mercado Pago
  const vuelta = (q) => fetch(`${BASE}/api/mercadopago/retorno?${q}`, { redirect: "manual" });
  let v = await vuelta(`pedido=${pedido.id}&payment_id=1&status=approved`);
  check(v.status === 307 && v.headers.get("location")?.endsWith(`/pedido/${pedido.id}`), "vuelta: lleva a la página del pedido");
  v = await vuelta(`pedido=${pedido.id}&payment_id=1&status=in_process`);
  check(v.headers.get("location")?.endsWith("?pago=pendiente"), "vuelta con pago pendiente: lo indica");
  v = await vuelta("pedido=abc");
  check(v.status === 307 && new URL(v.headers.get("location"), BASE).pathname === "/", "vuelta con un pedido inválido: va al inicio");
  pagina = await c.get(`/pedido/${pedido.id}?pago=pendiente`);
  check(pagina.html.includes("Tu pago se está procesando"), "página del pedido: pago en proceso");

  // --- La página según el estado
  const textos = {
    payment_rejected: ["El pago no se aprobó", "Intentar de nuevo"],
    paid: ["¡Gracias, Prueba!", "Recibimos el pago"],
    stock_issue: ["Recibimos tu pago", "otra persona compró la última unidad"],
  };
  for (const [estado, esperados] of Object.entries(textos)) {
    await db.from("orders").update({ status: estado }).eq("id", pedido.id);
    pagina = await c.get(`/pedido/${pedido.id}`);
    check(esperados.every((t) => pagina.html.includes(t)), `página del pedido ${estado}: ${esperados.join(" / ")}`);
  }
  check((await c.get("/pedido/no-es-un-id")).html.includes("NEXT_HTTP_ERROR_FALLBACK;404"), "id de pedido inválido: no encontrado");

  // --- Webhook
  check((await aviso("type=merchant_order&data.id=1")) === 200, "webhook: otros avisos se ignoran (200)");
  check((await aviso("type=payment&data.id=123")) === 401, "webhook sin firma: 401");
  check((await aviso("type=payment&data.id=123", { "x-signature": firma("123", "r1", "otra-clave"), "x-request-id": "r1" })) === 401, "webhook con firma de otra clave: 401");
  check((await aviso("type=payment&data.id=12a", { "x-signature": firma("12a", "r2"), "x-request-id": "r2" })) === 400, "webhook con id inválido: 400");
  check((await aviso("type=payment&data.id=999", { "x-signature": firma("999", "r3"), "x-request-id": "r3" })) === 500, "webhook firmado bien: consulta el pago (no existe → 500, Mercado Pago reintenta)");
  check((await aviso("topic=payment&id=999", { "x-signature": firma(null, "r4"), "x-request-id": "r4" })) === 500, "formato viejo (?id=&topic=) firmado sin data.id: la firma vale");
} finally {
  await borrarPedidos(creados);
  console.log(`\nLimpieza: ${creados.length} pedidos de prueba borrados.`);
  terminar("Pago");
}
