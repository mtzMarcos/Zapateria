"use server";

import { redirect } from "next/navigation";
import { detalleCarrito, guardarCarrito, leerCarrito, problemaItem, subtotal } from "@/lib/carrito";
import { obtenerZonas } from "@/lib/envios";
import { texto } from "@/lib/form";
import { createServiceClient } from "@/lib/supabase/service";
import { campos, validar, type EstadoCheckout, type Valores } from "./datos";

/**
 * Crea el pedido con estado "esperando el pago".
 *
 * Todo lo que importa se recalcula acá con datos de la base: precios, stock
 * y costo de envío. Lo que mande el navegador solo se usa para los datos
 * del comprador. El stock NO se descuenta todavía: se descuenta cuando
 * Mercado Pago confirme el pago (Etapa 5).
 */
export async function crearPedido(
  _estado: EstadoCheckout,
  formData: FormData,
): Promise<EstadoCheckout> {
  const valores = Object.fromEntries(campos.map((c) => [c, texto(formData, c)])) as Valores;
  const errores = validar(valores);
  if (Object.keys(errores).length > 0) {
    return { error: "Revisá los datos marcados.", errores, valores };
  }

  const lineas = await leerCarrito();
  const items = await detalleCarrito(lineas);
  if (items.length === 0) return { error: "Tu carrito está vacío.", valores };
  if (items.length < lineas.length || items.some((i) => problemaItem(i))) {
    return {
      error: "Cambió el stock de algunos productos mientras comprabas. Revisá el carrito.",
      valores,
    };
  }

  const envio = valores.entrega === "shipping";
  const zona = envio ? (await obtenerZonas()).find((z) => z.id === valores.zona) : undefined;
  if (envio && !zona) {
    return { error: "Revisá los datos marcados.", errores: { zona: "Elegí la zona de envío." }, valores };
  }

  const totalProductos = subtotal(items);
  const costoEnvio = zona?.price ?? 0;
  const supabase = createServiceClient();

  const { data: pedido, error } = await supabase
    .from("orders")
    .insert({
      customer_name: valores.nombre,
      customer_email: valores.email.toLowerCase(),
      customer_phone: valores.telefono,
      delivery_method: envio ? "shipping" : "pickup",
      shipping_zone_id: zona?.id ?? null,
      shipping_zone_name: zona?.name ?? null,
      address_street: envio ? valores.calle : null,
      address_number: envio ? valores.numero : null,
      address_apartment: envio ? valores.depto || null : null,
      address_city: envio ? valores.ciudad : null,
      address_province: envio ? valores.provincia : null,
      address_postal_code: envio ? valores.cp.toUpperCase() : null,
      address_notes: valores.notas || null,
      subtotal: totalProductos,
      shipping_cost: costoEnvio,
      total: totalProductos + costoEnvio,
    })
    .select("id")
    .single();
  if (error) {
    console.error("No se pudo crear el pedido:", error);
    return { error: "No pudimos registrar el pedido. Probá de nuevo en unos minutos.", valores };
  }

  const { error: errorItems } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: pedido.id,
      product_id: i.productoId,
      variant_id: i.varianteId,
      product_name: i.nombre,
      size: i.talle,
      unit_price: i.precio,
      quantity: i.cantidad,
    })),
  );
  if (errorItems) {
    // Sin ítems el pedido no sirve: se borra para no dejarlo a medias.
    console.error("No se pudieron guardar los ítems del pedido:", errorItems);
    await supabase.from("orders").delete().eq("id", pedido.id);
    return { error: "No pudimos registrar el pedido. Probá de nuevo en unos minutos.", valores };
  }

  // En la Etapa 5, en lugar de ir a la confirmación se va a pagar a Mercado Pago.
  await guardarCarrito([]);
  redirect(`/pedido/${pedido.id}`);
}
