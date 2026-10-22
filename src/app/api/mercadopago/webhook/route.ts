import type { NextRequest } from "next/server";
import { firmaValida } from "@/lib/mercadopago";
import { procesarPago } from "@/lib/pagos";

// Avisos (webhooks) de Mercado Pago. Se configuran en "Tus integraciones" →
// la aplicación → Webhooks, con el evento "Pagos" y la URL
// https://<dominio>/api/mercadopago/webhook
//
// El aviso solo trae el id del pago; el estado y el monto se consultan a la
// API de Mercado Pago (procesarPago), así que un aviso falso no puede marcar
// un pedido como pagado. La firma se verifica además como control extra.
//
// Responder 200 le indica a Mercado Pago que no reintente; ante un error se
// responde 500 y vuelve a mandar el aviso más tarde.
export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cuerpo = await request.json().catch(() => ({}));

  // Formato actual (?data.id=&type=) y el anterior de IPN (?id=&topic=).
  const tipo = params.get("type") ?? params.get("topic") ?? cuerpo.type ?? cuerpo.topic;
  const pagoId = params.get("data.id") ?? params.get("id") ?? cuerpo.data?.id;

  if (tipo !== "payment" || !pagoId) {
    return new Response(null, { status: 200 }); // otros avisos no nos interesan
  }
  if (!/^\d+$/.test(String(pagoId))) {
    return new Response("id de pago inválido", { status: 400 });
  }

  const firma = firmaValida(
    request.headers.get("x-signature"),
    request.headers.get("x-request-id"),
    String(pagoId),
  );
  if (firma === false) {
    console.warn(`Webhook de Mercado Pago con firma inválida (pago ${pagoId})`);
    return new Response("firma inválida", { status: 401 });
  }
  if (firma === null) {
    console.warn("Falta MERCADOPAGO_WEBHOOK_SECRET: el aviso no se puede verificar por firma.");
  }

  try {
    await procesarPago(String(pagoId));
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`Error procesando el pago ${pagoId}:`, error);
    return new Response("error", { status: 500 });
  }
}
