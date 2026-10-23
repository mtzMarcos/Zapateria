import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { urlSitio } from "@/lib/sitio";

// Integración con Mercado Pago Checkout Pro usando su API REST.
// El comprador paga en la página de Mercado Pago; acá solo se crea la
// "preferencia" (el cobro) y se consultan los pagos.
//
// Nunca se confía en lo que llega del navegador ni del webhook: el estado
// y el monto de un pago se leen siempre de la API con nuestro Access Token.

const API = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en .env.local");
  return token;
}

/**
 * Mercado Pago solo vuelve a la tienda y manda avisos (webhooks) a direcciones
 * https. En la PC de desarrollo (http://localhost) no pasa ninguna de las dos
 * cosas: el estado del pago se actualiza con el botón "Ya pagué" del pedido.
 */
export function sitioPublico() {
  return urlSitio().startsWith("https://");
}

async function llamar<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + ruta, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago respondió ${res.status} en ${ruta}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export type ItemCobro = { id: string; titulo: string; cantidad: number; precio: number };

/**
 * Crea el cobro en Mercado Pago y devuelve la URL a la que hay que mandar al comprador.
 * `pedidoId` viaja como external_reference: así se sabe de qué pedido es cada pago.
 */
export async function crearPreferencia(datos: {
  pedidoId: string;
  numero: number;
  items: ItemCobro[];
  comprador: { nombre: string; email: string };
}) {
  const sitio = urlSitio();
  const retorno = `${sitio}/api/mercadopago/retorno?pedido=${datos.pedidoId}`;

  const preferencia = await llamar<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: datos.items.map((i) => ({
        id: i.id,
        title: i.titulo,
        quantity: i.cantidad,
        unit_price: i.precio,
        currency_id: "ARS",
      })),
      payer: { name: datos.comprador.nombre, email: datos.comprador.email },
      external_reference: datos.pedidoId,
      metadata: { pedido: datos.numero },
      // Sin notification_url a propósito: los avisos llegan al webhook configurado
      // en el panel de Mercado Pago, que es el que se firma con la clave secreta
      // (los avisos a notification_url llegaban con una firma que no coincidía).
      ...(sitioPublico() && {
        back_urls: { success: retorno, failure: retorno, pending: retorno },
        auto_return: "approved",
      }),
      // El link de pago vence a las 48 h; después se puede generar otro desde
      // la página del pedido.
      expires: true,
      expiration_date_to: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    }),
  });

  return { id: preferencia.id, url: preferencia.init_point };
}

export type Pago = {
  id: number;
  status: string; // approved, pending, in_process, rejected, cancelled, refunded…
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
};

export function obtenerPago(id: string) {
  return llamar<Pago>(`/v1/payments/${encodeURIComponent(id)}`);
}

/** Ids de los pagos de un pedido (external_reference), del más nuevo al más viejo. */
export async function buscarPagos(pedidoId: string) {
  const { results } = await llamar<{ results: { id: number }[] }>(
    `/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&sort=date_created&criteria=desc&limit=20`,
  );
  return results.map((p) => String(p.id));
}

/**
 * Verifica la firma de un aviso (webhook) de Mercado Pago.
 * Ver "Validar origen de la notificación" en la documentación de Webhooks.
 * `dataId` es el parámetro `data.id` de la URL del aviso (null si no vino):
 * según la documentación, lo que no viene en el aviso se saca del manifiesto.
 * Devuelve null si no hay clave configurada (no se puede verificar).
 */
export function firmaValida(firma: string | null, requestId: string | null, dataId: string | null) {
  const secreto = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secreto) return null;
  if (!firma) return false;

  const partes = Object.fromEntries(
    firma.split(",").map((p) => p.trim().split("=", 2) as [string, string]),
  );
  if (!partes.ts || !partes.v1) return false;

  let manifiesto = "";
  if (dataId) {
    // Los ids alfanuméricos se firman en minúscula.
    manifiesto += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  }
  if (requestId) manifiesto += `request-id:${requestId};`;
  manifiesto += `ts:${partes.ts};`;

  const esperada = createHmac("sha256", secreto).update(manifiesto).digest("hex");
  const a = Buffer.from(esperada);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
