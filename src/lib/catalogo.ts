import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { urlFoto } from "@/lib/supabase/env";
import { compararTalles } from "@/lib/talles";

// Todas las consultas de la tienda se cachean con la etiqueta "catalogo".
// El panel la invalida (updateTag) cada vez que se modifica algo, así los
// cambios se ven enseguida. cacheLife("hours") es solo una red de seguridad
// por si algo cambia la base por fuera del panel.

type Referencia = { name: string; slug: string };
export type Talle = { size: string; stock: number };

export type ProductoResumen = {
  id: string;
  slug: string;
  name: string;
  price: number;
  marca: Referencia | null;
  categoria: (Referencia & { position: number }) | null;
  portada: string | null;
  talles: Talle[];
  stockTotal: number;
};

export type ProductoDetalle = ProductoResumen & {
  description: string;
  fotos: string[];
};

type FilaProducto = {
  id: string;
  slug: string;
  name: string;
  price: number;
  description?: string;
  brands: Referencia | null;
  categories: (Referencia & { position: number }) | null;
  product_variants: Talle[];
  product_images: { storage_path: string }[];
};

const columnas =
  "id, slug, name, price, brands(name, slug), categories(name, slug, position), product_variants(size, stock), product_images(storage_path)";

function normalizar(fila: FilaProducto): ProductoResumen {
  const talles = fila.product_variants.toSorted((a, b) => compararTalles(a.size, b.size));
  return {
    id: fila.id,
    slug: fila.slug,
    name: fila.name,
    price: Number(fila.price),
    marca: fila.brands,
    categoria: fila.categories,
    portada: fila.product_images[0] ? urlFoto(fila.product_images[0].storage_path) : null,
    talles,
    stockTotal: talles.reduce((total, t) => total + t.stock, 0),
  };
}

/**
 * Todos los productos visibles, del más nuevo al más viejo.
 * Es una tienda chica (cientos de productos como mucho), así que se trae
 * todo junto y los filtros se aplican en memoria.
 */
export async function obtenerCatalogo(): Promise<ProductoResumen[]> {
  "use cache";
  cacheTag("catalogo");
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("products")
    .select(columnas)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" });
  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);

  return (data as unknown as FilaProducto[]).map(normalizar);
}

/** Un producto visible por su slug, con todas sus fotos. null si no existe o está oculto. */
export async function obtenerProducto(slug: string): Promise<ProductoDetalle | null> {
  "use cache";
  cacheTag("catalogo");
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("products")
    .select(`${columnas}, description`)
    .eq("slug", slug)
    .eq("active", true)
    .order("position", { referencedTable: "product_images" })
    .order("created_at", { referencedTable: "product_images" })
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`);
  if (!data) return null;

  const fila = data as unknown as FilaProducto;
  return {
    ...normalizar(fila),
    description: fila.description ?? "",
    fotos: fila.product_images.map((f) => urlFoto(f.storage_path)),
  };
}
