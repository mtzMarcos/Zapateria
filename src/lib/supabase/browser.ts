import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Cliente para el navegador, con la sesión del usuario logueado.
 * Se usa solo para subir fotos directo a Supabase Storage (así no pasan
 * por nuestro servidor, que tiene un límite de tamaño por request).
 */
export function createBrowserSupabase() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
