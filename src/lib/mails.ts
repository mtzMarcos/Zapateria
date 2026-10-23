import "server-only";
import { faltaCompletar, tienda } from "@/config/tienda";
import { formatearPrecio } from "@/lib/formato";
import { urlSitio } from "@/lib/sitio";
import { createServiceClient } from "@/lib/supabase/service";

// Mails automáticos con Resend (resend.com), usando su API REST.
//
// - Pago confirmado: confirmación al comprador (con el link a su pedido) y
//   aviso de pedido nuevo al dueño.
// - Botón de arrepentimiento: el código de solicitud al comprador (la norma
//   pide mandárselo) y aviso al dueño.
//
// Variables de entorno (ver .env.example):
//   RESEND_API_KEY   sin ella no se manda nada (la tienda funciona igual).
//   MAIL_REMITENTE   "Nombre <direccion@dominio>". Mientras no haya dominio
//                    propio, Resend solo deja usar onboarding@resend.dev y solo
//                    entrega a la dirección de la cuenta de Resend.
//   MAIL_AVISOS      email(s) del dueño para los avisos, separados por coma.
//
// Si un mail falla, no se corta lo que se estaba haciendo (el pago ya quedó
// confirmado): se anota en el log y el aviso del pago se reintenta la próxima
// vez que se procese ese pago.

const API = "https://api.resend.com/emails";

/** true si los mails están configurados (hay RESEND_API_KEY). */
export function mailsActivos() {
  return Boolean(process.env.RESEND_API_KEY);
}

type Mail = {
  para: string[];
  asunto: string;
  html: string;
  texto: string;
  responderA?: string;
  // Resend no repite un envío con la misma clave (por 24 h).
  idempotencia: string;
};

async function enviar(mail: Mail) {
  const remitente = process.env.MAIL_REMITENTE || `${tienda.nombre} <onboarding@resend.dev>`;
  const res = await fetch(API, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": mail.idempotencia,
    },
    body: JSON.stringify({
      from: remitente,
      to: mail.para,
      subject: mail.asunto,
      html: mail.html,
      text: mail.texto,
      reply_to: mail.responderA,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status} al mandar "${mail.asunto}": ${await res.text()}`);
  }
}

function emailsDueno() {
  return (process.env.MAIL_AVISOS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Email de contacto de la tienda para que el comprador responda, si ya está cargado. */
function contactoTienda() {
  return faltaCompletar(tienda.contacto.email) ? undefined : tienda.contacto.email;
}

// --- Plantilla -------------------------------------------------------------

/** Escapa los textos que vienen del comprador (nombre, dirección, comentarios). */
function esc(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function boton(texto: string, url: string) {
  return `<p style="margin:24px 0"><a href="${esc(url)}" style="background:#171717;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">${esc(texto)}</a></p>`;
}

/** Envoltorio común: los clientes de mail necesitan estilos en línea y tablas simples. */
function plantilla(titulo: string, cuerpo: string) {
  const sitio = urlSitio();
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(titulo)}</title></head>
<body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#171717">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-size:20px;font-weight:700"><a href="${esc(sitio)}" style="color:#171717;text-decoration:none">${esc(tienda.nombre)}</a></p>
<h1 style="margin:0 0 16px;font-size:22px">${esc(titulo)}</h1>
${cuerpo}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#666666">${esc(tienda.nombre)} · <a href="${esc(sitio)}" style="color:#666666">${esc(sitio.replace(/^https?:\/\//, ""))}</a></p>
</td></tr></table>
</body></html>`;
}

const parrafo = (html: string) => `<p style="margin:0 0 12px;line-height:1.5">${html}</p>`;

// --- Datos del pedido ------------------------------------------------------

type PedidoMail = {
  id: string;
  order_number: number;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: string;
  shipping_zone_name: string | null;
  address_street: string | null;
  address_number: string | null;
  address_apartment: string | null;
  address_city: string | null;
  address_province: string | null;
  address_postal_code: string | null;
  address_notes: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  withdrawal_code: string | null;
  withdrawal_requested_at: string | null;
  withdrawal_reason: string | null;
  order_items: { product_name: string; size: string; unit_price: number; quantity: number }[];
};

async function leerPedido(pedidoId: string) {
  const { data, error } = await createServiceClient()
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, customer_phone, delivery_method, shipping_zone_name, address_street, address_number, address_apartment, address_city, address_province, address_postal_code, address_notes, subtotal, shipping_cost, total, withdrawal_code, withdrawal_requested_at, withdrawal_reason, order_items(product_name, size, unit_price, quantity)",
    )
    .eq("id", pedidoId)
    .single();
  if (error) throw new Error(`No se pudo leer el pedido para el mail: ${error.message}`);
  return data as PedidoMail;
}

