import { redirect } from "next/navigation";
import { connection, type NextRequest } from "next/server";
import { esUuid } from "@/lib/carrito";
import { procesarPago } from "@/lib/pagos";

// Adonde vuelve el comprador desde Mercado Pago (pagó, falló o quedó
// pendiente). Mercado Pago agrega ?payment_id=…&status=… a la URL.
//
// El pago se procesa también acá, no solo en el webhook: así el pedido se ve
// pagado apenas vuelve el comprador, y funciona en la PC de desarrollo,
// donde los webhooks no llegan. Procesar dos veces el mismo pago no hace nada.
export async function GET(request: NextRequest) {
  await connection();
  const params = request.nextUrl.searchParams;
  const pedido = params.get("pedido") ?? "";
  const pagoId = params.get("payment_id");
  const estado = params.get("status") ?? params.get("collection_status");

  if (!esUuid(pedido)) redirect("/");

  if (pagoId && /^\d+$/.test(pagoId)) {
    try {
      await procesarPago(pagoId);
    } catch (error) {
      // Si falla, el webhook lo vuelve a intentar; el comprador igual ve su pedido.
      console.error(`Error procesando el pago ${pagoId} al volver de Mercado Pago:`, error);
    }
  }

  const aviso = estado === "pending" || estado === "in_process" ? "?pago=pendiente" : "";
  redirect(`/pedido/${pedido}${aviso}`);
}
