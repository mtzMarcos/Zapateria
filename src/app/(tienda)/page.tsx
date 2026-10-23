import Link from "next/link";
import { tienda } from "@/config/tienda";
import { obtenerCatalogo } from "@/lib/catalogo";
import { filtrarProductos, opcionesDeFiltro } from "@/lib/filtros";
import { GrillaProductos } from "@/components/tienda/producto-card";

export default async function Home() {
  const catalogo = await obtenerCatalogo();
  const { categorias } = opcionesDeFiltro(catalogo);
  // Los más nuevos, con los que tienen stock primero.
  const novedades = filtrarProductos(catalogo, { orden: "recientes" }).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-6xl px-4">
      <section className="py-16 text-center sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{tienda.nombre}</h1>
        <p className="mt-4 text-lg text-neutral-600">{tienda.descripcion}</p>
        <Link
          href="/productos"
          className="mt-8 inline-block rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700"
        >
          Ver productos
        </Link>
      </section>

      {categorias.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-4 text-xl font-semibold">Categorías</h2>
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

      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Novedades</h2>
          {catalogo.length > novedades.length && (
            <Link href="/productos" className="text-sm text-neutral-600 hover:text-neutral-900">
              Ver todos →
            </Link>
          )}
        </div>
        {novedades.length > 0 ? (
          <GrillaProductos productos={novedades} prioridad={4} />
        ) : (
          <p className="text-neutral-500">Muy pronto vas a encontrar nuestros productos acá.</p>
        )}
      </section>
    </main>
  );
}
