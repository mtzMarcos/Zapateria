import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente para leer datos públicos (catálogo, zonas de envío) desde el servidor.
 *
 * Usa la clave pública, así que RLS aplica: solo ve lo que cualquier
 * visitante puede ver. No lee cookies, por eso se puede usar dentro de
 * funciones con 'use cache'.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
