import Link from "next/link";
import { obtenerCatalogo, type ProductoResumen } from "@/lib/catalogo";
import {
  filtrarProductos,
  leerFiltros,
  nombreCategoria,
  opcionesDeFiltro,
  ordenes,
  urlCatalogo,
  type Filtros,
  type Orden,
} from "@/lib/filtros";
import { IconoCerrar } from "./iconos";
import { PanelFiltros } from "./panel-filtros";
import { GrillaCargando, GrillaProductos } from "./producto-card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Listado de productos con filtros (categoría, marca, talle, orden y búsqueda).
 * Lo usan /productos, las secciones (/mujer, /outlet…) y las páginas de marca.
 * En la compu los filtros van en una columna a la izquierda; en el celular y la
 * tablet, en un panel que se abre con un botón.
 * - `incluye`: qué productos entran (por ejemplo, solo los de Outlet).
 * - `ruta`: la página, para armar los links de los filtros.
 * - `sinMarca`: en la página de una marca no tiene sentido filtrar por marca.
 * Lee la URL: va dentro de un <Suspense> con <ListadoCargando /> de respaldo.
 */
export async function Listado({
  searchParams,
  incluye,
  ruta = "/productos",
  sinMarca = false,
}: {
  searchParams: SearchParams;
  incluye?: (p: ProductoResumen) => boolean;
  ruta?: string;
  sinMarca?: boolean;
}) {
  const filtros = leerFiltros(await searchParams);
  if (sinMarca) filtros.marca = undefined;
  const catalogo = (await obtenerCatalogo()).filter((p) => !incluye || incluye(p));
  const opciones = opcionesDeFiltro(catalogo);
  const productos = filtrarProductos(catalogo, filtros);
  const url = (cambios: Partial<Filtros>) => urlCatalogo(filtros, cambios, ruta);
  const hayFiltros = Boolean(filtros.q || filtros.categoria || filtros.marca || filtros.talle);

  // Filtros aplicados, para mostrarlos como chips que se quitan con un toque.
  const activos = [
    filtros.q && { nombre: `“${filtros.q}”`, quitar: url({ q: undefined }) },
    filtros.categoria && {
      nombre: nombreCategoria(opciones.categorias, filtros.categoria) ?? filtros.categoria,
      quitar: url({ categoria: undefined }),
    },
    filtros.marca && {
      nombre: opciones.marcas.find((m) => m.slug === filtros.marca)?.name ?? filtros.marca,
      quitar: url({ marca: undefined }),
    },
    filtros.talle && { nombre: `Talle ${filtros.talle}`, quitar: url({ talle: undefined }) },
  ].filter((a): a is { nombre: string; quitar: string } => !!a);

  // Categorías, marcas y talles: van en la columna de la compu y en el panel del celular.
  const contenidoFiltros = (
    <>
      {opciones.categorias.length > 0 && (
        <GrupoFiltro titulo="Categoría">
          <ul className="space-y-0.5">
            <li>
              <Opcion href={url({ categoria: undefined })} activo={!filtros.categoria}>
                Todas
              </Opcion>
            </li>
            {opciones.categorias.map((c) => {
              // La categoría elegida (o la madre de la subcategoría elegida) muestra sus subcategorías.
              const abierta =
                filtros.categoria === c.slug || c.subcategorias.some((s) => s.slug === filtros.categoria);
              return (
                <li key={c.slug}>
                  <Opcion href={url({ categoria: c.slug })} activo={filtros.categoria === c.slug}>
                    {c.name}
                  </Opcion>
                  {abierta && c.subcategorias.length > 0 && (
                    <ul className="mt-0.5 mb-1.5 ml-4 space-y-0.5">
                      {c.subcategorias.map((s) => (
                        <li key={s.slug}>
                          <Opcion href={url({ categoria: s.slug })} activo={filtros.categoria === s.slug}>
                            {s.name}
                          </Opcion>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </GrupoFiltro>
      )}

      {!sinMarca && opciones.marcas.length > 0 && (
        <GrupoFiltro titulo="Marca">
          <ul className="space-y-0.5">
            <li>
              <Opcion href={url({ marca: undefined })} activo={!filtros.marca}>
                Todas
              </Opcion>
            </li>
            {opciones.marcas.map((m) => (
              <li key={m.slug}>
                <Opcion href={url({ marca: m.slug })} activo={filtros.marca === m.slug}>
                  {m.name}
                </Opcion>
              </li>
            ))}
          </ul>
        </GrupoFiltro>
      )}

      {opciones.talles.length > 0 && (
        <GrupoFiltro titulo="Talle" quitar={filtros.talle ? url({ talle: undefined }) : undefined}>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
            {opciones.talles.map((t) => (
              <li key={t}>
                <CuadroTalle href={url({ talle: t })} activo={filtros.talle === t}>
                  {t}
                </CuadroTalle>
              </li>
            ))}
          </ul>
        </GrupoFiltro>
      )}
    </>
  );

  const chipsOrden = (Object.keys(ordenes) as Orden[]).map((orden) => (
    <Chip key={orden} href={url({ orden })} activo={filtros.orden === orden}>
      {ordenes[orden]}
    </Chip>
  ));

  const cantidad = `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`;

  return (
    <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-10 xl:grid-cols-[15rem_1fr]">
      {/* Columna de filtros (compu). Queda fija al bajar; si es más alta que la pantalla, se desplaza sola. */}
      <aside
        aria-label="Filtros"
        className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-4 lg:block"
      >
        {/* Una línea fina entre grupos. */}
        <div className="divide-y divide-neutral-200 [&>*]:py-6 [&>*:first-child]:pt-0">{contenidoFiltros}</div>
      </aside>

      <div>
        {filtros.q && (
          <p className="mb-4 text-lg">
            Resultados para <strong>“{filtros.q}”</strong>
          </p>
        )}

        <div className="mb-4 flex items-center justify-between gap-4 lg:hidden">
          <PanelFiltros activos={activos.length} cantidad={productos.length}>
            {contenidoFiltros}
            <GrupoFiltro titulo="Ordenar">
              <div className="flex flex-wrap gap-2">{chipsOrden}</div>
            </GrupoFiltro>
          </PanelFiltros>
          <p className="text-sm text-neutral-500">{cantidad}</p>
        </div>

        {activos.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2 lg:hidden" aria-label="Filtros aplicados">
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

        <div className="mb-5 hidden flex-wrap items-center justify-between gap-4 lg:flex">
          <p className="text-sm text-neutral-500">
            {cantidad}
            {hayFiltros && (
              <>
                {" · "}
                <Link href={urlCatalogo({ orden: filtros.orden }, {}, ruta)} className="underline">
                  Quitar filtros
                </Link>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-500">Ordenar:</span>
            {chipsOrden}
          </div>
        </div>

        {/* Título para lectores de pantalla: ordena los títulos (h1 → h2 → h3 de las tarjetas). */}
        <h2 className="sr-only">Resultados</h2>
        {productos.length > 0 ? (
          <GrillaProductos productos={productos} prioridad={4} conFiltros />
        ) : (
          <SinResultados ruta={ruta} filtros={filtros} hayFiltros={hayFiltros} />
        )}
      </div>
    </div>
  );
}

/** Mientras carga: reserva el lugar de los filtros para que la grilla no salte. */
export function ListadoCargando() {
  return (
    <div aria-hidden className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-10 xl:grid-cols-[15rem_1fr]">
      <div className="hidden space-y-3 lg:block">
        <div className="mb-4 h-4 w-20 brillo rounded bg-neutral-100" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-5 w-32 brillo rounded bg-neutral-100" />
        ))}
      </div>
      <div>
        <div className="mb-4 h-10 w-44 brillo rounded-full bg-neutral-100 lg:hidden" />
        <div className="mb-5 hidden h-8 w-full brillo rounded bg-neutral-100 lg:block" />
        <GrillaCargando conFiltros />
      </div>
    </div>
  );
}

/** Un grupo de filtros: título chico y, si hay algo elegido, "Quitar". */
function GrupoFiltro({ titulo, quitar, children }: { titulo: string; quitar?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between">
        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">{titulo}</p>
        {quitar && (
          <Link href={quitar} scroll={false} className="text-xs text-neutral-500 underline hover:text-neutral-900">
            Quitar
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

/** Opción de una lista de filtros (categoría o marca): la elegida, con fondo suave y una línea a la izquierda. */
function Opcion({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={`block rounded-md border-l-2 px-2.5 py-1.5 text-sm transition-colors ${
        activo
          ? "border-neutral-900 bg-neutral-100 font-medium text-neutral-900"
          : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}

/** Talle en un cuadradito: todos del mismo tamaño. */
function CuadroTalle({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={`flex h-10 items-center justify-center rounded-md border text-sm transition-colors ${
        activo
          ? "border-neutral-900 bg-neutral-900 font-medium text-white"
          : "border-neutral-200 hover:border-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}

function Chip({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={`rounded-full border px-3 py-1 text-sm ${
        activo ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}

function SinResultados({ ruta, filtros, hayFiltros }: { ruta: string; filtros: Filtros; hayFiltros: boolean }) {
  if (!hayFiltros) {
    return <p className="text-neutral-500">Muy pronto vas a encontrar productos acá.</p>;
  }
  return (
    <p className="text-neutral-500">
      {filtros.q ? `No encontramos productos para “${filtros.q}”.` : "No hay productos con esos filtros."}{" "}
      <Link href={urlCatalogo({ orden: filtros.orden }, {}, ruta)} className="underline">
        Ver todos
      </Link>
    </p>
  );
}
