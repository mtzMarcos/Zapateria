import "server-only";
import { revalidateTag } from "next/cache";
import { esUuid } from "@/lib/carrito";
import { buscarPagos, crearPreferencia, obtenerPago, type ItemCobro } from "@/lib/mercadopago";
import { createServiceClient } from "@/lib/supabase/service";

// Pedidos y pagos. Todo con la clave secreta: los pedidos no son públicos (RLS).

/** Estados en los que el pedido todavía se puede pagar. */
export const ESTADOS_PAGABLES = ["pending_payment", "payment_rejected"];

type ItemPedido = {
  variant_id: string | null;
  product_name: string;
  size: string;
  unit_price: number;
  quantity: number;
};

/**
 * Crea el cobro en Mercado Pago para un pedido ya guardado y devuelve la URL
 * de pago. Los montos salen del pedido en la base, no del carrito.
 */
export async function iniciarPago(pedidoId: string) {
  const supabase = createServiceClient();
  const { data: pedido, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, shipping_cost, shipping_zone_name, order_items(variant_id, product_name, size, unit_price, quantity)",
    )
    .eq("id", pedidoId)
    .single();
  if (error) throw new Error(`No se encontró el pedido ${pedidoId}: ${error.message}`);
  if (!ESTADOS_PAGABLES.includes(pedido.status)) {
    throw new Error(`El pedido ${pedido.order_number} no se puede pagar (estado ${pedido.status}).`);
  }

  const items: ItemCobro[] = (pedido.order_items as ItemPedido[]).map((i) => ({
    id: i.variant_id ?? "producto",
    titulo: `${i.product_name} (talle ${i.size})`,
    cantidad: i.quantity,
    precio: Number(i.unit_price),
  }));
  if (Number(pedido.shipping_cost) > 0) {
    items.push({
      id: "envio",
      titulo: `Envío (${pedido.shipping_zone_name})`,
      cantidad: 1,
      precio: Number(pedido.shipping_cost),
    });
  }

  const preferencia = await crearPreferencia({
    pedidoId: pedido.id,
    numero: pedido.order_number,
    items,
    comprador: { nombre: pedido.customer_name, email: pedido.customer_email },
  });

  await supabase.from("orders").update({ mp_preference_id: preferencia.id }).eq("id", pedido.id);
  return preferencia.url;
}

/** Hay stock para todos los ítems del pedido (antes de mandarlo a pagar de nuevo). */
export async function hayStockParaPedido(pedidoId: string) {
  const supabase = createServiceClient();
  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, product_variants(stock)")
    .eq("order_id", pedidoId);

  return (items ?? []).every((i) => {
    const variante = i.product_variants as unknown as { stock: number } | null;
    return variante !== null && variante.stock >= i.quantity;
  });
}

async function agregarNota(pedidoId: string, nota: string) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("orders").select("admin_notes").eq("id", pedidoId).single();
  // Mercado Pago repite los avisos: la misma nota no se agrega dos veces.
  if (data?.admin_notes.includes(nota)) return;
  const fecha = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
  const notas = [data?.admin_notes, `[${fecha}] ${nota}`].filter(Boolean).join("\n");
  await supabase.from("orders").update({ admin_notes: notas }).eq("id", pedidoId);
}

/**
 * Procesa un pago informado por Mercado Pago (webhook o vuelta del comprador).
 * Se puede llamar muchas veces con el mismo pago: el resultado es el mismo.
 * Devuelve el id del pedido, o null si el pago no es de esta tienda.
 */
export async function procesarPago(pagoId: string): Promise<string | null> {
  const pago = await obtenerPago(pagoId);
  const pedidoId = pago.external_reference;
  if (!pedidoId || !esUuid(pedidoId)) return null;

  const supabase = createServiceClient();
  const { data: pedido } = await supabase
    .from("orders")
    .select("id, order_number, status, total, mp_payment_id")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return null;

  const idPago = String(pago.id);

  if (pago.status === "approved") {
    if (pedido.mp_payment_id && pedido.mp_payment_id !== idPago) {
      // Ya estaba pagado con otro pago: el comprador pagó dos veces.
      await agregarNota(
        pedido.id,
        `Llegó OTRO pago aprobado (#${idPago}) para este pedido ya pagado con #${pedido.mp_payment_id}. Revisar y devolver el duplicado.`,
      );
      return pedido.id;
    }
    // Se paga exactamente el total del pedido, en pesos.
    if (pago.currency_id !== "ARS" || Math.abs(pago.transaction_amount - Number(pedido.total)) > 0.01) {
      console.error(`Pago ${idPago} con monto distinto al pedido #${pedido.order_number}`);
      await agregarNota(
        pedido.id,
        `Pago #${idPago} aprobado por ${pago.currency_id} ${pago.transaction_amount}, pero el pedido es de ${pedido.total}. No se confirmó: revisar.`,
      );
      return pedido.id;
    }

    const { data: estado, error } = await supabase.rpc("confirmar_pago", {
      p_order_id: pedido.id,
      p_payment_id: idPago,
    });
    if (error) throw new Error(`No se pudo confirmar el pago ${idPago}: ${error.message}`);

    if (estado === "paid" || estado === "stock_issue") {
      // Cambió el stock: la tienda tiene que dejar de mostrar el anterior.
      revalidateTag("catalogo", { expire: 0 });
    }
    if (estado === "stock_issue") {
      await agregarNota(
        pedido.id,
        `Pago #${idPago} aprobado pero no había stock suficiente al confirmarlo. No se descontó stock: conseguir el producto o devolver el dinero.`,
      );
    }
    return pedido.id;
  }

  if (pago.status === "rejected" || pago.status === "cancelled") {
    // Solo si sigue esperando: un pago rechazado no pisa uno aprobado.
    await supabase
      .from("orders")
      .update({ status: "payment_rejected" })
      .eq("id", pedido.id)
      .eq("status", "pending_payment");
    return pedido.id;
  }

  if ((pago.status === "refunded" || pago.status === "charged_back") && pedido.mp_payment_id === idPago) {
    await agregarNota(
      pedido.id,
      `El pago #${idPago} figura como ${pago.status === "refunded" ? "devuelto" : "contracargo"} en Mercado Pago.`,
    );
  }

  // pending / in_process: el pedido sigue esperando el pago.
  return pedido.id;
}

/**
 * Busca en Mercado Pago todos los pagos de un pedido y los procesa. Sirve
 * cuando no llegó el aviso (webhook): en la PC de desarrollo nunca llega.
 */
export async function sincronizarPagos(pedidoId: string) {
  for (const pagoId of (await buscarPagos(pedidoId)).toReversed()) {
    await procesarPago(pagoId);
  }
}
