import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { tienda } from "@/config/tienda";
import { detalleCarrito, leerCarrito, problemaItem, subtotal } from "@/lib/carrito";
import { obtenerZonas } from "@/lib/envios";
import { formatearPrecio } from "@/lib/formato";
import { FormularioCheckout } from "./formulario";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Finalizar compra</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-neutral-100" />}>
        <Checkout />
      </Suspense>
    </main>
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

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_20rem]">
      <FormularioCheckout zonas={zonas} subtotal={subtotal(items)} retiro={tienda.retiro} />

      <aside className="h-fit rounded-lg bg-neutral-50 p-5 md:order-last">
        <h2 className="mb-4 font-semibold">Tu pedido</h2>
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
      </aside>
    </div>
  );
}
