"use client";

import { useActionState } from "react";
import { estadoInicial } from "@/lib/form";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { claseInput } from "@/components/admin/estilos";
import {
  borrarTaxonomia,
  crearTaxonomia,
  renombrarTaxonomia,
  type Taxonomia,
} from "./taxonomias";

type Item = { id: string; name: string; productos: number };

export function ListaTaxonomia({
  tabla,
  items,
  placeholder,
}: {
  tabla: Taxonomia;
  items: Item[];
  placeholder: string;
}) {
  return (
    <div className="space-y-6">
      <FormNuevo tabla={tabla} placeholder={placeholder} />
      {items.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay ninguna.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {items.map((item) => (
            <Fila key={item.id} tabla={tabla} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FormNuevo({ tabla, placeholder }: { tabla: Taxonomia; placeholder: string }) {
  const [estado, accion] = useActionState(crearTaxonomia.bind(null, tabla), estadoInicial);

  return (
    <form action={accion} className="space-y-2">
      <div className="flex gap-2">
        <input name="nombre" required placeholder={placeholder} className={claseInput} />
        <BotonEnviar textoEnviando="Agregando…">Agregar</BotonEnviar>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}

function Fila({ tabla, item }: { tabla: Taxonomia; item: Item }) {
  const [estadoRenombrar, renombrar] = useActionState(
    renombrarTaxonomia.bind(null, tabla, item.id),
    estadoInicial,
  );
  const [estadoBorrar, borrar] = useActionState(
    borrarTaxonomia.bind(null, tabla, item.id),
    estadoInicial,
  );

  return (
    <li className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action={renombrar} className="flex flex-1 gap-2">
          <input
            name="nombre"
            defaultValue={item.name}
            required
            aria-label="Nombre"
            className={claseInput}
          />
          <BotonEnviar variante="secundario">Guardar</BotonEnviar>
        </form>
        <span className="w-24 text-sm text-neutral-500">
          {item.productos} {item.productos === 1 ? "producto" : "productos"}
        </span>
        <form action={borrar}>
          <BotonEnviar variante="peligro" textoEnviando="Borrando…">
            Borrar
          </BotonEnviar>
        </form>
      </div>
      <Mensaje estado={estadoRenombrar} />
      <Mensaje estado={estadoBorrar} />
    </li>
  );
}
