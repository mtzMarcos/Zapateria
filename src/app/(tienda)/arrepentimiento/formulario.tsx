"use client";

import { useActionState } from "react";
import { solicitarArrepentimiento, type EstadoArrepentimiento } from "./actions";

const claseInput =
  "w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none";

export function FormularioArrepentimiento() {
  const [estado, enviar, enviando] = useActionState(
    solicitarArrepentimiento,
    {} as EstadoArrepentimiento,
  );

  if (estado.solicitud) {
    const { codigo, numero, fecha, email, porMail } = estado.solicitud;
    return (
      <div role="status" className="rounded-lg border border-neutral-300 p-6">
        <p className="text-sm font-medium tracking-wide text-green-700 uppercase">Solicitud registrada</p>
        <p className="mt-3">Recibimos tu pedido de revocación de la compra #{numero}.</p>
        <p className="text-sm text-neutral-600">Fecha: {fecha}</p>
        <p className="mt-4 text-sm text-neutral-600">Tu código de solicitud es</p>
        <p className="font-mono text-2xl font-bold">{codigo}</p>
        <p className="mt-4 text-neutral-600">
          {porMail ? `También te lo mandamos por email a ${email}.` : "Guardalo (podés sacarle una captura)."} Te
          vamos a contactar a {email} para coordinar la devolución
          del producto y el reintegro del total pagado. No tiene costo para vos.
        </p>
      </div>
    );
  }

  return (
    <form action={enviar} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pedido" className="mb-1 block text-sm font-medium">
            Número de pedido
          </label>
          <input
            id="pedido"
            name="pedido"
            inputMode="numeric"
            placeholder="Por ejemplo, 1032"
            defaultValue={estado.valores?.pedido}
            required
            className={claseInput}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email de la compra
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={estado.valores?.email}
            required
            className={claseInput}
          />
        </div>
      </div>
      <div>
        <label htmlFor="motivo" className="mb-1 block text-sm font-medium">
          Comentarios <span className="font-normal text-neutral-500">(opcional, no hace falta dar un motivo)</span>
        </label>
        <textarea
          id="motivo"
          name="motivo"
          rows={3}
          maxLength={1000}
          defaultValue={estado.valores?.motivo}
          className={claseInput}
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-300 disabled:text-neutral-700"
      >
        {enviando ? "Enviando…" : "Revocar la compra"}
      </button>
    </form>
  );
}
