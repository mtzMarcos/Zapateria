import "server-only";
import { cookies } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { urlFoto } from "@/lib/supabase/env";

// El carrito se guarda en una cookie con solo el id del talle (variante) y la
// cantidad. Precio, nombre y stock se leen siempre de la base, así nadie puede
// cambiar un precio editando la cookie y el carrito muestra el stock actual.

export type LineaCarrito = { v: string; q: number };

export type ItemCarrito = {
  varianteId: string;
  productoId: string;
  slug: string;
  nombre: string;
  talle: string;
  precio: number;
  foto: string | null;
  cantidad: number;
  stock: number;
};

const COOKIE = "carrito";
const MAX_LINEAS = 20;
/** Máximo de unidades de un mismo producto y talle por compra. */
export const MAX_CANTIDAD = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function esUuid(valor: string) {
  return UUID.test(valor);
}

/** Lee el carrito de la cookie. Si la cookie está rota o fue editada, ignora lo que no sirve. */
export async function leerCarrito(): Promise<LineaCarrito[]> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return [];

  try {
    const datos: unknown = JSON.parse(valor);
    if (!Array.isArray(datos)) return [];
    return datos
      .filter(
        (l): l is LineaCarrito =>
          typeof l?.v === "string" && esUuid(l.v) && Number.isInteger(l?.q) && l.q > 0,
      )
      .slice(0, MAX_LINEAS)
      .map((l) => ({ v: l.v, q: Math.min(l.q, MAX_CANTIDAD) }));
  } catch {
    return [];
  }
}

/** Guarda el carrito. Solo se puede llamar desde una Server Action. */
export async function guardarCarrito(lineas: LineaCarrito[]) {
  const cookieStore = await cookies();
  const validas = lineas.filter((l) => l.q > 0).slice(0, MAX_LINEAS);

  if (validas.length === 0) {
    cookieStore.delete(COOKIE);
    return;
  }
  cookieStore.set(COOKIE, JSON.stringify(validas), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

export function cantidadTotal(lineas: LineaCarrito[]) {
  return lineas.reduce((total, l) => total + l.q, 0);
}

type FilaVariante = {
  id: string;
  size: string;
  stock: number;
  products: {
    id: string;
    slug: string;
    name: string;
    price: number;
    product_images: { storage_path: string; position: number }[];
  };
};

/**
 * Datos actuales (sin caché) de cada línea del carrito, en el mismo orden.
 * Las líneas de productos que ya no existen o están ocultos no aparecen.
 */
export async function detalleCarrito(lineas: LineaCarrito[]): Promise<ItemCarrito[]> {
  if (lineas.length === 0) return [];

  const { data, error } = await createPublicClient()
    .from("product_variants")
    .select("id, size, stock, products!inner(id, slug, name, price, product_images(storage_path, position))")
    .in(
      "id",
      lineas.map((l) => l.v),
    )
    // RLS ya oculta los talles de productos ocultos; esto lo deja explícito.
    .eq("products.active", true);
  if (error) throw new Error(`No se pudo cargar el carrito: ${error.message}`);

  const porId = new Map((data as unknown as FilaVariante[]).map((f) => [f.id, f]));
  return lineas.flatMap((linea) => {
    const fila = porId.get(linea.v);
    if (!fila) return [];
    const portada = fila.products.product_images.toSorted((a, b) => a.position - b.position)[0];
    return [
      {
        varianteId: fila.id,
        productoId: fila.products.id,
        slug: fila.products.slug,
        nombre: fila.products.name,
        talle: fila.size,
        precio: Number(fila.products.price),
        foto: portada ? urlFoto(portada.storage_path) : null,
        cantidad: linea.q,
        stock: fila.stock,
      },
    ];
  });
}

/** Problema de un ítem que impide comprarlo tal como está, o null si está bien. */
export function problemaItem(item: ItemCarrito) {
  if (item.stock === 0) return "Sin stock en este talle.";
  if (item.cantidad > item.stock) {
    return `Solo ${item.stock === 1 ? "queda 1 unidad" : `quedan ${item.stock} unidades`}.`;
  }
  return null;
}

export function subtotal(items: ItemCarrito[]) {
  return items.reduce((total, i) => total + i.precio * i.cantidad, 0);
}
