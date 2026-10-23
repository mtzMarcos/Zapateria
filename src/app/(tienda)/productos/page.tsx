import type { Metadata } from "next";
import { Suspense } from "react";
import { Listado, ListadoCargando } from "@/components/tienda/listado";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

export const metadata: Metadata = {
  title: "Productos",
};

export default function ProductosPage({ searchParams }: PageProps<"/productos">) {
  return (
    <TransicionPagina>
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Productos</h1>
        {/* Los filtros y la búsqueda dependen de la URL: se resuelven en el momento del request. */}
        <Suspense fallback={<ListadoCargando />}>
          <Listado searchParams={searchParams} />
        </Suspense>
      </main>
    </TransicionPagina>
  );
}
