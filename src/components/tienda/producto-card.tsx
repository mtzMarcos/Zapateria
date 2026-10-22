import Image from "next/image";
import Link from "next/link";
import type { ProductoResumen } from "@/lib/catalogo";
import { formatearPrecio } from "@/lib/formato";

export function GrillaProductos({ productos }: { productos: ProductoResumen[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {productos.map((p) => (
        <li key={p.id}>
          <ProductoCard producto={p} />
        </li>
      ))}
    </ul>
  );
}

function ProductoCard({ producto }: { producto: ProductoResumen }) {
  const agotado = producto.stockTotal === 0;

  return (
    <Link href={`/productos/${producto.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {producto.portada ? (
          <Image
            src={producto.portada}
            alt={producto.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${agotado ? "opacity-60" : ""}`}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-neutral-500">
            Sin foto
          </span>
        )}
        {agotado && (
          <span className="absolute top-2 left-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium">
            Sin stock
          </span>
        )}
      </div>
      <div className="mt-3">
        {producto.marca && (
          <p className="text-xs tracking-wide text-neutral-500 uppercase">{producto.marca.name}</p>
        )}
        <h3 className="mt-0.5 text-sm font-medium group-hover:underline">{producto.name}</h3>
        <p className="mt-1 font-semibold">{formatearPrecio(producto.price)}</p>
      </div>
    </Link>
  );
}

/** Esqueleto que se muestra mientras carga la grilla. */
export function GrillaCargando({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: cantidad }, (_, i) => (
        <li key={i}>
          <div className="aspect-square animate-pulse rounded-lg bg-neutral-100" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
        </li>
      ))}
    </ul>
  );
}
