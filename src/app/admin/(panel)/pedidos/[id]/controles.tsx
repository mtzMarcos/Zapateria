"use client";

import { useActionState } from "react";
import { estadoInicial } from "@/lib/form";
import { claseInput, clasesBoton } from "@/components/admin/estilos";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { cambiarEstado, cancelarPedido, guardarNotas } from "../actions";

export function CambiarEstado({
  pedidoId,
  desde,
  siguientes,
}: {
  pedidoId: string;
  desde: string;
  siguientes: { estado: string; texto: string }[];
}) {
  const [estado, accion, pendiente] = useActionState(
    cambiarEstado.bind(null, pedidoId, desde),
    estadoInicial,
  );

  return (
    <form action={accion} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {siguientes.map((s, i) => (
          <button
            key={s.estado}
            type="submit"
            name="hacia"
            value={s.estado}
            disabled={pendiente}
            className={clasesBoton(i === 0 ? "primario" : "secundario")}
          >
            {s.texto}
          </button>
        ))}
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}

export function CancelarPedido({
  pedidoId,
  puedeReponer,
  pagado,
}: {
  pedidoId: string;
  puedeReponer: boolean;
  pagado: boolean;
}) {
  const [estado, accion] = useActionState(cancelarPedido.bind(null, pedidoId), estadoInicial);

  return (
    <details className="mt-5 border-t border-neutral-200 pt-4">
      <summary className="cursor-pointer text-sm text-red-700">Cancelar pedido…</summary>
      <form
        action={accion}
        onSubmit={(e) => {
          if (!confirm("¿Cancelar este pedido? No se puede deshacer.")) e.preventDefault();
        }}
        className="mt-3 space-y-3"
      >
        {puedeReponer && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="reponer" defaultChecked className="mt-0.5" />
            <span>
              Devolver al stock las unidades del pedido
              <span className="block text-neutral-500">
                Destildalo si el producto ya salió del local (por ejemplo, un envío que volvió dañado).
              </span>
            </span>
          </label>
        )}
        {pagado && (
          <p className="text-sm text-neutral-600">
            Cancelar acá no devuelve el dinero: hacé la devolución desde tu cuenta de Mercado Pago.
          </p>
        )}
        <BotonEnviar variante="peligro" textoEnviando="Cancelando…">
          Cancelar pedido
        </BotonEnviar>
        <Mensaje estado={estado} />
      </form>
    </details>
  );
}

export function Notas({ pedidoId, notas }: { pedidoId: string; notas: string }) {
  const [estado, accion] = useActionState(guardarNotas.bind(null, pedidoId), estadoInicial);

  return (
    <form action={accion} className="space-y-3">
      <textarea
        name="notas"
        defaultValue={notas}
        rows={Math.min(12, Math.max(3, notas.split("\n").length + 1))}
        aria-label="Notas internas"
        placeholder="Ej: le escribí por WhatsApp, pasa el sábado."
        className={claseInput}
      />
      <div className="flex items-center gap-4">
        <BotonEnviar variante="secundario">Guardar notas</BotonEnviar>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
