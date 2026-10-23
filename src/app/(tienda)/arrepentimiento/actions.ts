"use server";

import { randomInt } from "node:crypto";
import { texto } from "@/lib/form";
import { createServiceClient } from "@/lib/supabase/service";

export type EstadoArrepentimiento = {
  error?: string;
  // Solicitud registrada (nueva o hecha antes para el mismo pedido).
  solicitud?: { codigo: string; numero: number; fecha: string; email: string };
  valores?: { pedido: string; email: string; motivo: string };
};

// Sin letras ni números que se confundan entre sí (O/0, I/1, L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function nuevoCodigo(numero: number) {
  const sufijo = Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  return `ARR-${numero}-${sufijo}`;
}

function fecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "long",
    timeStyle: "short",
  });
}

/**
 * Registra el pedido de revocación de una compra (botón de arrepentimiento).
 * Pide el número de pedido y el email de la compra: no hace falta cuenta.
 * Si ya se había pedido para ese pedido, devuelve la misma solicitud.
 */
export async function solicitarArrepentimiento(
  _estado: EstadoArrepentimiento,
  formData: FormData,
): Promise<EstadoArrepentimiento> {
  const valores = {
    pedido: texto(formData, "pedido").replace(/^#/, ""),
    email: texto(formData, "email").toLowerCase(),
    motivo: texto(formData, "motivo").slice(0, 1000),
  };
  if (!/^\d{1,9}$/.test(valores.pedido) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) {
    return { error: "Revisá el número de pedido y el email.", valores };
  }

  const supabase = createServiceClient();
  const { data: pedido, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_email, withdrawal_code, withdrawal_requested_at")
    .eq("order_number", Number(valores.pedido))
    .maybeSingle();
  if (error) {
    console.error("Botón de arrepentimiento:", error);
    return { error: "No pudimos registrar la solicitud. Probá de nuevo en unos minutos.", valores };
  }
  // Mismo mensaje si no existe el pedido o si el email no coincide, para no
  // revelar qué números de pedido existen.
  if (!pedido || pedido.customer_email.toLowerCase() !== valores.email) {
    return {
      error:
        "No encontramos un pedido con ese número y ese email. El número figura en la página de tu pedido (por ejemplo, #1032) y el email es el que usaste al comprar.",
      valores,
    };
  }

  const registrada = (codigo: string, iso: string) => ({
    solicitud: { codigo, numero: pedido.order_number, fecha: fecha(iso), email: pedido.customer_email },
  });
  if (pedido.withdrawal_code && pedido.withdrawal_requested_at) {
    return registrada(pedido.withdrawal_code, pedido.withdrawal_requested_at);
  }

  // Solo si todavía no tiene solicitud: dos envíos simultáneos no generan dos códigos.
  const { data: actualizado, error: errorUpdate } = await supabase
    .from("orders")
    .update({
      withdrawal_code: nuevoCodigo(pedido.order_number),
      withdrawal_requested_at: new Date().toISOString(),
      withdrawal_reason: valores.motivo || null,
    })
    .eq("id", pedido.id)
    .is("withdrawal_code", null)
    .select("withdrawal_code, withdrawal_requested_at")
    .maybeSingle();
  if (errorUpdate) {
    console.error("Botón de arrepentimiento:", errorUpdate);
    return { error: "No pudimos registrar la solicitud. Probá de nuevo en unos minutos.", valores };
  }
  if (actualizado) return registrada(actualizado.withdrawal_code, actualizado.withdrawal_requested_at);

  // Otro envío la registró mientras tanto: se devuelve esa.
  const { data: existente } = await supabase
    .from("orders")
    .select("withdrawal_code, withdrawal_requested_at")
    .eq("id", pedido.id)
    .single();
  return registrada(existente!.withdrawal_code, existente!.withdrawal_requested_at);
}
