"use client";

import { useActionState, useState, useTransition } from "react";
import { estadoInicial, type EstadoForm } from "@/lib/form";
import { Mensaje } from "@/components/admin/ui";
import { claseInput, clasesBoton } from "@/components/admin/estilos";
import { borrarCategoria, crearCategoria, guardarCategoria, moverCategoria } from "./actions";

type Fila = { id: string; name: string; productos: number };
export type CategoriaPanel = Fila & { subcategorias: Fila[] };

type Madre = { id: string; name: string };

export function ListaCategorias({ categorias }: { categorias: CategoriaPanel[] }) {
  const madres = categorias.map(({ id, name }) => ({ id, name }));

  return (
    <div className="space-y-6">
      <FormNueva madres={madres} />
      {categorias.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay ninguna.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {categorias.map((c, i) => (
            <li key={c.id}>
              <FilaCategoria
                categoria={c}
                madre={null}
                madres={madres}
                tieneSubcategorias={c.subcategorias.length > 0}
                esPrimera={i === 0}
                esUltima={i === categorias.length - 1}
              />
              {c.subcategorias.length > 0 && (
                <ul
                  aria-label={`Subcategorías de ${c.name}`}
                  className="mr-3 mb-3 ml-6 divide-y divide-neutral-200 border-l-2 border-neutral-200"
                >
                  {c.subcategorias.map((s, j) => (
                    <li key={s.id}>
                      <FilaCategoria
                        categoria={s}
                        madre={c.id}
                        madres={madres}
                        tieneSubcategorias={false}
                        esPrimera={j === 0}
                        esUltima={j === c.subcategorias.length - 1}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Desplegable "Dentro de": vacío = categoría principal. */
function SelectMadre({
  madres,
  valor,
  excluir,
  deshabilitado,
  id,
}: {
  madres: Madre[];
  valor: string | null;
  excluir?: string;
  deshabilitado?: boolean;
  id: string;
}) {
  return (
    <select
      id={id}
      name="madre"
      defaultValue={valor ?? ""}
      disabled={deshabilitado}
      title={deshabilitado ? "Tiene subcategorías: no puede ir dentro de otra." : undefined}
      className={`${claseInput} sm:w-48`}
    >
      <option value="">Principal</option>
      {madres
        .filter((m) => m.id !== excluir)
        .map((m) => (
          <option key={m.id} value={m.id}>
            Dentro de {m.name}
          </option>
        ))}
    </select>
  );
}

function FormNueva({ madres }: { madres: Madre[] }) {
  const [estado, accion, enviando] = useActionState(crearCategoria, estadoInicial);
  const [, startTransition] = useTransition();

  return (
    // onSubmit (no action): si hay un error, no se borra lo escrito.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formulario = e.currentTarget;
        const datos = new FormData(formulario);
        startTransition(async () => {
          await accion(datos);
          formulario.querySelector<HTMLInputElement>("[name=nombre]")?.select();
        });
      }}
      className="space-y-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="nombre"
          required
          aria-label="Nombre de la nueva categoría"
          placeholder="Nueva categoría (ej: Zapatillas o Running)"
          className={claseInput}
        />
        <SelectMadre id="nueva-madre" madres={madres} valor={null} />
        <button type="submit" disabled={enviando} className={clasesBoton("primario")}>
          {enviando ? "Agregando…" : "Agregar"}
        </button>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}

function FilaCategoria({
  categoria,
  madre,
  madres,
  tieneSubcategorias,
  esPrimera,
  esUltima,
}: {
  categoria: Fila;
  madre: string | null;
  madres: Madre[];
  tieneSubcategorias: boolean;
  esPrimera: boolean;
  esUltima: boolean;
}) {
  const [estado, accion, guardando] = useActionState(guardarCategoria.bind(null, categoria.id), estadoInicial);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function ejecutar(otraAccion: () => Promise<EstadoForm>) {
    setError(null);
    startTransition(async () => {
      const resultado = await otraAccion();
      if (resultado.error) setError(resultado.error);
    });
  }

  return (
    <div className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const datos = new FormData(e.currentTarget);
            startTransition(() => accion(datos));
          }}
          className="flex min-w-64 flex-1 flex-col gap-2 sm:flex-row"
        >
          <input
            name="nombre"
            defaultValue={categoria.name}
            required
            aria-label="Nombre"
            className={claseInput}
          />
          <SelectMadre
            id={`madre-${categoria.id}`}
            madres={madres}
            valor={madre}
            excluir={categoria.id}
            deshabilitado={tieneSubcategorias}
          />
          <button type="submit" disabled={guardando} className={clasesBoton("secundario")}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </form>
        <span className="w-24 text-sm text-neutral-500">
          {categoria.productos} {categoria.productos === 1 ? "producto" : "productos"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`Subir ${categoria.name}`}
            disabled={pendiente || esPrimera}
            onClick={() => ejecutar(() => moverCategoria(categoria.id, -1))}
            className={clasesBoton("secundario")}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Bajar ${categoria.name}`}
            disabled={pendiente || esUltima}
            onClick={() => ejecutar(() => moverCategoria(categoria.id, 1))}
            className={clasesBoton("secundario")}
          >
            ↓
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => ejecutar(() => borrarCategoria(categoria.id))}
            className={clasesBoton("peligro")}
          >
            Borrar
          </button>
        </div>
      </div>
      <Mensaje estado={estado} />
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
