import type { Metadata } from "next";
import { Foto } from "@/components/tienda/foto";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { obtenerMarcas } from "@/lib/catalogo";
import { Listado, ListadoCargando } from "@/components/tienda/listado";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

// Página de una marca (/marcas/nike): logo, nombre y sus productos con los
// filtros. Se generan al compilar; una marca nueva, en su primera visita.
// Cache Components exige al menos un valor: si no hay marcas, uno de reserva que da 404.

export async function generateStaticParams() {
  const marcas = await obtenerMarcas();
  return marcas.length > 0 ? marcas.map((m) => ({ slug: m.slug })) : [{ slug: "__sin-marcas__" }];
}

async function buscarMarca(slug: string) {
  return (await obtenerMarcas()).find((m) => m.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/marcas/[slug]">): Promise<Metadata> {
  const marca = await buscarMarca((await params).slug);
  if (!marca) return {};
  return {
    title: marca.name,
    description: `Zapatillas y calzado ${marca.name}.`,
    openGraph: marca.logo ? { images: [marca.logo] } : undefined,
  };
}

// La marca sale de la URL: se lee dentro de un <Suspense>.
export default function MarcaPage({ params, searchParams }: PageProps<"/marcas/[slug]">) {
  return (
    <TransicionPagina>
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Suspense fallback={<TituloCargando />}>
          <Marca params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </TransicionPagina>
  );
}

function TituloCargando() {
  return (
    <div aria-hidden>
      <div className="mb-6 h-16 w-64 brillo rounded bg-neutral-100" />
      <ListadoCargando />
    </div>
  );
}

async function Marca({ params, searchParams }: PageProps<"/marcas/[slug]">) {
  const marca = await buscarMarca((await params).slug);
  if (!marca) notFound();

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        {marca.logo && (
          <span className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-[#fff]">
            <Foto src={marca.logo} alt="" fill sizes="112px" className="object-contain p-2" />
          </span>
        )}
        <h1 className="titulo-pagina">{marca.name}</h1>
      </div>
      <Suspense fallback={<ListadoCargando />}>
        <Listado
          searchParams={searchParams}
          incluye={(p) => p.marca?.slug === marca.slug}
          ruta={`/marcas/${marca.slug}`}
          sinMarca
        />
      </Suspense>
    </>
  );
}
