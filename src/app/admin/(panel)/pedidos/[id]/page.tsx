import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  acciones,
  cancelable,
  conStockDescontado,
  esEstado,
  estados,
  fechaHora,
  siguientesEstados,
} from "@/lib/admin/pedidos";
import { esUuid } from "@/lib/carrito";
import { formatearPrecio } from "@/lib/formato";
import { CambiarEstado, CancelarPedido, Notas } from "./controles";

type Pedido = {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: string;
  shipping_zone_name: string | null;
  address_street: string | null;
  address_number: string | null;
  address_apartment: string | null;
  address_city: string | null;
  address_province: string | null;
  address_postal_code: string | null;
  address_notes: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  mp_payment_id: string | null;
  paid_at: string | null;
  admin_notes: string;
  order_items: {
    id: string;
    product_id: string | null;
    product_name: string;
    size: string;
    unit_price: number;
    quantity: number;
  }[];
};

export default async function PedidoPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  if (!esUuid(id)) notFound();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id, product_id, product_name, size, unit_price, quantity)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  const pedido = data as Pedido;
  if (!esEstado(pedido.status)) throw new Error(`Estado desconocido: ${pedido.status}`);
  const estado = pedido.status;
  const conEnvio = pedido.delivery_method === "shipping";
  const siguientes = siguientesEstados(estado, conEnvio).map((e) => ({
    estado: e,
    texto: acciones[e] ?? estados[e].nombre,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/pedidos" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-2xl font-bold">Pedido #{pedido.order_number}</h1>
          <span className={`font-medium ${estados[estado].color}`}>{estados[estado].nombre}</span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Hecho el {fechaHora(pedido.created_at)} · Última modificación {fechaHora(pedido.updated_at)}
        </p>
      </div>

      {estado === "stock_issue" && (
        <Aviso>
          El cliente pagó, pero al confirmar el pago no había stock suficiente y no se descontó nada.
          Conseguí el producto (y marcalo en preparación) o cancelalo y devolvé el dinero desde Mercado Pago.
        </Aviso>
      )}

      {(siguientes.length > 0 || cancelable(estado)) && (
        <Seccion titulo="Estado">
          {siguientes.length > 0 && (
            <CambiarEstado pedidoId={pedido.id} desde={estado} siguientes={siguientes} />
          )}
          {cancelable(estado) && (
            <CancelarPedido
              pedidoId={pedido.id}
              puedeReponer={conStockDescontado.includes(estado)}
              pagado={pedido.mp_payment_id !== null}
            />
          )}
        </Seccion>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Seccion titulo="Cliente">
          <p className="font-medium">{pedido.customer_name}</p>
          <p>
            <a href={`mailto:${pedido.customer_email}`} className="underline">
              {pedido.customer_email}
            </a>
          </p>
          <p>
            <a href={`tel:${pedido.customer_phone.replace(/[^\d+]/g, "")}`} className="underline">
              {pedido.customer_phone}
            </a>
          </p>
          <p className="mt-3 text-sm text-neutral-600">
            Página del pedido para el cliente:{" "}
            <Link href={`/pedido/${pedido.id}`} target="_blank" className="underline">
              /pedido/{pedido.id.slice(0, 8)}…
            </Link>
          </p>
        </Seccion>

        <Seccion titulo={conEnvio ? `Envío · ${pedido.shipping_zone_name ?? ""}` : "Retiro en el local"}>
          {conEnvio ? (
            <p>
              {pedido.address_street} {pedido.address_number}
              {pedido.address_apartment && `, ${pedido.address_apartment}`}
              <br />
              {pedido.address_city}, {pedido.address_province}
              <br />
              CP {pedido.address_postal_code}
            </p>
          ) : (
            <p className="text-neutral-600">El cliente pasa a buscarlo por el local.</p>
          )}
          {pedido.address_notes && (
            <p className="mt-3 text-sm">
              <span className="font-medium">Indicaciones del cliente:</span> {pedido.address_notes}
            </p>
          )}
        </Seccion>
      </div>

      <Seccion titulo="Productos">
        <ul className="divide-y divide-neutral-200">
          {pedido.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2">
              <span>
                {item.product_id ? (
                  <Link href={`/admin/productos/${item.product_id}`} className="font-medium hover:underline">
                    {item.product_name}
                  </Link>
                ) : (
                  <span className="font-medium">{item.product_name}</span>
                )}
                <span className="block text-sm text-neutral-500">
                  Talle {item.size} · {item.quantity} × {formatearPrecio(Number(item.unit_price))}
                </span>
              </span>
              <span>{formatearPrecio(Number(item.unit_price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-neutral-200 pt-3 text-sm">
          <Fila titulo="Productos" valor={formatearPrecio(Number(pedido.subtotal))} />
          <Fila
            titulo="Envío"
            valor={Number(pedido.shipping_cost) === 0 ? "Sin costo" : formatearPrecio(Number(pedido.shipping_cost))}
          />
          <Fila titulo="Total" valor={formatearPrecio(Number(pedido.total))} destacado />
        </dl>
      </Seccion>

      <Seccion titulo="Pago">
        {pedido.mp_payment_id ? (
          <p>
            Mercado Pago, operación <span className="font-mono">{pedido.mp_payment_id}</span>
            {pedido.paid_at && <> · acreditado el {fechaHora(pedido.paid_at)}</>}
          </p>
        ) : (
          <p className="text-neutral-600">Todavía no hay un pago aprobado.</p>
        )}
      </Seccion>

      <Seccion titulo="Notas internas">
        <p className="mb-3 text-sm text-neutral-500">
          Solo las ve el panel. La tienda agrega acá avisos automáticos (pagos duplicados, sin stock, devoluciones).
        </p>
        <Notas pedidoId={pedido.id} notas={pedido.admin_notes} />
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-3 font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
      {children}
    </p>
  );
}

function Fila({ titulo, valor, destacado }: { titulo: string; valor: string; destacado?: boolean }) {
  return (
    <div className={`flex justify-between ${destacado ? "text-base font-semibold" : "text-neutral-600"}`}>
      <dt>{titulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
