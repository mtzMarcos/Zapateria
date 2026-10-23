import Link from "next/link";
import { tienda } from "@/config/tienda";
import { obtenerCatalogo, obtenerMarcas } from "@/lib/catalogo";
import { filtrarProductos, opcionesDeFiltro } from "@/lib/filtros";
import { obtenerPortadas } from "@/lib/portada";
import { CarruselPortada } from "@/components/tienda/carrusel-portada";
import { FranjaMarcas } from "@/components/tienda/franja-marcas";
import { GrillaProductos } from "@/components/tienda/producto-card";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

export default async function Home() {
  const [catalogo, portadas, marcas] = await Promise.all([obtenerCatalogo(), obtenerPortadas(), obtenerMarcas()]);
  const { categorias } = opcionesDeFiltro(catalogo);
  // Los más nuevos, con los que tienen stock primero.
  const novedades = filtrarProductos(catalogo, { orden: "recientes" }).slice(0, 8);

  return (
    <TransicionPagina>
      <div>
        <h1 className="sr-only">{tienda.nombre}</h1>

        {portadas.length > 0 ? (
          <CarruselPortada portadas={portadas} />
        ) : (
          // Sin portadas cargadas en el panel: presentación simple.
          <section className="mx-auto w-full max-w-7xl px-4 py-16 text-center sm:py-24">
            <p className="text-4xl font-bold tracking-tight sm:text-5xl">{tienda.nombre}</p>
            <p className="mt-4 text-lg text-neutral-600">{tienda.descripcion}</p>
            <Link
              href="/productos"
              className="mt-8 inline-block rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700"
            >
              Ver productos
            </Link>
          </section>
        )}

        <main className="mx-auto w-full max-w-7xl px-4">
          <section className="mt-12 sm:mt-16">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="titulo-seccion">Novedades</h2>
              {catalogo.length > novedades.length && (
                <Link href="/productos" className="text-sm font-medium underline underline-offset-4">
                  Ver todo
                </Link>
              )}
            </div>
            {novedades.length > 0 ? (
              <GrillaProductos productos={novedades} prioridad={portadas.length > 0 ? 0 : 4} />
            ) : (
              <p className="text-neutral-500">Muy pronto vas a encontrar nuestros productos acá.</p>
            )}
          </section>

          {marcas.length > 0 && (
            <section className="subir mt-16">
              <h2 className="titulo-seccion mb-6 text-center">Marcas</h2>
              <FranjaMarcas marcas={marcas} />
            </section>
          )}

          {categorias.length > 0 && (
            <section className="subir mt-16">
              <h2 className="titulo-seccion mb-6">Categorías</h2>
              <ul className="flex flex-wrap gap-3">
                {categorias.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/productos?categoria=${c.slug}`}
                      className="block rounded-full border border-neutral-300 px-5 py-2 hover:border-neutral-900"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </TransicionPagina>
  );
}
