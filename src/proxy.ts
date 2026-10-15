import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Corre antes de cada request a /admin:
 * 1. Renueva la sesión de Supabase si el token está por vencer.
 * 2. Si no hay sesión, manda al login (chequeo rápido; la verificación
 *    real de que sea administrador se hace en cada página y acción).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [nombre, valor] of Object.entries(headers ?? {})) {
          response.headers.set(nombre, valor);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const enLogin = request.nextUrl.pathname === "/admin/login";

  if (!data?.claims && !enLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
