"use client";

import { useActionState, useState, useTransition } from "react";
import { estadoInicial, type EstadoForm } from "@/lib/form";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { CampoImagen } from "@/components/admin/campo-imagen";
import { claseInput, claseLabel, clasesBoton } from "@/components/admin/estilos";
import {
  borrarPortada,
  crearPortada,
  guardarAnuncio,
  guardarFotoPortada,
  guardarPortada,
  moverPortada,
} from "./actions";

export type Destino = { grupo: string; opciones: { url: string; nombre: string }[] };

export type DatosPortada = {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_url: string;
  active: boolean;
  foto: string | null;
  fotoCelular: string | null;
};

// ---------------------------------------------------------------------
// Anuncio
// ---------------------------------------------------------------------

export function FormAnuncio({
  texto,
  link,
  visible,
}: {
  texto: string;
  link: string | null;
  visible: boolean;
}) {
  const [estado, accion] = useActionState(guardarAnuncio, estadoInicial);

  return (
    <form action={accion} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="anuncio-texto" className={claseLabel}>
            Texto
          </label>
          <input
            id="anuncio-texto"
            name="texto"
            maxLength={120}
            defaultValue={texto}
            placeholder="Ej: Retirá gratis en el local"
            className={claseInput}
          />
        </div>
        <div>
          <label htmlFor="anuncio-link" className={claseLabel}>
            Link <span className="font-normal text-neutral-500">(opcional)</span>
          </label>
          <input
            id="anuncio-link"
            name="link"
            defaultValue={link ?? ""}
            placeholder="Ej: /outlet"
            className={claseInput}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="visible" type="checkbox" defaultChecked={visible} />
        Mostrar el anuncio en la tienda
      </label>
      <Mensaje estado={estado} />
      <BotonEnviar>Guardar anuncio</BotonEnviar>
    </form>
  );
}

// ---------------------------------------------------------------------
// Portadas
// ---------------------------------------------------------------------

export function BotonAgregarPortada() {
  const [pendiente, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => startTransition(async () => void (await crearPortada()))}
      className={clasesBoton("primario")}
    >
      {pendiente ? "Agregando…" : "Agregar portada"}
    </button>
  );
}

export function EditorPortada({
  portada,
  destinos,
  esPrimera,
  esUltima,
  numero,
}: {
  portada: DatosPortada;
  destinos: Destino[];
  esPrimera: boolean;
  esUltima: boolean;
  numero: number;
}) {
  const [estado, accion, guardando] = useActionState(guardarPortada.bind(null, portada.id), estadoInicial);
  const [pendiente, startTransition] = useTransition();
  const [errorOrden, setErrorOrden] = useState<string | null>(null);

  const conocido = destinos.some((g) => g.opciones.some((o) => o.url === portada.button_url));
  const [destino, setDestino] = useState(conocido ? portada.button_url : "otro");

  function ejecutar(accionOrden: () => Promise<EstadoForm>) {
    setErrorOrden(null);
    startTransition(async () => {
      const resultado = await accionOrden();
      if (resultado.error) setErrorOrden(resultado.error);
    });
  }

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">Portada {numero}</h2>
        {!portada.active && (
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">Oculta</span>
        )}
        {!portada.foto && (
          <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">Sin foto: se ve un fondo neutro</span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            aria-label="Subir de lugar"
            disabled={pendiente || esPrimera}
            onClick={() => ejecutar(() => moverPortada(portada.id, -1))}
            className={clasesBoton("secundario")}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Bajar de lugar"
            disabled={pendiente || esUltima}
            onClick={() => ejecutar(() => moverPortada(portada.id, 1))}
            className={clasesBoton("secundario")}
          >
            ↓
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              if (confirm("¿Borrar esta portada? No se puede deshacer.")) ejecutar(() => borrarPortada(portada.id));
            }}
            className={clasesBoton("peligro")}
          >
            Borrar
          </button>
        </div>
      </div>
      {errorOrden && (
        <p role="alert" className="mb-3 text-sm text-red-700">
          {errorOrden}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_12rem]">
        <CampoImagen
          carpeta="portada"
          url={portada.foto}
          etiqueta="Foto para compu"
          ayuda="Horizontal, recomendado 1920×800. El texto va arriba a la izquierda: dejá esa zona despejada."
          claseVista="aspect-[12/5] w-full"
          guardar={guardarFotoPortada.bind(null, portada.id, "compu")}
        />
        <CampoImagen
          carpeta="portada"
          url={portada.fotoCelular}
          etiqueta="Foto para celular (opcional)"
          ayuda="Vertical, 900×1200. Si no hay, se usa la de compu."
          claseVista="aspect-[3/4] w-full"
          guardar={guardarFotoPortada.bind(null, portada.id, "celular")}
        />
      </div>

      {/* Se envía con onSubmit (no con action) para que React no vacíe el formulario
          al volver: si hay un error, el dueño corrige sin perder lo que escribió. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const datos = new FormData(e.currentTarget);
          startTransition(() => accion(datos));
        }}
        className="mt-6 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`titulo-${portada.id}`} className={claseLabel}>
              Título
            </label>
            <input
              id={`titulo-${portada.id}`}
              name="titulo"
              maxLength={80}
              defaultValue={portada.title}
              className={claseInput}
            />
          </div>
          <div>
            <label htmlFor={`subtitulo-${portada.id}`} className={claseLabel}>
              Subtítulo
            </label>
            <input
              id={`subtitulo-${portada.id}`}
              name="subtitulo"
              maxLength={160}
              defaultValue={portada.subtitle}
              className={claseInput}
            />
          </div>
          <div>
            <label htmlFor={`boton-${portada.id}`} className={claseLabel}>
              Texto del botón
            </label>
            <input
              id={`boton-${portada.id}`}
              name="boton"
              maxLength={30}
              defaultValue={portada.button_text}
              placeholder="Comprar ahora"
              className={claseInput}
            />
          </div>
          <div>
            <label htmlFor={`destino-${portada.id}`} className={claseLabel}>
              El botón lleva a
            </label>
            <select
              id={`destino-${portada.id}`}
              name="destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className={claseInput}
            >
              {destinos.map((g) => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.opciones.map((o) => (
                    <option key={o.url} value={o.url}>
                      {o.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="otro">Otra dirección…</option>
            </select>
            {destino === "otro" && (
              <input
                name="linkOtro"
                aria-label="Dirección"
                defaultValue={conocido ? "" : portada.button_url}
                placeholder='"/productos?talle=40" o "https://…"'
                className={`${claseInput} mt-2`}
              />
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="visible" type="checkbox" defaultChecked={portada.active} />
          Mostrar en la tienda
        </label>
        <Mensaje estado={estado} />
        <button type="submit" disabled={guardando} className={clasesBoton("primario")}>
          {guardando ? "Guardando…" : "Guardar portada"}
        </button>
      </form>
    </li>
  );
}
