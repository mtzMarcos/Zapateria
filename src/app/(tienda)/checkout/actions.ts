"use server";

import { redirect } from "next/navigation";
import { detalleCarrito, guardarCarrito, leerCarrito, problemaItem, subtotal } from "@/lib/carrito";
import { obtenerZonas } from "@/lib/envios";
import { texto } from "@/lib/form";
import { sitioPublico } from "@/lib/mercadopago";
import { iniciarPago } from "@/lib/pagos";
import { createServiceClient } from "@/lib/supabase/service";
import { campos, validar, type EstadoCheckout, type Valores } from "./datos";

/**
 * Crea el pedido con estado "esperando el pago" y manda al comprador a pagar
 * a Mercado Pago.
 *
 * Todo lo que importa se recalcula acá con datos de la base: precios, stock
 * y costo de envío. Lo que mande el navegador solo se usa para los datos
 * del comprador. El stock NO se descuenta acá: se descuenta cuando Mercado
 * Pago confirma el pago (src/lib/pagos.ts).
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

  let urlPago: string;
  try {
    urlPago = await iniciarPago(pedido.id);
  } catch (errorPago) {
    // Sin cobro el pedido no sirve: se borra y el comprador conserva su carrito.
    console.error("No se pudo crear el cobro en Mercado Pago:", errorPago);
    await supabase.from("orders").delete().eq("id", pedido.id);
    return {
      error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos.",
      valores,
    };
  }

  // El carrito se vacía al ir a pagar. Si el comprador no termina de pagar,
  // desde la página del pedido puede volver a intentarlo.
  await guardarCarrito([]);
  // En la PC de desarrollo Mercado Pago no vuelve a la tienda después de
  // pagar: se pasa primero por la página del pedido, que tiene el botón para
  // pagar y el de "Ya pagué" para actualizar el estado.
  redirect(sitioPublico() ? urlPago : `/pedido/${pedido.id}`);
}
