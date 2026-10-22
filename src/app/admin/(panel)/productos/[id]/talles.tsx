"use client";

import { useActionState } from "react";
import { estadoInicial } from "@/lib/form";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { claseInput } from "@/components/admin/estilos";
import { agregarTalles, borrarTalle, guardarStock } from "../actions";

type Talle = { id: string; size: string; stock: number };

export function Talles({ productId, talles }: { productId: string; talles: Talle[] }) {
  const [estadoStock, accionStock] = useActionState(
    guardarStock.bind(null, productId),
    estadoInicial,
  );

  return (
    <div className="space-y-6">
      {talles.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Este producto todavía no tiene talles. Sin talles con stock no se puede comprar.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Un solo formulario guarda el stock de todos los talles juntos. */}
          <form id="form-stock" action={accionStock} />
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
            {talles.map((talle) => (
              <FilaTalle key={talle.id} productId={productId} talle={talle} />
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              form="form-stock"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Guardar stock
            </button>
            <Mensaje estado={estadoStock} />
          </div>
        </div>
      )}

      <AgregarTalles productId={productId} />
    </div>
  );
}

function FilaTalle({ productId, talle }: { productId: string; talle: Talle }) {
  const [estado, borrar] = useActionState(
    borrarTalle.bind(null, productId, talle.id),
    estadoInicial,
  );

  return (
    <li className="rounded-md border border-neutral-200 p-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Talle {talle.size}</span>
        <form action={borrar}>
          <button
            type="submit"
            title={`Quitar talle ${talle.size}`}
            aria-label={`Quitar talle ${talle.size}`}
            className="px-1 text-neutral-400 hover:text-red-700"
          >
            ✕
          </button>
        </form>
      </div>
      <label className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
        Stock
        <input
          form="form-stock"
          name={`stock:${talle.id}`}
          type="number"
          min={0}
          step={1}
          required
          defaultValue={talle.stock}
          className={`${claseInput} w-20`}
        />
      </label>
      <Mensaje estado={estado} />
    </li>
  );
}

function AgregarTalles({ productId }: { productId: string }) {
  const [estado, accion] = useActionState(agregarTalles.bind(null, productId), estadoInicial);

  return (
    <form action={accion} className="space-y-2">
      <label htmlFor="talles" className="block text-sm font-medium">
        Agregar talles
      </label>
      <div className="flex max-w-md gap-2">
        <input
          id="talles"
          name="talles"
          required
          placeholder="Ej: 35-42  o  38, 39, 40"
          className={claseInput}
        />
        <BotonEnviar variante="secundario" textoEnviando="Agregando…">
          Agregar
        </BotonEnviar>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}
