import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { tienda } from "@/config/tienda";
import { Dato } from "@/components/tienda/dato";
import { esUuid } from "@/lib/carrito";
import { formatearPrecio } from "@/lib/formato";
import { createServiceClient } from "@/lib/supabase/service";
import { AccionesPago } from "./acciones-pago";
import { TransicionPagina } from "@/components/tienda/transicion-pagina";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false },
};

// Estado del pedido tal como lo ve el comprador.
type EstadoVisible = "pagado" | "procesando" | "sin_pagar" | "rechazado" | "sin_stock" | "cancelado";

function estadoVisible(status: string, pagoPendiente: boolean): EstadoVisible {
  if (status === "pending_payment") return pagoPendiente ? "procesando" : "sin_pagar";
  if (status === "payment_rejected") return "rechazado";
  if (status === "stock_issue") return "sin_stock";
  if (status === "cancelled") return "cancelado";
  return "pagado"; // paid, preparing, shipped, ready_for_pickup, delivered
}

const etiquetas: Record<EstadoVisible, string> = {
  pagado: "Pago aprobado",
  procesando: "Pago en proceso",
  sin_pagar: "Pendiente de pago",
  rechazado: "Pago rechazado",
  sin_stock: "Pago recibido",
  cancelado: "Cancelado",
};

const colores: Record<EstadoVisible, string> = {
  pagado: "text-green-700",
  procesando: "text-amber-700",
  sin_pagar: "text-amber-700",
  rechazado: "text-red-700",
  sin_stock: "text-amber-700",
  cancelado: "text-neutral-500",
};

// Los pedidos no son públicos (RLS): se leen con la clave secreta. El id es
// un UUID imposible de adivinar, así que solo lo ve quien hizo la compra.
export default function PedidoPage({ params, searchParams }: PageProps<"/pedido/[id]">) {
  return (
    <TransicionPagina>
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-neutral-100" />}>
          <Pedido params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </TransicionPagina>
  );
}

async function Pedido({
  params,
  searchParams,
}: Pick<PageProps<"/pedido/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  if (!esUuid(id)) notFound();

  const { data: pedido } = await createServiceClient()
    .from("orders")
    .select(
      "order_number, status, customer_name, customer_email, delivery_method, shipping_zone_name, address_street, address_number, address_apartment, address_city, address_province, address_postal_code, subtotal, shipping_cost, total, order_items(product_name, size, unit_price, quantity)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!pedido) notFound();

  const envio = pedido.delivery_method === "shipping";
  const nombre = pedido.customer_name.split(" ")[0];
  const { pago } = await searchParams;
  const estado = estadoVisible(pedido.status, pago === "pendiente");
  const numero = <strong className="text-neutral-900">#{pedido.order_number}</strong>;
  const email = <strong className="text-neutral-900">{pedido.customer_email}</strong>;

  return (
    <>
      <p className={`text-sm font-medium tracking-wide uppercase ${colores[estado]}`}>
        {etiquetas[estado]}
      </p>
      {estado === "pagado" && (
        <>
          <h1 className="mt-2 text-3xl font-bold">¡Gracias, {nombre}!</h1>
          <p className="mt-3 text-neutral-600">
            Recibimos el pago de tu pedido {numero}. Te vamos a contactar a {email} para coordinar{" "}
            {envio ? "el envío" : "el retiro"}.
          </p>
        </>
      )}
      {estado === "procesando" && (
        <>
          <h1 className="mt-2 text-3xl font-bold">Tu pago se está procesando</h1>
          <p className="mt-3 text-neutral-600">
            Mercado Pago está procesando el pago de tu pedido {numero}. Cuando se acredite, el pedido
            queda confirmado. Podés volver a esta página para ver cómo sigue.
          </p>
          <AccionesPago pedidoId={id} />
        </>
      )}
      {estado === "sin_pagar" && (
        <>
          <h1 className="mt-2 text-3xl font-bold">Falta el pago</h1>
          <p className="mt-3 text-neutral-600">
            Tu pedido {numero} está guardado, pero todavía no recibimos el pago.
          </p>
          <AccionesPago pedidoId={id} textoPagar="Pagar con Mercado Pago" />
        </>
      )}
      {estado === "rechazado" && (
        <>
          <h1 className="mt-2 text-3xl font-bold">El pago no se aprobó</h1>
          <p className="mt-3 text-neutral-600">
            Mercado Pago rechazó el pago de tu pedido {numero}. Podés intentar de nuevo con otro medio
            de pago.
          </p>
          <AccionesPago pedidoId={id} textoPagar="Intentar de nuevo" />
        </>
      )}
      {estado === "sin_stock" && (
        <>
          <h1 className="mt-2 text-3xl font-bold">Recibimos tu pago</h1>
          <p className="mt-3 text-neutral-600">
            Mientras pagabas, otra persona compró la última unidad de un producto de tu pedido {numero}.
            Te vamos a contactar a {email} para ofrecerte un cambio o devolverte el dinero.
          </p>
        </>
      )}
      {estado === "cancelado" && (
        <>
          <h1 className="mt-2 text-3xl font-bold">Pedido cancelado</h1>
          <p className="mt-3 text-neutral-600">El pedido {numero} fue cancelado.</p>
        </>
      )}

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
            <Dato valor={tienda.retiro.direccion} />
            <br />
            <Dato valor={tienda.retiro.horarios} />
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
