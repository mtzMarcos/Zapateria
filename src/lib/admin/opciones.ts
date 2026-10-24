import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type Opcion = { id: string; name: string };

/** Una categoría con sus subcategorías, para el desplegable del producto. */
export type OpcionCategoria = Opcion & { subcategorias: Opcion[] };

/** Marcas y categorías (en árbol) para los desplegables del formulario de producto. */
export async function opcionesProducto(supabase: SupabaseClient) {
  const [marcas, categorias] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name, parent_id").order("position").order("name"),
  ]);
  if (marcas.error) throw marcas.error;
  if (categorias.error) throw categorias.error;

  const filas = categorias.data as (Opcion & { parent_id: string | null })[];
  return {
    marcas: marcas.data as Opcion[],
    categorias: filas
      .filter((c) => !c.parent_id)
      .map(({ id, name }) => ({
        id,
        name,
        subcategorias: filas.filter((s) => s.parent_id === id).map((s) => ({ id: s.id, name: s.name })),
      })) as OpcionCategoria[],
  };
}
