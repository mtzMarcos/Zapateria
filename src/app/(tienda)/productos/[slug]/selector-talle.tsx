"use client";

import { useState } from "react";
import type { Talle } from "@/lib/catalogo";

// Por ahora solo muestra los talles disponibles. En la Etapa 4 el botón
// agrega el producto al carrito con el talle elegido.
export function SelectorTalle({ talles }: { talles: Talle[] }) {
  const [elegido, setElegido] = useState<string | null>(null);
  const hayStock = talles.some((t) => t.stock > 0);

  if (!hayStock) {
    return <p className="font-medium text-red-700">Sin stock por el momento.</p>;
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Talle</p>
      <ul className="flex flex-wrap gap-2">
        {talles.map((t) => {
          const agotado = t.stock === 0;
          return (
            <li key={t.size}>
              <button
                type="button"
                disabled={agotado}
                onClick={() => setElegido(t.size)}
                aria-pressed={elegido === t.size}
                title={agotado ? "Sin stock" : undefined}
                className={`min-w-12 rounded-md border px-3 py-2 text-sm ${
                  elegido === t.size
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

      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-md bg-neutral-900 px-6 py-3 font-medium text-white disabled:opacity-50"
      >
        Agregar al carrito
      </button>
      <p className="mt-2 text-center text-sm text-neutral-500">La compra online estará disponible pronto.</p>
    </div>
  );
}
