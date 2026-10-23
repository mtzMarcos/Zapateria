import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  MAX_CANTIDAD,
  detalleCarrito,
  leerCarrito,
  problemaItem,
  subtotal,
  type ItemCarrito,
} from "@/lib/carrito";
import { formatearPrecio } from "@/lib/formato";
import { BotonAccion } from "@/components/tienda/boton-accion";
import { PasosCompra } from "@/components/tienda/pasos-compra";
import { ajustarAlStock, cambiarCantidad, quitarDelCarrito } from "./actions";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false },
};

export default function CarritoPage() {
  return (
    // Abajo deja lugar para la barra fija de "Continuar compra" del celular.
    <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-32 md:py-8">
      <PasosCompra actual={0} />
      <h1 className="mb-6 text-2xl font-bold md:mb-8 md:text-3xl">Carrito</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-neutral-100" />}>
        <ContenidoCarrito />
      </Suspense>
    </main>
  );
}

async function ContenidoCarrito() {
  const lineas = await leerCarrito();
  const items = await detalleCarrito(lineas);
  const noDisponibles = lineas.length - items.length;
  const hayProblemas = noDisponibles > 0 || items.some((i) => problemaItem(i));

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 p-8 text-center">
        <p className="text-neutral-600">
          {noDisponibles > 0
            ? "Los productos que tenías en el carrito ya no están disponibles."
            : "Tu carrito está vacío."}
        </p>
        <Link
          href="/productos"
          className="mt-4 inline-block rounded-md bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_18rem]">
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
        {items.map((item) => (
          <FilaItem key={item.varianteId} item={item} />
        ))}
      </ul>

      <aside className="h-fit rounded-lg bg-neutral-50 p-5">
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatearPrecio(subtotal(items))}</span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">El envío se calcula en el próximo paso.</p>

        {hayProblemas ? (
          <div className="mt-5 space-y-3">
            <p role="alert" className="text-sm text-red-700">
              {noDisponibles > 0
                ? "Algunos productos ya no están disponibles. "
                : "Hay productos sin stock suficiente. "}
              Ajustá el carrito para continuar.
            </p>
            <form action={ajustarAlStock}>
              <BotonAccion className="w-full rounded-md bg-neutral-900 px-5 py-3 font-medium text-white hover:bg-neutral-700">
                Ajustar al stock disponible
              </BotonAccion>
            </form>
          </div>
        ) : (
          <>
            <Link
              href="/checkout"
              className="mt-5 hidden rounded-md bg-neutral-900 px-5 py-3 text-center font-medium text-white hover:bg-neutral-700 md:block"
            >
              Continuar compra
            </Link>
            {/* En el celular, fijo abajo con el subtotal. */}
            <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-neutral-200 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
              <p className="shrink-0 text-sm text-neutral-500">
                Subtotal
                <span className="block text-lg font-semibold text-neutral-900">
                  {formatearPrecio(subtotal(items))}
                </span>
              </p>
              <Link
                href="/checkout"
                className="w-full rounded-md bg-neutral-900 px-5 py-3 text-center font-medium text-white hover:bg-neutral-700"
              >
                Continuar compra
              </Link>
            </div>
          </>
        )}
        <Link
          href="/productos"
          className="mt-3 block text-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}

function FilaItem({ item }: { item: ItemCarrito }) {
  const problema = problemaItem(item);
  const tope = Math.min(item.stock, MAX_CANTIDAD);

  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/productos/${item.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-md bg-neutral-100"
      >
        {item.foto && (
          <Image src={item.foto} alt={item.nombre} fill sizes="96px" className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex justify-between gap-4">
          <Link href={`/productos/${item.slug}`} className="font-medium hover:underline">
            {item.nombre}
          </Link>
          <span className="font-medium">{formatearPrecio(item.precio * item.cantidad)}</span>
        </div>
        <p className="text-sm text-neutral-500">
          Talle {item.talle} · {formatearPrecio(item.precio)} c/u
        </p>
        {problema && <p className="text-sm text-red-700">{problema}</p>}

        <div className="mt-auto flex items-center gap-4 pt-2">
          <div className="flex items-center rounded-md border border-neutral-300">
            <form action={cambiarCantidad.bind(null, item.varianteId, item.cantidad - 1)}>
              <BotonAccion aria-label="Quitar una unidad" className="flex size-10 items-center justify-center">
                −
              </BotonAccion>
            </form>
            <span className="min-w-8 text-center text-sm" aria-label="Cantidad">
              {item.cantidad}
            </span>
            <form action={cambiarCantidad.bind(null, item.varianteId, item.cantidad + 1)}>
              <BotonAccion
                aria-label="Agregar una unidad"
                disabled={item.cantidad >= tope}
                className="flex size-10 items-center justify-center"
              >
                +
              </BotonAccion>
            </form>
          </div>
          <form action={quitarDelCarrito.bind(null, item.varianteId)}>
            <BotonAccion className="text-sm text-neutral-500 underline hover:text-neutral-900">
              Quitar
            </BotonAccion>
          </form>
        </div>
      </div>
    </li>
  );
}
