import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";

/**
 * Verifica que quien hace el request sea administrador y devuelve un
 * cliente de Supabase con su sesión. Si no lo es, lo manda al login.
 *
 * Llamarla al principio de TODA página y acción del panel: las acciones
 * se pueden invocar con un POST directo, sin pasar por la página.
 */
export const requireAdmin = cache(async () => {
  // El panel siempre se arma en el momento del request (nunca se prerenderiza):
  // Supabase consulta la hora para validar la sesión.
  await connection();
  const supabase = await createAuthClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const { data: esAdmin } = await supabase.rpc("is_admin");
  if (!esAdmin) redirect("/admin/login");

  return { supabase, email: String(data.claims.email ?? "") };
});
