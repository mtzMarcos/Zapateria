"use client";

import { useActionState } from "react";
import { estadoInicial } from "@/lib/form";
import { actualizarEstadoPago, pagarPedido } from "./actions";

/**
 * Botones del pedido sin pagar: ir a pagar a Mercado Pago y "Ya pagué",
 * que consulta el pago en Mercado Pago por si el aviso no llegó.
 * Sin `textoPagar` solo se muestra "Ya pagué" (pago en proceso).
 */
export function AccionesPago({ pedidoId, textoPagar }: { pedidoId: string; textoPagar?: string }) {
  const [estadoPago, pagar, pagando] = useActionState(
    pagarPedido.bind(null, pedidoId),
    estadoInicial,
  );
  const [estadoActualizar, actualizar, actualizando] = useActionState(
    actualizarEstadoPago.bind(null, pedidoId),
    estadoInicial,
  );
  const ocupado = pagando || actualizando;
  const error = estadoPago.error ?? estadoActualizar.error;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        {textoPagar && (
          <form action={pagar}>
            <button
              type="submit"
              disabled={ocupado}
              className="rounded-md bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-300 disabled:text-neutral-700"
            >
              {pagando ? "Conectando con Mercado Pago…" : textoPagar}
            </button>
          </form>
        )}
        <form action={actualizar}>
          <button
            type="submit"
            disabled={ocupado}
            className="rounded-md border border-neutral-300 px-5 py-2.5 font-medium hover:border-neutral-900 disabled:text-neutral-500"
          >
            {actualizando ? "Consultando…" : "Ya pagué: actualizar estado"}
          </button>
        </form>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
