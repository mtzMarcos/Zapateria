import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export type ZonaEnvio = { id: string; name: string; price: number };

/** Zonas de envío activas, en el orden del panel. Sin caché: se usa al comprar. */
export async function obtenerZonas(): Promise<ZonaEnvio[]> {
  const { data, error } = await createPublicClient()
    .from("shipping_zones")
    .select("id, name, price")
    .eq("active", true)
    .order("position");
  if (error) throw new Error(`No se pudieron cargar las zonas de envío: ${error.message}`);

  return data.map((z) => ({ ...z, price: Number(z.price) }));
}
