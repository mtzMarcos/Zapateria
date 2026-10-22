"use server";

import { redirect } from "next/navigation";
import { esUuid } from "@/lib/carrito";
import type { EstadoForm } from "@/lib/form";
import { ESTADOS_PAGABLES, hayStockParaPedido, iniciarPago, sincronizarPagos } from "@/lib/pagos";
import { createServiceClient } from "@/lib/supabase/service";

/** Vuelve a mandar a pagar un pedido que quedó sin pagar o con el pago rechazado. */
export async function pagarPedido(pedidoId: string): Promise<EstadoForm> {
  if (!esUuid(pedidoId)) return { error: "Pedido inválido." };

  const { data: pedido } = await createServiceClient()
    .from("orders")
    .select("status")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido || !ESTADOS_PAGABLES.includes(pedido.status)) {
    return { error: "Este pedido ya no se puede pagar." };
  }
  if (!(await hayStockParaPedido(pedidoId))) {
    return {
      error: "Algún producto del pedido se quedó sin stock. Hacé un pedido nuevo desde la tienda.",
    };
  }

  let url: string;
  try {
    url = await iniciarPago(pedidoId);
  } catch (error) {
    console.error("No se pudo crear el cobro en Mercado Pago:", error);
    return { error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos." };
  }
  redirect(url);
}

/** "Ya pagué": consulta en Mercado Pago los pagos del pedido y actualiza su estado. */
export async function actualizarEstadoPago(pedidoId: string): Promise<EstadoForm> {
  if (!esUuid(pedidoId)) return { error: "Pedido inválido." };

  try {
    await sincronizarPagos(pedidoId);
  } catch (error) {
    console.error("No se pudieron consultar los pagos en Mercado Pago:", error);
    return { error: "No pudimos consultar Mercado Pago. Probá de nuevo en unos minutos." };
  }

  const { data: pedido } = await createServiceClient()
    .from("orders")
    .select("status")
    .eq("id", pedidoId)
    .maybeSingle();
  if (pedido?.status === "pending_payment") {
    return { error: "Todavía no vemos ningún pago aprobado para este pedido." };
  }
  // Volver a cargar la página con el estado nuevo.
  redirect(`/pedido/${pedidoId}`);
}
