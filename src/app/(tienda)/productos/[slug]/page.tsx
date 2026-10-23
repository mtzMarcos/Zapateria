import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { obtenerCatalogo, obtenerProducto, type ProductoDetalle } from "@/lib/catalogo";
import { filtrarProductos } from "@/lib/filtros";
import { formatearPrecio } from "@/lib/formato";
import { urlSitio } from "@/lib/sitio";
import { GrillaProductos } from "@/components/tienda/producto-card";
import { Galeria } from "./galeria";
import { SelectorTalle } from "./selector-talle";

export async function generateMetadata({
  params,
}: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) return {};

  const descripcion = producto.description.slice(0, 160) || undefined;
  return {
    title: producto.name,
    description: descripcion,
    alternates: { canonical: `/productos/${producto.slug}` },
    openGraph: {
      title: producto.name,
      description: descripcion,
      images: producto.portada ? [producto.portada] : undefined,
    },
  };
}

export default function ProductoPage({ params }: PageProps<"/productos/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* El slug viene de la URL: se resuelve dentro del Suspense para que
          el resto de la página (encabezado, pie) se muestre al instante. */}
      <Suspense fallback={<FichaCargando />}>
        <Ficha params={params} />
      </Suspense>
    </main>
  );
}

async function Ficha({ params }: Pick<PageProps<"/productos/[slug]">, "params">) {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) notFound();

  const relacionados = producto.categoria
    ? filtrarProductos(await obtenerCatalogo(), {
        categoria: producto.categoria.slug,
        orden: "recientes",
      })
        .filter((p) => p.id !== producto.id)
        .slice(0, 4)
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        // El JSON se escapa (< → <) para que un texto del producto no pueda cerrar el <script>.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(producto)).replace(/</g, "\\u003c") }}
      />
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/productos" className="hover:text-neutral-900">
          Productos
        </Link>
        {producto.categoria && (
          <>
            {" / "}
            <Link
              href={`/productos?categoria=${producto.categoria.slug}`}
              className="hover:text-neutral-900"
            >
              {producto.categoria.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <Galeria fotos={producto.fotos} nombre={producto.name} />

        <div>
          {producto.marca && (
            <Link
              href={`/productos?marca=${producto.marca.slug}`}
              className="text-sm tracking-wide text-neutral-500 uppercase hover:text-neutral-900"
            >
              {producto.marca.name}
            </Link>
          )}
          <h1 className="mt-1 text-3xl font-bold">{producto.name}</h1>
          <p className="mt-3 text-2xl font-semibold">{formatearPrecio(producto.price)}</p>

          <div className="mt-8">
            <SelectorTalle talles={producto.talles} />
          </div>

          {producto.description && (
            <div className="mt-10 border-t border-neutral-200 pt-6">
              <h2 className="mb-2 font-semibold">Descripción</h2>
              <p className="whitespace-pre-line text-neutral-700">{producto.description}</p>
            </div>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-xl font-semibold">También te puede interesar</h2>
          <GrillaProductos productos={relacionados} />
        </section>
      )}
    </>
  );
}

/** Datos del producto para Google (schema.org/Product): precio, stock, marca y fotos. */
function datosEstructurados(producto: ProductoDetalle) {
  const url = `${urlSitio()}/productos/${producto.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.name,
    description: producto.description || undefined,
    image: producto.fotos.length > 0 ? producto.fotos : undefined,
    url,
    brand: producto.marca ? { "@type": "Brand", name: producto.marca.name } : undefined,
    category: producto.categoria?.name,
    offers: {
      "@type": "Offer",
      url,
      price: producto.price,
      priceCurrency: "ARS",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        producto.stockTotal > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

function FichaCargando() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12" aria-hidden>
      <div className="aspect-square animate-pulse rounded-lg bg-neutral-100" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="h-6 w-1/4 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
