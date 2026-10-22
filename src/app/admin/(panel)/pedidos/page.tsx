import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { esEstado, estados, fechaHora, filtros, type ClaveFiltro } from "@/lib/admin/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { claseInput, clasesBoton } from "@/components/admin/estilos";

const LIMITE = 200;

type FilaPedido = {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  delivery_method: string;
  shipping_zone_name: string | null;
  total: number;
  admin_notes: string;
};

export default async function PedidosPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const filtro = filtros.find((f) => f.clave === params.estado) ?? filtros[0];
  // Búsqueda por número de pedido, nombre o email. Se sacan los caracteres
  // que tienen significado en los filtros de la API (comas, paréntesis, %).
  const busqueda = String(params.q ?? "")
    .replace(/[^\p{L}\p{N}@._\- ]/gu, "")
    .trim()
    .slice(0, 60);

  let consulta = supabase
    .from("orders")
    .select(
      "id, order_number, status, created_at, customer_name, customer_email, delivery_method, shipping_zone_name, total, admin_notes",
    )
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (busqueda) {
    consulta = /^\d+$/.test(busqueda)
      ? consulta.eq("order_number", Number(busqueda))
      : consulta.or(`customer_name.ilike.%${busqueda}%,customer_email.ilike.%${busqueda}%`);
  } else {
    consulta = consulta.in("status", [...filtro.estados]);
  }

  // Cantidad de pedidos por estado, para los números de los filtros.
  const [{ data, error }, { data: todos }] = await Promise.all([
    consulta,
    supabase.from("orders").select("status"),
  ]);
  if (error) throw error;
  const pedidos = data as FilaPedido[];
  const cantidad = (clave: ClaveFiltro) => {
    const incluidos: readonly string[] = filtros.find((f) => f.clave === clave)!.estados;
    return (todos ?? []).filter((p) => incluidos.includes(p.status)).length;
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Pedidos</h1>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2 text-sm">
          {filtros.map((f) => {
            const activo = !busqueda && f.clave === filtro.clave;
            return (
              <Link
                key={f.clave}
                href={f.clave === filtros[0].clave ? "/admin/pedidos" : `/admin/pedidos?estado=${f.clave}`}
                aria-current={activo ? "page" : undefined}
                className={`rounded-full border px-3 py-1 ${
                  activo
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white hover:border-neutral-900"
                }`}
              >
                {f.nombre} ({cantidad(f.clave)})
              </Link>
            );
          })}
        </nav>
        <form action="/admin/pedidos" className="flex gap-2">
          <input
            name="q"
            defaultValue={busqueda}
            placeholder="N.º, nombre o email"
            aria-label="Buscar pedidos"
            className={`${claseInput} w-56`}
          />
          <button type="submit" className={clasesBoton("secundario")}>
            Buscar
          </button>
        </form>
      </div>

      {busqueda && (
        <p className="mb-4 text-sm text-neutral-600">
          Resultados para “{busqueda}” en todos los estados.{" "}
          <Link href="/admin/pedidos" className="underline">
            Quitar búsqueda
          </Link>
        </p>
      )}

      {pedidos.length === 0 ? (
        <p className="text-neutral-500">
          {busqueda ? "No hay pedidos que coincidan." : "No hay pedidos en esta sección."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="p-3 font-medium">Pedido</th>
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Entrega</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {pedidos.map((p) => {
                const estado = esEstado(p.status) ? estados[p.status] : null;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="p-3">
                      <Link href={`/admin/pedidos/${p.id}`} className="block">
                        <span className="block font-medium underline-offset-2 hover:underline">
                          #{p.order_number}
                        </span>
                        <span className="text-neutral-500">{fechaHora(p.created_at)}</span>
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="block">{p.customer_name}</span>
                      <span className="text-neutral-500">{p.customer_email}</span>
                    </td>
                    <td className="p-3">
                      {p.delivery_method === "shipping" ? `Envío · ${p.shipping_zone_name ?? ""}` : "Retiro en el local"}
                    </td>
                    <td className="p-3 text-right">{formatearPrecio(Number(p.total))}</td>
                    <td className="p-3">
                      <span className={`font-medium ${estado?.color ?? ""}`}>{estado?.nombre ?? p.status}</span>
                      {p.admin_notes && (
                        <span className="block text-xs text-neutral-500" title={p.admin_notes}>
                          Tiene notas
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pedidos.length === LIMITE && (
        <p className="mt-3 text-sm text-neutral-500">
          Se muestran los {LIMITE} más recientes. Usá la búsqueda para encontrar uno más viejo.
        </p>
      )}
    </>
  );
}
