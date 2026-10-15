import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave SECRETA: saltea RLS y puede hacer cualquier cosa.
 *
 * Usarlo solo en código de servidor que no depende del usuario (crear
 * pedidos, procesar el webhook de Mercado Pago). El import de
 * "server-only" hace que el build falle si alguien lo importa desde un
 * componente de cliente, para que la clave nunca llegue al navegador.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
