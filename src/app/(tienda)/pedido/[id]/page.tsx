import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { tienda } from "@/config/tienda";
import { esUuid } from "@/lib/carrito";
import { formatearPrecio } from "@/lib/formato";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Pedido registrado",
  robots: { index: false },
};

// Los pedidos no son públicos (RLS): se leen con la clave secreta. El id es
// un UUID imposible de adivinar, así que solo lo ve quien hizo la compra.
export default function PedidoPage({ params }: PageProps<"/pedido/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-neutral-100" />}>
        <Pedido params={params} />
      </Suspense>
    </main>
  );
}

async function Pedido({ params }: Pick<PageProps<"/pedido/[id]">, "params">) {
  const { id } = await params;
  if (!esUuid(id)) notFound();

  const { data: pedido } = await createServiceClient()
    .from("orders")
    .select(
      "order_number, customer_name, customer_email, delivery_method, shipping_zone_name, address_street, address_number, address_apartment, address_city, address_province, address_postal_code, subtotal, shipping_cost, total, order_items(product_name, size, unit_price, quantity)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!pedido) notFound();

  const envio = pedido.delivery_method === "shipping";
  const nombre = pedido.customer_name.split(" ")[0];

  return (
    <>
      <p className="text-sm font-medium tracking-wide text-green-700 uppercase">Pedido registrado</p>
      <h1 className="mt-2 text-3xl font-bold">¡Gracias, {nombre}!</h1>
      <p className="mt-3 text-neutral-600">
        Tu número de pedido es <strong className="text-neutral-900">#{pedido.order_number}</strong>.
        {/* Etapa 5: acá se va a mostrar el resultado del pago con Mercado Pago. */}{" "}
        Te vamos a contactar a <strong className="text-neutral-900">{pedido.customer_email}</strong>{" "}
        para coordinar el pago.
      </p>

      <section className="mt-8 rounded-lg border border-neutral-200 p-5">
        <ul className="space-y-3 text-sm">
          {pedido.order_items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {item.product_name}
                <span className="block text-neutral-500">
                  Talle {item.size} · {item.quantity} × {formatearPrecio(Number(item.unit_price))}
                </span>
              </span>
              <span className="shrink-0">
                {formatearPrecio(Number(item.unit_price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Productos</span>
            <span>{formatearPrecio(Number(pedido.subtotal))}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>Envío</span>
            <span>
              {Number(pedido.shipping_cost) === 0
                ? "Sin costo"
                : formatearPrecio(Number(pedido.shipping_cost))}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatearPrecio(Number(pedido.total))}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 text-sm text-neutral-600">
        <h2 className="mb-1 font-semibold text-neutral-900">
          {envio ? "Envío a domicilio" : "Retiro en el local"}
        </h2>
        {envio ? (
          <p>
            {pedido.address_street} {pedido.address_number}
            {pedido.address_apartment && `, ${pedido.address_apartment}`}
            <br />
            {pedido.address_city}, {pedido.address_province} ({pedido.address_postal_code})
            <br />
            Zona: {pedido.shipping_zone_name}
          </p>
        ) : (
          <p>
            {tienda.retiro.direccion}
            <br />
            {tienda.retiro.horarios}
          </p>
        )}
      </section>

      <Link
        href="/productos"
        className="mt-10 inline-block rounded-md bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700"
      >
        Seguir comprando
      </Link>
    </>
  );
}
