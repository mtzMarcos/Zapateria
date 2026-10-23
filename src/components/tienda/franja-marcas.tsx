"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Marca } from "@/lib/catalogo";
import { IconoFlecha } from "./iconos";

/**
 * Franja de marcas: se desliza con el dedo y, en la compu, con flechas. Cada
 * marca muestra su logo (si tiene) y el nombre, y lleva a /marcas/<marca>.
 */
export function FranjaMarcas({ marcas }: { marcas: Marca[] }) {
  const pista = useRef<HTMLUListElement>(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });

  const medir = () => {
    const el = pista.current;
    if (!el) return;
    setBordes({ inicio: el.scrollLeft <= 4, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  const mover = (direccion: -1 | 1) => {
    const el = pista.current;
    el?.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={pista}
        onScroll={medir}
        className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {marcas.map((m) => (
          <li key={m.slug} className="w-32 shrink-0 snap-start sm:w-40">
            {/* relative: el nombre oculto (sr-only) queda dentro de la franja y no ensancha la página. */}
            <Link href={`/marcas/${m.slug}`} className="group relative block">
              {/* Los logos suelen venir pensados para fondo blanco: el recuadro es blanco en los dos modos. */}
              <span className="relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-[#fff] px-4 transition-colors group-hover:border-neutral-900">
                {m.logo ? (
                  <Image src={m.logo} alt="" fill sizes="160px" className="object-contain p-4" />
                ) : (
                  <span aria-hidden className="text-center text-lg font-bold tracking-wide text-[#171717] uppercase">
                    {m.name}
                  </span>
                )}
              </span>
              {/* Sin logo, el nombre ya está en el recuadro. */}
              {m.logo ? (
                <span className="mt-2 block text-center text-sm font-medium group-hover:underline">{m.name}</span>
              ) : (
                <span className="sr-only">{m.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {!(bordes.inicio && bordes.fin) && (
        <>
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={bordes.inicio}
            aria-label="Ver marcas anteriores"
            className="absolute top-[calc(50%-1rem)] -left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white shadow disabled:hidden md:flex"
          >
            <IconoFlecha direccion="izquierda" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={bordes.fin}
            aria-label="Ver más marcas"
            className="absolute top-[calc(50%-1rem)] -right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white shadow disabled:hidden md:flex"
          >
            <IconoFlecha />
          </button>
        </>
      )}
    </div>
  );
}
