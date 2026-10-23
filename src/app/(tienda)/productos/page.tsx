import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { obtenerCatalogo } from "@/lib/catalogo";
import {
  filtrarProductos,
  leerFiltros,
  opcionesDeFiltro,
  ordenes,
  urlCatalogo,
  type Filtros,
  type Orden,
} from "@/lib/filtros";
import { IconoCerrar } from "@/components/tienda/iconos";
import { GrillaCargando, GrillaProductos } from "@/components/tienda/producto-card";
import { PanelFiltros } from "./panel-filtros";

export const metadata: Metadata = {
  title: "Productos",
};

export default function ProductosPage({ searchParams }: PageProps<"/productos">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Productos</h1>
      {/* Los filtros dependen de la URL: se resuelven en el momento del request. */}
      <Suspense fallback={<CatalogoCargando />}>
        <Catalogo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalogo({ searchParams }: Pick<PageProps<"/productos">, "searchParams">) {
  const filtros = leerFiltros(await searchParams);
  const catalogo = await obtenerCatalogo();
  const opciones = opcionesDeFiltro(catalogo);
  const productos = filtrarProductos(catalogo, filtros);
  const hayFiltros = Boolean(filtros.categoria || filtros.marca || filtros.talle);

  // Filtros aplicados, para mostrarlos como chips que se quitan con un toque.
  const activos = [
    filtros.categoria && {
      nombre: opciones.categorias.find((c) => c.slug === filtros.categoria)?.name ?? filtros.categoria,
      quitar: urlCatalogo(filtros, { categoria: undefined }),
    },
    filtros.marca && {
      nombre: opciones.marcas.find((m) => m.slug === filtros.marca)?.name ?? filtros.marca,
      quitar: urlCatalogo(filtros, { marca: undefined }),
    },
    filtros.talle && { nombre: `Talle ${filtros.talle}`, quitar: urlCatalogo(filtros, { talle: undefined }) },
  ].filter((a) => !!a);

  // El mismo contenido va en línea en la compu y en el panel en el celular.
  const contenidoFiltros = (
    <>
        {opciones.categorias.length > 0 && (
          <FilaFiltro titulo="Categoría">
            <Chip href={urlCatalogo(filtros, { categoria: undefined })} activo={!filtros.categoria}>
              Todas
            </Chip>
            {opciones.categorias.map((c) => (
              <Chip
                key={c.slug}
                href={urlCatalogo(filtros, { categoria: c.slug })}
                activo={filtros.categoria === c.slug}
              >
                {c.name}
              </Chip>
            ))}
          </FilaFiltro>
        )}

        {opciones.marcas.length > 0 && (
          <FilaFiltro titulo="Marca">
            <Chip href={urlCatalogo(filtros, { marca: undefined })} activo={!filtros.marca}>
              Todas
            </Chip>
            {opciones.marcas.map((m) => (
              <Chip
                key={m.slug}
                href={urlCatalogo(filtros, { marca: m.slug })}
                activo={filtros.marca === m.slug}
              >
                {m.name}
              </Chip>
            ))}
          </FilaFiltro>
        )}

        {opciones.talles.length > 0 && (
          <FilaFiltro titulo="Talle">
            <Chip href={urlCatalogo(filtros, { talle: undefined })} activo={!filtros.talle}>
              Todos
            </Chip>
            {opciones.talles.map((t) => (
              <Chip
                key={t}
                href={urlCatalogo(filtros, { talle: t })}
                activo={filtros.talle === t}
              >
                {t}
              </Chip>
            ))}
          </FilaFiltro>
        )}

        <FilaFiltro titulo="Ordenar">
          {(Object.keys(ordenes) as Orden[]).map((orden) => (
            <Chip
              key={orden}
              href={urlCatalogo(filtros, { orden })}
              activo={filtros.orden === orden}
            >
              {ordenes[orden]}
            </Chip>
          ))}
        </FilaFiltro>
    </>
  );

  return (
    <>
      <div className="mb-8 hidden space-y-3 md:block">{contenidoFiltros}</div>

      <div className="mb-4 flex items-center justify-between gap-4 md:hidden">
        <PanelFiltros activos={activos.length} cantidad={productos.length}>
          {contenidoFiltros}
        </PanelFiltros>
        <p className="text-sm text-neutral-500">
          {productos.length} {productos.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      {activos.length > 0 && (
        <ul className="mb-5 flex flex-wrap gap-2 md:hidden" aria-label="Filtros aplicados">
          {activos.map((a) => (
            <li key={a.quitar}>
              <Link
                href={a.quitar}
                scroll={false}
                aria-label={`Quitar filtro ${a.nombre}`}
                className="flex items-center gap-1.5 rounded-full bg-neutral-100 py-1.5 pr-2.5 pl-3.5 text-sm"
              >
                {a.nombre}
                <IconoCerrar className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mb-4 hidden text-sm text-neutral-500 md:block">
        {productos.length} {productos.length === 1 ? "producto" : "productos"}
        {hayFiltros && (
          <>
            {" · "}
            <Link href={urlCatalogo({ orden: filtros.orden }, {})} className="underline">
              Quitar filtros
            </Link>
          </>
        )}
      </p>

      {/* Título para lectores de pantalla: ordena los títulos (h1 → h2 → h3 de las tarjetas). */}
      <h2 className="sr-only">Resultados</h2>
      {productos.length > 0 ? (
        <GrillaProductos productos={productos} prioridad={4} />
      ) : (
        <SinResultados filtros={filtros} hayFiltros={hayFiltros} />
      )}
    </>
  );
}

/** Mientras carga: reserva el lugar de los filtros para que la grilla no salte. */
function CatalogoCargando() {
  return (
    <div aria-hidden>
      <div className="mb-8 hidden space-y-3 md:block">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-2/3 animate-pulse rounded-full bg-neutral-100" />
        ))}
      </div>
      <div className="mb-4 h-10 w-44 animate-pulse rounded-full bg-neutral-100 md:hidden" />
      <div className="mb-4 hidden h-5 w-24 animate-pulse rounded bg-neutral-100 md:block" />
      <GrillaCargando />
    </div>
  );
}

function FilaFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <span className="text-sm font-medium text-neutral-500 md:w-20">{titulo}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={`rounded-full border px-3 py-1 text-sm ${
        activo
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 hover:border-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}

function SinResultados({ filtros, hayFiltros }: { filtros: Filtros; hayFiltros: boolean }) {
  if (!hayFiltros) {
    return <p className="text-neutral-500">Muy pronto vas a encontrar nuestros productos acá.</p>;
  }
  return (
    <p className="text-neutral-500">
      No hay productos con esos filtros.{" "}
      <Link href={urlCatalogo({ orden: filtros.orden }, {})} className="underline">
        Ver todos
      </Link>
    </p>
  );
}
