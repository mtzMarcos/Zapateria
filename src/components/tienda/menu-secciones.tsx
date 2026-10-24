"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconoChevron } from "./iconos";

type Enlace = { nombre: string; href: string };

/** Una sección del menú (Hombre, Mujer, Niños) con sus categorías y subcategorías. */
export type MenuSeccion = Enlace & {
  categorias: (Enlace & { subcategorias: Enlace[] })[];
};

// Demoras para que el menú no se abra al pasar el mouse de largo ni se
// cierre al cruzar el hueco entre el nombre y el panel.
const DEMORA_ABRIR = 80;
const DEMORA_CERRAR = 150;

/**
 * Menú principal en la compu (en el celular va en el ☰). Cada sección es un
 * link a su página; al pasar el mouse (o con el botón de la flecha, para el
 * teclado y las pantallas táctiles) se despliega un panel con sus categorías.
 * Se cierra con Escape, al salir con el mouse o el foco, o al elegir un link.
 */
export function NavegacionSecciones({ secciones }: { secciones: MenuSeccion[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const contenedor = useRef<HTMLElement>(null);

  const programar = (valor: string | null, demora: number) => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAbierta(valor), demora);
  };
  const cerrar = () => {
    clearTimeout(temporizador.current);
    setAbierta(null);
  };

  useEffect(() => () => clearTimeout(temporizador.current), []);

  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      cerrar();
      // El foco vuelve a la flecha de la sección que estaba abierta.
      contenedor.current?.querySelector<HTMLButtonElement>(`[data-seccion="${abierta}"]`)?.focus();
    };
    const alTocarAfuera = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) cerrar();
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alTocarAfuera);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alTocarAfuera);
    };
  }, [abierta]);

  return (
    <nav
      ref={contenedor}
      aria-label="Secciones"
      className="hidden flex-1 justify-center self-stretch md:flex"
      onPointerLeave={(e) => e.pointerType === "mouse" && programar(null, DEMORA_CERRAR)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) cerrar();
      }}
    >
      <ul className="flex gap-x-2 lg:gap-x-4">
        {secciones.map((s) => {
          const id = `menu-${s.href.slice(1)}`;
          const estaAbierta = abierta === s.href;
          return (
            <li
              key={s.href}
              className="flex items-center"
              onPointerEnter={(e) => e.pointerType === "mouse" && programar(s.href, DEMORA_ABRIR)}
            >
              <Link
                href={s.href}
                onClick={cerrar}
                className={`py-2 pl-2 text-sm font-medium underline-offset-8 hover:underline ${
                  estaAbierta ? "underline" : ""
                }`}
              >
                {s.nombre}
              </Link>
              {s.categorias.length > 0 && (
                <button
                  type="button"
                  data-seccion={s.href}
                  aria-expanded={estaAbierta}
                  aria-controls={id}
                  aria-label={`Categorías de ${s.nombre}`}
                  onClick={() => {
                    clearTimeout(temporizador.current);
                    setAbierta(estaAbierta ? null : s.href);
                  }}
                  className="flex size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <IconoChevron
                    className={`size-4 transition-transform duration-200 ${estaAbierta ? "rotate-180" : ""}`}
                  />
                </button>
              )}
              {estaAbierta && <PanelSeccion id={id} seccion={s} alElegir={cerrar} />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Panel desplegado debajo del encabezado, a lo ancho de la pantalla. Primera
 * columna: "Ver todo" y las categorías sin subcategorías; después, una columna
 * por cada categoría que tiene subcategorías (Zapatillas → Urbanas, Running…).
 */
function PanelSeccion({ id, seccion, alElegir }: { id: string; seccion: MenuSeccion; alElegir: () => void }) {
  const simples = seccion.categorias.filter((c) => c.subcategorias.length === 0);
  const conSubcategorias = seccion.categorias.filter((c) => c.subcategorias.length > 0);
  const link = "block py-1 text-sm text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-4";

  return (
    <div
      id={id}
      className="absolute inset-x-0 top-full z-40 border-b border-neutral-200 bg-white shadow-lg transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-16 gap-y-8 px-4 py-8">
        <div className="min-w-40">
          <Link href={seccion.href} onClick={alElegir} className="mb-2 block font-semibold hover:underline underline-offset-4">
            Ver todo {seccion.nombre}
          </Link>
          <ul>
            {simples.map((c) => (
              <li key={c.href}>
                <Link href={c.href} onClick={alElegir} className={link}>
                  {c.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {conSubcategorias.map((c) => (
          <div key={c.href} className="min-w-40">
            <Link href={c.href} onClick={alElegir} className="mb-2 block font-semibold hover:underline underline-offset-4">
              {c.nombre}
            </Link>
            <ul>
              {c.subcategorias.map((sub) => (
                <li key={sub.href}>
                  <Link href={sub.href} onClick={alElegir} className={link}>
                    {sub.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
