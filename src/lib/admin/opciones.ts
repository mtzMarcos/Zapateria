import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Marcas y categorías para los desplegables del formulario de producto. */
export async function opcionesProducto(supabase: SupabaseClient) {
  const [marcas, categorias] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("position").order("name"),
  ]);
  if (marcas.error) throw marcas.error;
  if (categorias.error) throw categorias.error;

  return {
    marcas: marcas.data as { id: string; name: string }[],
    categorias: categorias.data as { id: string; name: string }[],
  };
}
