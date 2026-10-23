"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import type { Talle } from "@/lib/catalogo";
import { estadoInicial } from "@/lib/form";
import { formatearPrecio } from "@/lib/formato";
import { agregarAlCarrito } from "@/app/(tienda)/carrito/actions";

export function SelectorTalle({ talles, precio }: { talles: Talle[]; precio: number }) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [falta, setFalta] = useState(false);
  const [estado, agregar, enviando] = useActionState(agregarAlCarrito, estadoInicial);
  const lista = useRef<HTMLFieldSetElement>(null);
  const hayStock = talles.some((t) => t.stock > 0);

  if (!hayStock) {
    return <p className="font-medium text-red-700">Sin stock por el momento.</p>;
  }

  return (
    <form action={agregar}>
      <fieldset ref={lista} tabIndex={-1} className="scroll-mt-24 outline-none">
        <legend className="mb-2 text-sm font-medium">
          Talle
          {falta && <span className="ml-2 font-normal text-red-700">Elegí un talle para continuar</span>}
        </legend>
        <ul className="flex flex-wrap gap-2">
          {talles.map((t) => {
            const agotado = t.stock === 0;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={agotado}
                  onClick={() => {
                    setElegido(t.id);
                    setFalta(false);
                  }}
                  aria-pressed={elegido === t.id}
                  aria-label={agotado ? `Talle ${t.size}, sin stock` : `Talle ${t.size}`}
                  className={`h-12 min-w-12 rounded-md border px-3 text-sm ${
                    elegido === t.id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 hover:border-neutral-900"
                  } disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-500 disabled:line-through`}
                >
                  {t.size}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <input type="hidden" name="variante" value={elegido ?? ""} />

      {/* En el celular, barra fija abajo con el precio y el botón, siempre a mano. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col border-t border-neutral-200 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:mt-6 md:border-0 md:p-0">
        <Mensaje estado={estado} />
        <div className="flex items-center gap-4">
          <p className="shrink-0 text-lg font-semibold md:hidden">{formatearPrecio(precio)}</p>
          {elegido ? (
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-700"
            >
              {enviando ? "Agregando…" : "Agregar al carrito"}
            </button>
          ) : (
            // Sin talle elegido: lleva a la lista de talles en vez de quedar deshabilitado.
            <button
              type="button"
              onClick={() => {
                setFalta(true);
                lista.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                lista.current?.focus({ preventScroll: true });
              }}
              className="w-full rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700"
            >
              Elegí tu talle
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Mensaje({ estado }: { estado: { error?: string; ok?: string } }) {
  return (
    <div aria-live="polite" className="text-center text-sm md:order-last md:mt-3">
      {estado.error && <p className="mb-2 text-red-700 md:mb-0">{estado.error}</p>}
      {estado.ok && (
        <p className="mb-2 text-green-700 md:mb-0">
          {estado.ok}{" "}
          <Link href="/carrito" className="font-medium underline">
            Ver carrito
          </Link>
        </p>
      )}
    </div>
  );
}
