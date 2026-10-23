"use client";

import { useRef } from "react";
import { IconoCerrar, IconoFiltros } from "@/components/tienda/iconos";

/**
 * Filtros del catálogo en el celular: un botón que abre un panel desde abajo
 * (un <dialog> nativo: atrapa el foco y se cierra con Escape). Los filtros son
 * links, así que al tocar uno se navega y el panel se cierra.
 */
export function PanelFiltros({
  activos,
  cantidad,
  children,
}: {
  activos: number;
  cantidad: number;
  children: React.ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrar = () => dialogo.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className="flex h-10 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-medium hover:border-neutral-900"
      >
        <IconoFiltros className="size-4" />
        Filtrar y ordenar
        {activos > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
            {activos}
          </span>
        )}
      </button>

      <dialog
        ref={dialogo}
        aria-label="Filtrar y ordenar"
        // Tocar el fondo (fuera del panel) o un filtro cierra el panel.
        onClick={(e) => {
          if (e.target === dialogo.current || (e.target as HTMLElement).closest("a")) cerrar();
        }}
        className="mt-auto mb-0 max-h-[85dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-neutral-900 backdrop:bg-neutral-900/40"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <p className="font-semibold">Filtrar y ordenar</p>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="-mr-2 flex size-10 items-center justify-center rounded-md hover:bg-neutral-100"
          >
            <IconoCerrar />
          </button>
        </div>
        <div className="space-y-5 px-4 py-5">{children}</div>
        <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={cerrar}
            className="w-full rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700"
          >
            Ver {cantidad} {cantidad === 1 ? "producto" : "productos"}
          </button>
        </div>
      </dialog>
    </>
  );
}