function lineasDireccion(p: PedidoMail) {
  if (p.delivery_method !== "shipping") {
    return [`Retiro en el local: ${tienda.retiro.direccion}`, tienda.retiro.horarios];
  }
  return [
    `Envío a domicilio (${p.shipping_zone_name ?? ""})`,
    `${p.address_street} ${p.address_number}${p.address_apartment ? `, ${p.address_apartment}` : ""}`,
    `${p.address_city}, ${p.address_province} (CP ${p.address_postal_code})`,
    ...(p.address_notes ? [`Indicaciones: ${p.address_notes}`] : []),
  ];
}

function detalleHtml(p: PedidoMail) {
  const fila = (izq: string, der: string, negrita = false) =>
    `<tr><td style="padding:6px 0;${negrita ? "font-weight:700;" : ""}">${izq}</td><td align="right" style="padding:6px 0;white-space:nowrap;${negrita ? "font-weight:700;" : ""}">${der}</td></tr>`;
  const items = p.order_items
    .map((i) =>
      fila(
        `${esc(i.product_name)}<br><span style="color:#666666;font-size:13px">Talle ${esc(i.size)} · ${i.quantity} × ${formatearPrecio(Number(i.unit_price))}</span>`,
        formatearPrecio(Number(i.unit_price) * i.quantity),
      ),
    )
    .join("");
  const envio = Number(p.shipping_cost) === 0 ? "Sin costo" : formatearPrecio(Number(p.shipping_cost));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;margin:16px 0;font-size:14px">
${items}
${fila("Envío", envio)}
${fila("Total", formatearPrecio(Number(p.total)), true)}
</table>
${parrafo(lineasDireccion(p).map(esc).join("<br>"))}`;
}

function detalleTexto(p: PedidoMail) {
  return [
    ...p.order_items.map(
      (i) => `- ${i.product_name}, talle ${i.size}: ${i.quantity} × ${formatearPrecio(Number(i.unit_price))}`,
    ),
    `Envío: ${Number(p.shipping_cost) === 0 ? "sin costo" : formatearPrecio(Number(p.shipping_cost))}`,
    `Total: ${formatearPrecio(Number(p.total))}`,
    "",
    ...lineasDireccion(p),
  ].join("\n");
}

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "long",
    timeStyle: "short",
  });

// --- Pago confirmado -------------------------------------------------------

function mailsPago(p: PedidoMail): Mail[] {
  const sinStock = p.status === "stock_issue";
  const urlPedido = `${urlSitio()}/pedido/${p.id}`;
  const entrega = p.delivery_method === "shipping" ? "el envío" : "el retiro";

  const avisoComprador = sinStock
    ? `Recibimos el pago de tu pedido #${p.order_number}, pero mientras pagabas otra persona compró la última unidad de un producto. Te vamos a contactar para ofrecerte un cambio o devolverte el dinero.`
    : `Recibimos el pago de tu pedido #${p.order_number}. Te vamos a contactar para coordinar ${entrega}.`;

  const comprador: Mail = {
    para: [p.customer_email],
    asunto: `Recibimos tu pago: pedido #${p.order_number}`,
    responderA: contactoTienda(),
    idempotencia: `pago-${p.id}-comprador`,
    html: plantilla(
      `¡Gracias, ${p.customer_name.split(" ")[0]}!`,
      parrafo(esc(avisoComprador)) +
        detalleHtml(p) +
        boton("Ver tu pedido", urlPedido) +
        parrafo(
          `<span style="font-size:13px;color:#666666">¿Necesitás cambiar algo? Mirá la <a href="${esc(urlSitio())}/cambios-y-devoluciones" style="color:#666666">política de cambios</a>. Podés revocar la compra con el <a href="${esc(urlSitio())}/arrepentimiento" style="color:#666666">botón de arrepentimiento</a>.</span>`,
        ),
    ),
    texto: `¡Gracias, ${p.customer_name.split(" ")[0]}!\n\n${avisoComprador}\n\n${detalleTexto(p)}\n\nVer tu pedido: ${urlPedido}\n\nCambios: ${urlSitio()}/cambios-y-devoluciones\nBotón de arrepentimiento: ${urlSitio()}/arrepentimiento\n`,
  };

  const urlPanel = `${urlSitio()}/admin/pedidos/${p.id}`;
  const titulo = sinStock
    ? `Pedido #${p.order_number} pagado SIN STOCK`
    : `Pedido nuevo #${p.order_number}`;
  const avisoDueno = sinStock
    ? "El cliente pagó, pero al confirmar el pago no había stock suficiente y no se descontó nada. Conseguí el producto o cancelalo y devolvé el dinero desde Mercado Pago."
    : "Se confirmó el pago y se descontó el stock.";
  const cliente = [p.customer_name, p.customer_email, p.customer_phone];
  const dueno: Mail = {
    para: emailsDueno(),
    asunto: `${titulo}: ${formatearPrecio(Number(p.total))}`,
    responderA: p.customer_email, // "Responder" le escribe al cliente
    idempotencia: `pago-${p.id}-dueno`,
    html: plantilla(
      titulo,
      parrafo(esc(avisoDueno)) +
        parrafo(`<strong>Cliente</strong><br>${cliente.map(esc).join("<br>")}`) +
        detalleHtml(p) +
        boton("Ver en el panel", urlPanel),
    ),
    texto: `${titulo}\n\n${avisoDueno}\n\nCliente:\n${cliente.join("\n")}\n\n${detalleTexto(p)}\n\nVer en el panel: ${urlPanel}\n`,
  };

  return dueno.para.length > 0 ? [comprador, dueno] : [comprador];
}

