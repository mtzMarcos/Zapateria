import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buscarSeccion, secciones } from "@/lib/secciones";
import { Listado, ListadoCargando } from "@/components/tienda/listado";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

// Secciones del menú principal: /mujer, /hombre, /ninos, /tendencias, /deportes
// y /outlet. Cada una es el catálogo con los filtros, limitado a sus productos
// (ver src/lib/secciones.ts). Cualquier otra dirección da 404.

export function generateStaticParams() {
  return secciones.map((s) => ({ seccion: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[seccion]">): Promise<Metadata> {
  const seccion = buscarSeccion((await params).seccion);
  if (!seccion) return {};
  return { title: seccion.nombre, description: seccion.descripcion };
}

// La sección sale de la URL: se lee dentro de un <Suspense> (las 6 secciones
// se generan al compilar, así que en la práctica aparecen al instante).
export default function SeccionPage({ params, searchParams }: PageProps<"/[seccion]">) {
  return (
    <TransicionPagina>
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Suspense fallback={<TituloCargando />}>
          <Seccion params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </TransicionPagina>
  );
}

async function Seccion({ params, searchParams }: PageProps<"/[seccion]">) {
  const seccion = buscarSeccion((await params).seccion);
  if (!seccion) notFound();

  return (
    <>
      <h1 className="titulo-pagina">{seccion.nombre}</h1>
      <p className="mt-2 mb-6 text-neutral-600">{seccion.descripcion}</p>
      <Suspense fallback={<ListadoCargando />}>
        <Listado searchParams={searchParams} incluye={seccion.incluye} ruta={`/${seccion.slug}`} />
      </Suspense>
    </>
  );
}

function TituloCargando() {
  return (
    <div aria-hidden>
      <div className="h-10 w-48 brillo rounded bg-neutral-100" />
      <div className="mt-3 mb-6 h-5 w-72 brillo rounded bg-neutral-100" />
      <ListadoCargando />
    </div>
  );
}
