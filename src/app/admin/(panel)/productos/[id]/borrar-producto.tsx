"use client";

import { useState, useTransition } from "react";
import { clasesBoton } from "@/components/admin/estilos";
import { borrarProducto } from "../actions";

export function BorrarProducto({ productId }: { productId: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirmando) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">
          Si solo querés dejar de venderlo, es mejor destildar &quot;Visible en la tienda&quot;.
          Borrarlo elimina también sus fotos y talles, y no se puede deshacer.
        </p>
        <button type="button" onClick={() => setConfirmando(true)} className={clasesBoton("peligro")}>
          Eliminar producto…
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-red-700">¿Seguro? Esto no se puede deshacer.</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() =>
            startTransition(async () => {
              const resultado = await borrarProducto(productId);
              if (resultado?.error) setError(resultado.error);
            })
          }
          className="inline-flex items-center rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:bg-neutral-300 disabled:text-neutral-700"
        >
          {pendiente ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => setConfirmando(false)}
          className={clasesBoton("secundario")}
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
