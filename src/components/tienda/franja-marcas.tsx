"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Marca } from "@/lib/catalogo";
import { IconoFlecha } from "./iconos";

/**
 * Franja de marcas: cada tarjeta muestra el logo (si tiene) y el nombre, y
 * lleva a /marcas/<marca>.
 * - Si las marcas entran en una fila, quedan centradas: la primera y la última
 *   tarjeta tienen margen automático, que reparte el espacio que sobra y vale 0
 *   cuando no entran (así no se corta la primera al deslizar).
 * - Si no entran, se desliza con el dedo y, en la compu, con flechas.
 */
export function FranjaMarcas({ marcas }: { marcas: Marca[] }) {
  const pista = useRef<HTMLUListElement>(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: true });

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
          <li key={m.slug} className="w-36 shrink-0 snap-start first:ml-auto last:mr-auto sm:w-44">
            {/* La tarjeta es blanca en los dos modos: los logos vienen pensados para fondo
                blanco o transparente con trazo oscuro, y así se ven bien con la página clara u oscura. */}
            <Link
              href={`/marcas/${m.slug}`}
              className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-[#fff] p-3 text-center text-[#171717] transition-colors hover:border-neutral-900 sm:h-36"
            >
              {m.logo ? (
                <>
                  <span className="relative h-14 w-full sm:h-16">
                    <Image src={m.logo} alt="" fill sizes="176px" className="object-contain" />
                  </span>
                  <span className="text-sm font-medium">{m.name}</span>
                </>
              ) : (
                <span className="text-lg font-bold tracking-wide uppercase">{m.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {/* Flechas solo si las marcas no entran en una fila (y en la compu). */}
      {!(bordes.inicio && bordes.fin) && (
        <>
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={bordes.inicio}
            aria-label="Ver marcas anteriores"
            className="absolute top-[calc(50%-0.25rem)] -left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white shadow disabled:hidden md:flex"
          >
            <IconoFlecha direccion="izquierda" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={bordes.fin}
            aria-label="Ver más marcas"
            className="absolute top-[calc(50%-0.25rem)] -right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white shadow disabled:hidden md:flex"
          >
            <IconoFlecha />
          </button>
        </>
      )}
    </div>
  );
}
