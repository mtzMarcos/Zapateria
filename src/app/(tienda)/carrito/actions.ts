"use server";

import {
  MAX_CANTIDAD,
  detalleCarrito,
  esUuid,
  guardarCarrito,
  leerCarrito,
  type LineaCarrito,
} from "@/lib/carrito";
import { texto, type EstadoForm } from "@/lib/form";

// Guarda el carrito descartando lo que ya no se puede comprar (productos
// borrados u ocultos). Al cambiar la cookie, Next vuelve a renderizar la
// página actual, así el contador del encabezado y el carrito se actualizan.
async function guardarVigentes(lineas: LineaCarrito[]) {
  const vigentes = new Set((await detalleCarrito(lineas)).map((i) => i.varianteId));
  await guardarCarrito(lineas.filter((l) => vigentes.has(l.v)));
}

export async function agregarAlCarrito(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const varianteId = texto(formData, "variante");
  if (!esUuid(varianteId)) return { error: "Elegí un talle." };

  const lineas = await leerCarrito();
  const [item] = await detalleCarrito([{ v: varianteId, q: 1 }]);
  if (!item) return { error: "Este producto ya no está disponible." };

  const actual = lineas.find((l) => l.v === varianteId)?.q ?? 0;
  const tope = Math.min(item.stock, MAX_CANTIDAD);
  if (item.stock === 0) return { error: "Este talle se quedó sin stock." };
  if (actual >= tope) {
    return {
      error:
        tope === MAX_CANTIDAD
          ? `Podés llevar hasta ${MAX_CANTIDAD} unidades por talle.`
          : "Ya tenés en el carrito todo el stock de este talle.",
    };
  }

  const otras = lineas.filter((l) => l.v !== varianteId);
  await guardarVigentes([...otras, { v: varianteId, q: actual + 1 }]);
  return { ok: `Agregado al carrito (talle ${item.talle}).` };
}

export async function cambiarCantidad(varianteId: string, cantidad: number) {
  if (!esUuid(varianteId) || !Number.isInteger(cantidad)) return;

  const lineas = await leerCarrito();
  const [item] = await detalleCarrito([{ v: varianteId, q: 1 }]);
  // Nunca queda por encima del stock actual; 0 quita el ítem.
  const tope = Math.min(item?.stock ?? 0, MAX_CANTIDAD);
  const nueva = Math.max(0, Math.min(cantidad, tope));

  await guardarVigentes(
    lineas.map((l) => (l.v === varianteId ? { ...l, q: nueva } : l)),
  );
}

export async function quitarDelCarrito(varianteId: string) {
  const lineas = await leerCarrito();
  await guardarVigentes(lineas.filter((l) => l.v !== varianteId));
}

/** Deja cada ítem con la cantidad que hay en stock y quita los agotados o no disponibles. */
export async function ajustarAlStock() {
  const items = await detalleCarrito(await leerCarrito());
  await guardarCarrito(
    items.map((i) => ({ v: i.varianteId, q: Math.min(i.cantidad, i.stock, MAX_CANTIDAD) })),
  );
}
