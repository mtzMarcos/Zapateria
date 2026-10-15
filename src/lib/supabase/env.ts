/**
 * URL y clave pública de Supabase. Se pueden leer tanto en el servidor
 * como en el navegador (Next incrusta las variables NEXT_PUBLIC_ en el build).
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local",
    );
  }

  return { url, key };
}

/** URL pública de una foto guardada en el bucket product-images. */
export function urlFoto(storagePath: string) {
  const { url } = supabaseEnv();
  return `${url}/storage/v1/object/public/product-images/${storagePath}`;
}
