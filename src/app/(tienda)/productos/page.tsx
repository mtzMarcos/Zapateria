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
import { GrillaCargando, GrillaProductos } from "@/components/tienda/producto-card";

export const metadata: Metadata = {
  title: "Productos",
};

export default function ProductosPage({ searchParams }: PageProps<"/productos">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Productos</h1>
      {/* Los filtros dependen de la URL: se resuelven en el momento del request. */}
      <Suspense fallback={<GrillaCargando />}>
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

  return (
    <>
      <div className="mb-8 space-y-3">
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
      </div>

      <p className="mb-4 text-sm text-neutral-500">
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

      {productos.length > 0 ? (
        <GrillaProductos productos={productos} />
      ) : (
        <SinResultados filtros={filtros} hayFiltros={hayFiltros} />
      )}
    </>
  );
}

function FilaFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-sm font-medium text-neutral-500">{titulo}</span>
      {children}
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
