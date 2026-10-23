"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { cancelable, conStockDescontado, esEstado, estados, siguientesEstados } from "@/lib/admin/pedidos";
import { catalogoActualizado } from "@/lib/admin/revalidar";
import { esUuid } from "@/lib/carrito";
import { mensajeError, texto, type EstadoForm } from "@/lib/form";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Pasa el pedido al estado siguiente (preparando, despachado, etc.); el
 * estado nuevo viene del botón que se tocó (name="hacia").
 * `desde` es el estado que se veía en pantalla: si mientras tanto cambió
 * (otra pestaña, un pago que llegó), no se pisa.
 */
export async function cambiarEstado(
  pedidoId: string,
  desde: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const hacia = texto(formData, "hacia");
  if (!esUuid(pedidoId) || !esEstado(desde) || !esEstado(hacia)) return { error: "Datos inválidos." };

  const { data: pedido } = await supabase
    .from("orders")
    .select("status, delivery_method")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return { error: "El pedido no existe." };
  if (pedido.status !== desde) {
    refresh();
    return { error: "El pedido cambió de estado mientras tanto. Revisá cómo quedó." };
  }
  if (!siguientesEstados(desde, pedido.delivery_method === "shipping").includes(hacia)) {
    return { error: "Ese cambio de estado no es posible." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: hacia })
    .eq("id", pedidoId)
    .eq("status", desde);
  if (error) return { error: mensajeError(error) };

  refresh();
  return { ok: `Pedido marcado como "${estados[hacia].nombre}".` };
}

export async function cancelarPedido(
  pedidoId: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  if (!esUuid(pedidoId)) return { error: "Pedido inválido." };

  const { data: pedido } = await supabase
    .from("orders")
    .select("status, withdrawal_code")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido || !esEstado(pedido.status) || !cancelable(pedido.status, pedido.withdrawal_code !== null)) {
    return { error: "Este pedido no se puede cancelar." };
  }
  const reponer = formData.get("reponer") === "on" && conStockDescontado.includes(pedido.status);

  // La función SQL solo la puede llamar el servidor: ya se verificó que es admin.
  const { data: anterior, error } = await createServiceClient().rpc("cancelar_pedido", {
    p_order_id: pedidoId,
    p_reponer_stock: reponer,
  });
  if (error) return { error: mensajeError(error) };
  if (anterior === "no_cancelable" || anterior === "no_existe") {
    refresh();
    return { error: "Este pedido no se puede cancelar." };
  }

  if (reponer) {
    // Cambió el stock: la tienda tiene que mostrar el nuevo.
    catalogoActualizado();
    return { ok: "Pedido cancelado. Las unidades volvieron al stock." };
  }
  refresh();
  return { ok: "Pedido cancelado." };
}

export async function guardarNotas(
  pedidoId: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  if (!esUuid(pedidoId)) return { error: "Pedido inválido." };

  const notas = texto(formData, "notas");
  if (notas.length > 5000) return { error: "Las notas son demasiado largas." };

  const { error } = await supabase.from("orders").update({ admin_notes: notas }).eq("id", pedidoId);
  if (error) return { error: mensajeError(error) };

  refresh();
  return { ok: "Notas guardadas." };
}
