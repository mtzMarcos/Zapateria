import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// Archivos del bucket product-images que no son fotos de productos: logos de
// marcas (marcas/) y fotos de la portada (portada/). Los sube el navegador
// (src/components/admin/campo-imagen.tsx); el servidor valida la ruta antes
// de guardarla en la base.

export type Carpeta = "marcas" | "portada";

/** true si la ruta tiene la forma "<carpeta>/<uuid>.<jpg|png|webp>". */
export function rutaValida(carpeta: Carpeta, ruta: string) {
  return new RegExp(`^${carpeta}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(ruta);
}

/**
 * Borra archivos del bucket. Usa la clave secreta porque Storage exige
 * permiso de lectura además del de borrado; quien llama ya verificó que
 * el usuario es admin.
 */
export async function borrarArchivos(rutas: (string | null | undefined)[]) {
  const validas = rutas.filter((r): r is string => !!r);
  if (validas.length === 0) return;
  const { error } = await createServiceClient().storage.from("product-images").remove(validas);
  if (error) console.error("No se pudieron borrar archivos del bucket:", error.message);
}
