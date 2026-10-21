import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Cliente para leer datos públicos (catálogo, zonas de envío) desde el servidor.
 *
 * Usa la clave pública, así que RLS aplica: solo ve lo que cualquier
 * visitante puede ver. No lee cookies, por eso se puede usar dentro de
 * funciones con 'use cache'.
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Si no, Next guarda cada consulta en su caché de fetch, que sobrevive
      // a los deploys y no se borra con updateTag("catalogo"): los cambios
      // del panel no se verían. La caché la manejamos con 'use cache'.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
