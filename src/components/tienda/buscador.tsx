"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatearPrecio } from "@/lib/formato";
import { IconoCerrar, IconoLupa } from "./iconos";

type Sugerencia = { slug: string; nombre: string; marca: string | null; precio: number; foto: string | null };

/**
 * Pide sugerencias a /api/buscar mientras se escribe (con una pausa de 200 ms
 * para no consultar en cada letra). Busca por nombre, marca y categoría.
 */
function useSugerencias(q: string) {
  const [resultado, setResultado] = useState<{ q: string; productos: Sugerencia[]; total: number } | null>(
    null,
  );

  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) return;
    const control = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(texto)}`, { signal: control.signal });
        if (res.ok) setResultado({ q: texto, ...(await res.json()) });
      } catch {
        // cancelada (se siguió escribiendo) o sin conexión: no se muestran sugerencias
      }
    }, 200);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [q]);

  // Solo valen las sugerencias del texto actual.
  return q.trim().length >= 2 && resultado?.q === q.trim() ? resultado : null;
}

function ListaSugerencias({
  q,
  resultado,
  alElegir,
  idLista,
}: {
  q: string;
  resultado: ReturnType<typeof useSugerencias>;
  alElegir: () => void;
  idLista: string;
}) {
  if (!resultado) return null;
  const urlTodos = `/productos?q=${encodeURIComponent(q.trim())}`;

  return (
    <div id={idLista} className="transition-opacity duration-200 starting:opacity-0">
      <p aria-live="polite" className="px-4 pt-3 pb-1 text-xs text-neutral-500">
        {resultado.total === 0
          ? `No encontramos productos para “${q.trim()}”.`
          : `${resultado.total} ${resultado.total === 1 ? "producto" : "productos"}`}
      </p>
      {resultado.productos.length > 0 && (
        <ul>
          {resultado.productos.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/productos/${p.slug}`}
                onClick={alElegir}
                className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-100 focus-visible:bg-neutral-100"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {p.foto && <Image src={p.foto} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.nombre}</span>
                  {p.marca && <span className="block text-xs text-neutral-500">{p.marca}</span>}
                </span>
                <span className="shrink-0 text-sm font-semibold">{formatearPrecio(p.precio)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {resultado.total > resultado.productos.length && (
        <Link
          href={urlTodos}
          onClick={alElegir}
          className="block border-t border-neutral-200 px-4 py-3 text-sm font-medium underline"
        >
          Ver los {resultado.total} resultados
        </Link>
      )}
    </div>
  );
}

/** Buscador del encabezado en la compu: campo con sugerencias debajo. */
export function BuscadorCompu() {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const resultado = useSugerencias(q);
  const contenedor = useRef<HTMLFormElement>(null);
  const idLista = useId();

  return (
    <form
      ref={contenedor}
      action="/productos"
      role="search"
      className="relative hidden w-full max-w-xs md:block"
      onFocus={() => setAbierto(true)}
      onBlur={(e) => {
        if (!contenedor.current?.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
      onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
    >
      <IconoLupa className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
      <input
        name="q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar zapatillas, marcas…"
        aria-label="Buscar productos"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={idLista}
        aria-expanded={abierto && !!resultado}
        autoComplete="off"
        className="h-10 w-full rounded-full border-0 bg-neutral-100 pr-4 pl-9 text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
      />
      {abierto && resultado && (
        <div className="absolute top-full right-0 z-40 mt-2 w-96 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0">
          <ListaSugerencias
            q={q}
            resultado={resultado}
            idLista={idLista}
            alElegir={() => {
              setAbierto(false);
              setQ("");
            }}
          />
        </div>
      )}
    </form>
  );
}

/** Buscador en el celular: la lupa abre un panel a pantalla completa. */
export function BuscadorCelular() {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const resultado = useSugerencias(q);
  const idLista = useId();

  useEffect(() => {
    if (!abierto) return;
    // Sin scroll de la página de atrás mientras el buscador está abierto.
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    setQ("");
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Buscar productos"
        className="flex size-10 items-center justify-center rounded-md hover:bg-neutral-100"
      >
        <IconoLupa className="size-6" />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buscar productos"
          className="fixed inset-0 z-50 overflow-y-auto bg-white transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0"
        >
          <form action="/productos" role="search" onSubmit={() => setAbierto(false)} className="flex items-center gap-2 border-b border-neutral-200 p-3">
            <div className="relative flex-1">
              <IconoLupa className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-neutral-500" />
              <input
                name="q"
                type="search"
                enterKeyHint="search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar zapatillas, marcas…"
                aria-label="Buscar productos"
                role="combobox"
                aria-autocomplete="list"
                aria-controls={idLista}
                aria-expanded={!!resultado}
                autoComplete="off"
                className="h-12 w-full rounded-full border-0 bg-neutral-100 pr-4 pl-10 text-base focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              />
            </div>
            <button type="button" onClick={cerrar} aria-label="Cerrar buscador" className="flex size-12 items-center justify-center">
              <IconoCerrar className="size-6" />
            </button>
          </form>
          {resultado ? (
            <ListaSugerencias q={q} resultado={resultado} idLista={idLista} alElegir={cerrar} />
          ) : (
            <p className="p-4 text-sm text-neutral-500">Escribí el nombre, la marca o el tipo de calzado.</p>
          )}
        </div>
      )}
    </div>
  );
}
