import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { obtenerCatalogo, obtenerProducto, type ProductoDetalle } from "@/lib/catalogo";
import { filtrarProductos } from "@/lib/filtros";
import { descuento, formatearPrecio } from "@/lib/formato";
import { urlSitio } from "@/lib/sitio";
import { tienda } from "@/config/tienda";
import { Dato } from "@/components/tienda/dato";
import {
  IconoCambio,
  IconoCamion,
  IconoCandado,
  IconoLocal,
  IconoMas,
  IconoRegla,
} from "@/components/tienda/iconos";
import { GrillaProductos } from "@/components/tienda/producto-card";
import { Galeria } from "./galeria";
import { SelectorTalle } from "./selector-talle";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

// Las páginas de los productos se generan al compilar: cargan al instante y los
// datos para buscadores y redes (título, descripción, foto) van en el <head>.
// Un producto nuevo se genera en su primera visita y queda guardado; el panel
// las refresca al editar (etiqueta "catalogo"). Cache Components exige al menos
// un valor: si todavía no hay productos, uno de reserva que da 404.
export async function generateStaticParams() {
  const productos = await obtenerCatalogo();
  return productos.length > 0
    ? productos.map((p) => ({ slug: p.slug }))
    : [{ slug: "__sin-productos__" }];
}

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
    // Abajo deja lugar para la barra fija de "Agregar al carrito" del celular.
    <TransicionPagina>
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 pb-28 md:py-8">
        {/* El slug viene de la URL: se resuelve dentro del Suspense para que
            el resto de la página (encabezado, pie) se muestre al instante. */}
        <Suspense fallback={<FichaCargando />}>
          <Ficha params={params} />
        </Suspense>
      </main>
    </TransicionPagina>
  );
}

async function Ficha({ params }: Pick<PageProps<"/productos/[slug]">, "params">) {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) notFound();

  // Primero los de la misma categoría (Running) y, si faltan, los de su madre (Zapatillas).
  const catalogo = await obtenerCatalogo();
  const relacionados = [producto.categoria?.slug, producto.categoria?.madre?.slug]
    .filter((slug): slug is string => !!slug)
    .flatMap((categoria) => filtrarProductos(catalogo, { categoria, orden: "recientes" }))
    .filter((p, i, lista) => p.id !== producto.id && lista.findIndex((q) => q.id === p.id) === i)
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        // Se escapa el carácter "<" para que un texto del producto no pueda cerrar el <script>.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(producto)).replace(/</g, "\\u003c") }}
      />
      <nav className="mb-4 text-sm text-neutral-500 md:mb-6">
        <Link href="/productos" className="hover:text-neutral-900">
          Productos
        </Link>
        {[producto.categoria?.madre, producto.categoria].map(
          (c) =>
            c && (
              <span key={c.slug}>
                {" / "}
                <Link href={`/productos?categoria=${c.slug}`} className="hover:text-neutral-900">
                  {c.name}
                </Link>
              </span>
            ),
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <Galeria id={producto.id} fotos={producto.fotos} nombre={producto.name} />

        <div>
          {producto.marca && (
            <Link
              href={`/productos?marca=${producto.marca.slug}`}
              className="text-sm tracking-wide text-neutral-500 uppercase hover:text-neutral-900"
            >
              {producto.marca.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{producto.name}</h1>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold">{formatearPrecio(producto.price)}</span>
            {producto.precioAnterior !== null && (
              <>
                <span className="text-lg text-neutral-500 line-through">
                  <span className="sr-only">Antes </span>
                  {formatearPrecio(producto.precioAnterior)}
                </span>
                <span className="rounded-full bg-red-700 px-2.5 py-0.5 text-sm font-semibold text-white">
                  -{descuento(producto.precioAnterior, producto.price)}%
                </span>
              </>
            )}
          </p>

          <div className="mt-8">
            <SelectorTalle talles={producto.talles} precio={producto.price} />
          </div>

          <details className="group mt-6 border-y border-neutral-200">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <IconoRegla className="size-5 text-neutral-500" />
              Guía de talles
              <IconoMas className="ml-auto size-4 text-neutral-500 transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="pb-4 text-sm text-neutral-700">
              <Dato valor={tienda.guiaTalles} />
            </p>
          </details>

          <Beneficios />

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
          <GrillaProductos productos={relacionados} viajar={false} />
        </section>
      )}
    </>
  );
}

/** Envío, cambios, pago y retiro, debajo del botón de compra. */
function Beneficios() {
  const items = [
    { icono: IconoCamion, texto: "Envío a todo el país", detalle: "Costo según la zona, lo ves antes de pagar.", href: "/terminos" },
    { icono: IconoCambio, texto: "Cambios de talle", detalle: "Mirá la política de cambios.", href: "/cambios-y-devoluciones" },
    { icono: IconoCandado, texto: "Pago seguro con Mercado Pago", detalle: "Tarjetas, dinero en cuenta y más.", href: "/terminos" },
    { icono: IconoLocal, texto: "Retiro sin costo en el local", detalle: tienda.retiro.direccion, href: "/terminos" },
  ];
  return (
    <ul className="mt-6 space-y-4">
      {items.map(({ icono: Icono, texto, detalle, href }) => (
        <li key={texto}>
          <Link href={href} className="group flex gap-3">
            <Icono className="mt-0.5 size-5 shrink-0 text-neutral-500" />
            <span className="text-sm">
              <span className="block font-medium group-hover:underline">{texto}</span>
              <span className="text-neutral-500">
                <Dato valor={detalle} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
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
    // Misma forma que la ficha (foto, nombre, precio, talles y beneficios), para
    // que el pie de página no salte cuando llega el contenido.
    <div aria-hidden>
      <div className="mb-4 h-5 w-40 brillo rounded bg-neutral-100 md:mb-6" />
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="-mx-4 aspect-square brillo bg-neutral-100 md:mx-0 md:rounded-lg" />
        <div className="space-y-4">
          <div className="h-4 w-20 brillo rounded bg-neutral-100" />
          <div className="h-9 w-3/4 brillo rounded bg-neutral-100" />
          <div className="h-8 w-1/3 brillo rounded bg-neutral-100" />
          <div className="h-40 brillo rounded bg-neutral-100" />
          <div className="h-12 brillo rounded bg-neutral-100" />
          <div className="h-56 brillo rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
