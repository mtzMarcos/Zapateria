import Image from "next/image";
import Link from "next/link";
import type { ProductoResumen } from "@/lib/catalogo";
import { descuento, formatearPrecio } from "@/lib/formato";

/** Con este stock total o menos, la tarjeta dice "Últimas unidades". */
const POCAS_UNIDADES = 2;

/**
 * Grilla de productos. `prioridad`: cuántas fotos del principio se piden
 * enseguida (las que se ven sin bajar). Las demás cargan al acercarse.
 */
export function GrillaProductos({
  productos,
  prioridad = 0,
}: {
  productos: ProductoResumen[];
  prioridad?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
      {productos.map((p, i) => (
        <li key={p.id}>
          <ProductoCard producto={p} prioridad={i < prioridad} />
        </li>
      ))}
    </ul>
  );
}

function ProductoCard({ producto, prioridad }: { producto: ProductoResumen; prioridad: boolean }) {
  const agotado = producto.stockTotal === 0;
  const pocas = !agotado && producto.stockTotal <= POCAS_UNIDADES;

  return (
    <Link
      href={`/productos/${producto.slug}`}
      className="group block rounded-lg transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {producto.portada ? (
          <Image
            src={producto.portada}
            alt={producto.name}
            fill
            loading={prioridad ? "eager" : "lazy"}
            fetchPriority={prioridad ? "high" : undefined}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${agotado ? "opacity-60" : ""}`}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-neutral-500">
            Sin foto
          </span>
        )}
        {(agotado || pocas) && (
          <span
            className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              agotado ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
            }`}
          >
            {agotado ? "Sin stock" : "Últimas unidades"}
          </span>
        )}
        {producto.precioAnterior !== null && (
          <span className="absolute top-2 right-2 rounded-full bg-red-700 px-2.5 py-0.5 text-xs font-semibold text-white">
            -{descuento(producto.precioAnterior, producto.price)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        {producto.marca && (
          <p className="text-xs tracking-wide text-neutral-500 uppercase">{producto.marca.name}</p>
        )}
        <h3 className="mt-0.5 text-sm leading-snug font-medium group-hover:underline">{producto.name}</h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{formatearPrecio(producto.price)}</span>
          {producto.precioAnterior !== null && (
            <span className="text-sm text-neutral-500 line-through">
              <span className="sr-only">Antes </span>
              {formatearPrecio(producto.precioAnterior)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

/** Esqueleto que se muestra mientras carga la grilla. */
export function GrillaCargando({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: cantidad }, (_, i) => (
        <li key={i}>
          <div className="aspect-square animate-pulse rounded-lg bg-neutral-100" />
          <div className="mt-3 h-3 w-1/4 animate-pulse rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
        </li>
      ))}
    </ul>
  );
}
