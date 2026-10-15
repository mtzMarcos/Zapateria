import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Cliente con la sesión del usuario logueado (lee las cookies de Supabase Auth).
 *
 * Usa la clave pública, así que RLS aplica con los permisos de ese usuario:
 * si es admin puede editar el catálogo, si no, solo leer lo público.
 */
export async function createAuthClient() {
  const { url, key } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Desde un Server Component no se pueden escribir cookies.
          // No pasa nada: el proxy ya renueva la sesión en cada request.
        }
      },
    },
  });
}
