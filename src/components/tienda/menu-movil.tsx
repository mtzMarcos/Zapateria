"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { IconoCerrar, IconoMenu } from "./iconos";

type Enlace = { href: string; nombre: string };

/**
 * Menú del encabezado en el celular: un botón que abre la lista de categorías
 * debajo del encabezado. Se cierra al elegir un link, con Escape o tocando afuera.
 */
export function MenuMovil({ enlaces, secundarios }: { enlaces: Enlace[]; secundarios: Enlace[] }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  const cerrar = () => setAbierto(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        className="-ml-2 flex size-10 items-center justify-center rounded-md hover:bg-neutral-100"
      >
        {abierto ? <IconoCerrar className="size-6" /> : <IconoMenu className="size-6" />}
      </button>

      {abierto && (
        <>
          {/* Fondo oscuro: tocarlo cierra el menú. */}
          <div className="fixed inset-0 top-14 z-30 bg-neutral-900/40" onClick={cerrar} aria-hidden />
          <nav
            id={id}
            aria-label="Menú"
            className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-neutral-200 bg-white shadow-lg"
          >
            <ul className="px-4 py-2">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    onClick={cerrar}
                    className="block border-b border-neutral-100 py-3.5 text-lg font-medium"
                  >
                    {e.nombre}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="px-4 pt-2 pb-5">
              {secundarios.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} onClick={cerrar} className="block py-2 text-neutral-600">
                    {e.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
