"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Talle } from "@/lib/catalogo";
import { estadoInicial } from "@/lib/form";
import { agregarAlCarrito } from "@/app/(tienda)/carrito/actions";

export function SelectorTalle({ talles }: { talles: Talle[] }) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [estado, agregar, enviando] = useActionState(agregarAlCarrito, estadoInicial);
  const hayStock = talles.some((t) => t.stock > 0);

  if (!hayStock) {
    return <p className="font-medium text-red-700">Sin stock por el momento.</p>;
  }

  return (
    <form action={agregar}>
      <p className="mb-2 text-sm font-medium">Talle</p>
      <ul className="flex flex-wrap gap-2">
        {talles.map((t) => {
          const agotado = t.stock === 0;
          return (
            <li key={t.id}>
              <button
                type="button"
                disabled={agotado}
                onClick={() => setElegido(t.id)}
                aria-pressed={elegido === t.id}
                title={agotado ? "Sin stock" : undefined}
                className={`min-w-12 rounded-md border px-3 py-2 text-sm ${
                  elegido === t.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 hover:border-neutral-900"
                } disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300 disabled:line-through`}
              >
                {t.size}
              </button>
            </li>
          );
        })}
      </ul>

      <input type="hidden" name="variante" value={elegido ?? ""} />
      <button
        type="submit"
        disabled={!elegido || enviando}
        className="mt-6 w-full rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Agregando…" : elegido ? "Agregar al carrito" : "Elegí un talle"}
      </button>

      <div aria-live="polite" className="mt-3 text-center text-sm">
        {estado.error && <p className="text-red-700">{estado.error}</p>}
        {estado.ok && (
          <p className="text-green-700">
            {estado.ok}{" "}
            <Link href="/carrito" className="font-medium underline">
              Ver carrito
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
