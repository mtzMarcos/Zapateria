import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { tienda } from "@/config/tienda";
import { detalleCarrito, leerCarrito, problemaItem, subtotal } from "@/lib/carrito";
import { obtenerZonas } from "@/lib/envios";
import { formatearPrecio } from "@/lib/formato";
import { PasosCompra } from "@/components/tienda/pasos-compra";
import { FormularioCheckout } from "./formulario";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <TransicionPagina>
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-10 md:py-8">
        <PasosCompra actual={1} />
        <h1 className="mb-6 text-2xl font-bold md:mb-8 md:text-3xl">Finalizar compra</h1>
        <Suspense fallback={<CheckoutCargando />}>
          <Checkout />
        </Suspense>
      </main>
    </TransicionPagina>
  );
}

async function Checkout() {
  const lineas = await leerCarrito();
  const [items, zonas] = await Promise.all([detalleCarrito(lineas), obtenerZonas()]);

  if (items.length === 0) {
    return (
      <p className="text-neutral-600">
        Tu carrito está vacío.{" "}
        <Link href="/productos" className="font-medium text-neutral-900 underline">
          Ver productos
        </Link>
      </p>
    );
  }
  if (items.length < lineas.length || items.some((i) => problemaItem(i))) {
    return (
      <p className="text-red-700">
        Cambió el stock de algunos productos.{" "}
        <Link href="/carrito" className="font-medium underline">
          Revisá el carrito
        </Link>{" "}
        para continuar.
      </p>
    );
  }

  const resumen = (
    <>
      <ul className="space-y-3 text-sm">
        {items.map((i) => (
          <li key={i.varianteId} className="flex justify-between gap-4">
            <span>
              {i.nombre}
              <span className="block text-neutral-500">
                Talle {i.talle} · {i.cantidad} {i.cantidad === 1 ? "unidad" : "unidades"}
              </span>
            </span>
            <span className="shrink-0">{formatearPrecio(i.precio * i.cantidad)}</span>
          </li>
        ))}
      </ul>
      <Link href="/carrito" className="mt-4 inline-block text-sm text-neutral-600 underline">
        Modificar carrito
      </Link>
    </>
  );

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_20rem] md:gap-10">
      {/* En el celular el resumen va arriba, plegado; en la compu, al costado. */}
      <details className="group rounded-lg bg-neutral-50 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-medium">
            <span className="group-open:hidden">Ver resumen del pedido</span>
            <span className="hidden group-open:inline">Ocultar resumen</span>
            <span className="ml-1 text-neutral-500" aria-hidden>
              ▾
            </span>
          </span>
          <span className="font-semibold">{formatearPrecio(subtotal(items))}</span>
        </summary>
        <div className="border-t border-neutral-200 p-4">{resumen}</div>
      </details>

      <FormularioCheckout zonas={zonas} subtotal={subtotal(items)} retiro={tienda.retiro} />

      <aside className="hidden h-fit rounded-lg bg-neutral-50 p-5 md:order-last md:block">
        <h2 className="mb-4 font-semibold">Tu pedido</h2>
        {resumen}
      </aside>
    </div>
  );
}

/** Mientras carga: la forma del formulario y del resumen, para que nada salte al llegar. */
function CheckoutCargando() {
  const campo = <div className="h-16 animate-pulse rounded-md bg-neutral-100" />;
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_20rem] md:gap-10" aria-hidden>
      <div className="h-14 animate-pulse rounded-lg bg-neutral-100 md:hidden" />
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-neutral-100" />
          {campo}
          <div className="grid gap-4 sm:grid-cols-2">
            {campo}
            {campo}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-6 w-24 animate-pulse rounded bg-neutral-100" />
          <div className="h-20 animate-pulse rounded-md bg-neutral-100" />
          <div className="h-20 animate-pulse rounded-md bg-neutral-100" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-neutral-100" />
          {campo}
          {campo}
          {campo}
          {campo}
        </div>
        <div className="h-48 animate-pulse rounded-md bg-neutral-100" />
      </div>
      <div className="hidden h-48 animate-pulse rounded-lg bg-neutral-100 md:block" />
    </div>
  );
}
