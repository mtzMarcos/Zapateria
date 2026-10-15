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
  });
}
