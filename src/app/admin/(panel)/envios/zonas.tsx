"use client";

import { useActionState } from "react";
import { estadoInicial } from "@/lib/form";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { claseInput } from "@/components/admin/estilos";
import { borrarZona, crearZona, guardarZona } from "./actions";

type Zona = { id: string; name: string; price: number; active: boolean };

export function Zonas({ zonas }: { zonas: Zona[] }) {
  return (
    <div className="space-y-6">
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {zonas.map((zona) => (
          <FilaZona key={zona.id} zona={zona} />
        ))}
      </ul>
      <NuevaZona />
    </div>
  );
}

function CamposZona({ zona }: { zona?: Zona }) {
  return (
    <>
      <input
        name="nombre"
        defaultValue={zona?.name}
        required
        placeholder="Nombre de la zona"
        aria-label="Nombre"
        className={`${claseInput} min-w-40 flex-1`}
      />
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-500">$</span>
        <input
          name="precio"
          type="number"
          min={0}
          step="0.01"
          defaultValue={zona?.price}
          required
          placeholder="Precio"
          aria-label="Precio"
          className={`${claseInput} w-32`}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="activa" type="checkbox" defaultChecked={zona?.active ?? true} />
        Activa
      </label>
    </>
  );
}

function FilaZona({ zona }: { zona: Zona }) {
  const [estadoGuardar, guardar] = useActionState(guardarZona.bind(null, zona.id), estadoInicial);
  const [estadoBorrar, borrar] = useActionState(borrarZona.bind(null, zona.id), estadoInicial);

  return (
    <li className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <form action={guardar} className="flex flex-1 flex-wrap items-center gap-3">
          <CamposZona zona={zona} />
          <BotonEnviar variante="secundario">Guardar</BotonEnviar>
        </form>
        <form action={borrar}>
          <BotonEnviar variante="peligro" textoEnviando="Borrando…">
            Borrar
          </BotonEnviar>
        </form>
      </div>
      <Mensaje estado={estadoGuardar} />
      <Mensaje estado={estadoBorrar} />
    </li>
  );
}

function NuevaZona() {
  const [estado, accion] = useActionState(crearZona, estadoInicial);

  return (
    <form action={accion} className="space-y-2 rounded-lg border border-dashed border-neutral-300 p-3">
      <p className="text-sm font-medium">Agregar zona</p>
      <div className="flex flex-wrap items-center gap-3">
        <CamposZona />
        <BotonEnviar textoEnviando="Agregando…">Agregar</BotonEnviar>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}
