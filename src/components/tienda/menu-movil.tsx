"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { IconoCerrar, IconoChevron, IconoMenu } from "./iconos";
import type { MenuSeccion } from "./menu-secciones";

type Enlace = { href: string; nombre: string };

/**
 * Menú del encabezado en el celular: un botón que abre, debajo del encabezado,
 * las secciones (plegables, con sus categorías), otros links principales y los
 * secundarios. Se cierra al elegir un link, con Escape o tocando afuera.
 */
export function MenuMovil({
  secciones,
  enlaces,
  secundarios,
}: {
  secciones: MenuSeccion[];
  enlaces: Enlace[];
  secundarios: Enlace[];
}) {
  const [abierto, setAbierto] = useState(false);
  // Dónde termina el encabezado (cambia si se ve la barra del anuncio arriba).
  const [abajo, setAbajo] = useState(56);
  const boton = useRef<HTMLButtonElement>(null);
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
        ref={boton}
        onClick={() => {
          setAbajo(boton.current?.closest("header")?.getBoundingClientRect().bottom ?? 56);
          setAbierto(!abierto);
        }}
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
          <div
            className="fixed inset-x-0 bottom-0 z-30 bg-neutral-900/40 transition-opacity duration-200 starting:opacity-0"
            style={{ top: abajo }}
            onClick={cerrar}
            aria-hidden
          />
          <nav
            id={id}
            aria-label="Menú"
            style={{ maxHeight: `calc(100dvh - ${abajo}px)` }}
            className="absolute inset-x-0 top-full z-40 overflow-y-auto border-b border-neutral-200 bg-white shadow-lg transition-[opacity,translate] duration-200 ease-out starting:-translate-y-2 starting:opacity-0"
          >
            <ul className="px-4 py-2">
              {secciones.map((s) => (
                <li key={s.href}>
                  <SeccionPlegable seccion={s} alElegir={cerrar} />
                </li>
              ))}
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

/** Hombre, Mujer, Niños: se tocan para ver sus categorías (las subcategorías van debajo, con sangría). */
function SeccionPlegable({ seccion, alElegir }: { seccion: MenuSeccion; alElegir: () => void }) {
  const link = "block py-2 text-neutral-700";
  return (
    <details className="group border-b border-neutral-100">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-lg font-medium [&::-webkit-details-marker]:hidden">
        {seccion.nombre}
        <IconoChevron className="size-5 text-neutral-500 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="pb-3 pl-3">
        <li>
          <Link href={seccion.href} onClick={alElegir} className={`${link} font-medium text-neutral-900`}>
            Ver todo {seccion.nombre}
          </Link>
        </li>
        {seccion.categorias.map((c) => (
          <li key={c.href}>
            <Link href={c.href} onClick={alElegir} className={link}>
              {c.nombre}
            </Link>
            {c.subcategorias.length > 0 && (
              <ul className="ml-1 border-l border-neutral-200 pl-3">
                {c.subcategorias.map((sub) => (
                  <li key={sub.href}>
                    <Link href={sub.href} onClick={alElegir} className={link}>
                      {sub.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
