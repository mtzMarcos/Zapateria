// Estados de los pedidos para el panel: nombre, color, a qué estado se puede
// pasar desde cada uno y los filtros del listado.

export const estados = {
  pending_payment: { nombre: "Esperando el pago", color: "text-neutral-600" },
  payment_rejected: { nombre: "Pago rechazado", color: "text-neutral-600" },
  paid: { nombre: "Pagado: preparar", color: "text-green-700" },
  stock_issue: { nombre: "Pagado sin stock", color: "text-red-700" },
  preparing: { nombre: "En preparación", color: "text-amber-700" },
  shipped: { nombre: "Despachado", color: "text-neutral-900" },
  ready_for_pickup: { nombre: "Listo para retirar", color: "text-neutral-900" },
  delivered: { nombre: "Entregado", color: "text-neutral-500" },
  cancelled: { nombre: "Cancelado", color: "text-neutral-500" },
} as const;

export type Estado = keyof typeof estados;

export function esEstado(valor: string): valor is Estado {
  return valor in estados;
}

/** Estados en los que ya se descontó stock (al cancelar se puede reponer). */
export const conStockDescontado: Estado[] = ["paid", "preparing", "shipped", "ready_for_pickup", "delivered"];

/**
 * Pasos siguientes posibles desde cada estado (sin contar "cancelar", que se
 * maneja aparte). Depende de si el pedido es con envío o retiro en el local.
 */
export function siguientesEstados(estado: Estado, conEnvio: boolean): Estado[] {
  const despacho: Estado = conEnvio ? "shipped" : "ready_for_pickup";
  switch (estado) {
    case "paid":
      return ["preparing", despacho];
    case "stock_issue":
      // Resuelto (se consiguió el producto): sigue como un pedido pagado.
      return ["preparing"];
    case "preparing":
      return [despacho];
    case "shipped":
    case "ready_for_pickup":
      return ["delivered"];
    default:
      return [];
  }
}

/** Texto del botón para pasar a cada estado. */
export const acciones: Partial<Record<Estado, string>> = {
  preparing: "Marcar en preparación",
  shipped: "Marcar despachado",
  ready_for_pickup: "Marcar listo para retirar",
  delivered: "Marcar entregado",
};

/**
 * Un pedido entregado solo se puede cancelar si el cliente usó el botón de
 * arrepentimiento (devuelve el producto). Igual que en la función SQL cancelar_pedido.
 */
export const cancelable = (estado: Estado, conArrepentimiento = false) =>
  estado !== "cancelled" && (estado !== "delivered" || conArrepentimiento);

/** Filtros del listado. El primero es el que se ve al entrar. */
export const filtros = [
  { clave: "activos", nombre: "Para atender", estados: ["paid", "stock_issue", "preparing", "shipped", "ready_for_pickup"] },
  { clave: "sin-pagar", nombre: "Sin pagar", estados: ["pending_payment", "payment_rejected"] },
  { clave: "entregados", nombre: "Entregados", estados: ["delivered"] },
  { clave: "cancelados", nombre: "Cancelados", estados: ["cancelled"] },
  { clave: "todos", nombre: "Todos", estados: Object.keys(estados) },
] as const satisfies { clave: string; nombre: string; estados: readonly string[] }[];

export type ClaveFiltro = (typeof filtros)[number]["clave"];

/** Fecha y hora en Argentina: "22/10/2026 02:28". */
export function fechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
