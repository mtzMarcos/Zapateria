import Link from "next/link";
import { tienda } from "@/config/tienda";
import { obtenerCatalogo, obtenerMarcas } from "@/lib/catalogo";
import { filtrarProductos, opcionesDeFiltro } from "@/lib/filtros";
import { obtenerPortadas, obtenerTarjetas } from "@/lib/portada";
import { buscarSeccion } from "@/lib/secciones";
import { CarruselPortada } from "@/components/tienda/carrusel-portada";
import { Foto } from "@/components/tienda/foto";
import { FranjaMarcas } from "@/components/tienda/franja-marcas";
import { GrillaProductos } from "@/components/tienda/producto-card";
import { TarjetasDestacadas } from "@/components/tienda/tarjetas-destacadas";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

export default async function Home() {
  const [catalogo, portadas, marcas, todasLasTarjetas] = await Promise.all([
    obtenerCatalogo(),
    obtenerPortadas(),
    obtenerMarcas(),
    obtenerTarjetas(),
  ]);
  // Tendencias, Deportes y Outlet: solo las que tienen productos (que no lleven a una página vacía).
  const tarjetas = todasLasTarjetas.filter((t) => catalogo.some((p) => buscarSeccion(t.seccion)?.incluye(p)));
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
          {/* Con portadas, la foto ya se funde con la página: menos margen arriba. */}
          {tarjetas.length > 0 && (
            <section className={portadas.length > 0 ? "mt-6 sm:mt-10" : "mt-12 sm:mt-16"}>
              <h2 className="sr-only">Destacados</h2>
              <TarjetasDestacadas tarjetas={tarjetas} />
            </section>
          )}

          <section
            className={
              tarjetas.length > 0 ? "subir mt-16" : portadas.length > 0 ? "mt-6 sm:mt-10" : "mt-12 sm:mt-16"
            }
          >
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
              <h2 className="titulo-seccion mb-6 text-center">Categorías</h2>
              <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {categorias.map((c) => {
                  // La foto del primer producto (el más nuevo) con foto de la categoría o de una de sus subcategorías.
                  const foto = catalogo.find(
                    (p) => (p.categoria?.slug === c.slug || p.categoria?.madre?.slug === c.slug) && p.portada,
                  )?.portada;
                  return (
                    <li key={c.slug} className="w-[calc(50%-0.375rem)] sm:w-44">
                      <Link
                        href={`/productos?categoria=${c.slug}`}
                        className="group block rounded-lg transition-transform active:scale-[0.98]"
                      >
                        <span className="relative block aspect-square overflow-hidden rounded-lg bg-neutral-100">
                          {foto && (
                            <Foto
                              src={foto}
                              alt=""
                              fill
                              sizes="(min-width: 640px) 176px, 50vw"
                              className="object-cover transition-[scale] duration-500 ease-out group-hover:scale-105"
                            />
                          )}
                        </span>
                        <span className="mt-2 block text-center text-sm font-medium">{c.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </main>
      </div>
    </TransicionPagina>
  );
}