/**
 * Manda los mails de un pago confirmado (pedido pagado o pagado sin stock).
 * Se puede llamar varias veces con el mismo pedido, incluso al mismo tiempo:
 * solo la primera llamada "toma" el aviso (paid_notified_at) y manda los mails.
 */
export async function avisarPagoConfirmado(pedidoId: string) {
  if (!mailsActivos()) return;
  const supabase = createServiceClient();

  const { data: tomado, error } = await supabase
    .from("orders")
    .update({ paid_notified_at: new Date().toISOString() })
    .eq("id", pedidoId)
    .is("paid_notified_at", null)
    .in("status", ["paid", "stock_issue"])
    .select("id")
    .maybeSingle();
  if (error) {
    console.error(`Mails del pedido ${pedidoId}: no se pudo marcar el aviso:`, error.message);
    return;
  }
  if (!tomado) return; // ya avisado (u otro proceso lo está mandando)

  const resultados = await Promise.allSettled((mailsPago(await leerPedido(pedidoId))).map(enviar));
  const fallas = resultados.filter((r) => r.status === "rejected");
  if (fallas.length > 0) {
    for (const f of fallas) console.error(`Mails del pedido ${pedidoId}:`, (f as PromiseRejectedResult).reason);
    // Se libera para reintentar la próxima vez que se procese el pago. El que
    // sí salió no se repite: Resend descarta el reenvío por la clave de idempotencia.
    await supabase.from("orders").update({ paid_notified_at: null }).eq("id", pedidoId);
  }
}

// --- Botón de arrepentimiento ----------------------------------------------

/** Manda el código de arrepentimiento al comprador y avisa al dueño. */
export async function avisarArrepentimiento(pedidoId: string) {
  if (!mailsActivos()) return;
  const p = await leerPedido(pedidoId);
  if (!p.withdrawal_code || !p.withdrawal_requested_at) return;
  const cuando = fecha(p.withdrawal_requested_at);

  const comprador: Mail = {
    para: [p.customer_email],
    asunto: `Solicitud de arrepentimiento ${p.withdrawal_code}: pedido #${p.order_number}`,
    responderA: contactoTienda(),
    idempotencia: `arrepentimiento-${p.id}-comprador`,
    html: plantilla(
      "Recibimos tu solicitud",
      parrafo(`Recibimos tu pedido de revocación de la compra #${p.order_number}.<br>Fecha: ${esc(cuando)}`) +
        parrafo(
          `Tu código de solicitud es <strong style="font-family:monospace;font-size:18px">${esc(p.withdrawal_code)}</strong>`,
        ) +
        parrafo(
          "Te vamos a contactar para coordinar la devolución del producto y el reintegro del total pagado. No tiene costo para vos.",
        ),
    ),
    texto: `Recibimos tu solicitud\n\nRecibimos tu pedido de revocación de la compra #${p.order_number}.\nFecha: ${cuando}\n\nTu código de solicitud es ${p.withdrawal_code}\n\nTe vamos a contactar para coordinar la devolución del producto y el reintegro del total pagado. No tiene costo para vos.\n`,
  };

  const urlPanel = `${urlSitio()}/admin/pedidos/${p.id}`;
  const detalle = [
    `Código: ${p.withdrawal_code}`,
    `Fecha: ${cuando}`,
    `Cliente: ${p.customer_name}, ${p.customer_email}, ${p.customer_phone}`,
    ...(p.withdrawal_reason ? [`Comentario: ${p.withdrawal_reason}`] : []),
  ];
  const dueno: Mail = {
    para: emailsDueno(),
    asunto: `Arrepentimiento en el pedido #${p.order_number}`,
    responderA: p.customer_email,
    idempotencia: `arrepentimiento-${p.id}-dueno`,
    html: plantilla(
      `Arrepentimiento en el pedido #${p.order_number}`,
      parrafo("El cliente pidió revocar la compra con el botón de arrepentimiento.") +
        parrafo(detalle.map(esc).join("<br>")) +
        parrafo(
          "Si está dentro de los 10 días corridos desde que lo recibió: coordiná la devolución (el envío corre por cuenta de la tienda), cancelá el pedido en el panel reponiendo el stock y devolvé el dinero desde Mercado Pago.",
        ) +
        boton("Ver en el panel", urlPanel),
    ),
    texto: `Arrepentimiento en el pedido #${p.order_number}\n\n${detalle.join("\n")}\n\nVer en el panel: ${urlPanel}\n`,
  };

  const mails = dueno.para.length > 0 ? [comprador, dueno] : [comprador];
  for (const r of await Promise.allSettled(mails.map(enviar))) {
    if (r.status === "rejected") console.error(`Mails de arrepentimiento del pedido ${pedidoId}:`, r.reason);
  }
}
