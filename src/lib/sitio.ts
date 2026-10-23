/**
 * URL pública de la tienda, sin barra final (NEXT_PUBLIC_SITE_URL).
 * La usan Mercado Pago (vuelta del comprador), los metadatos para compartir,
 * el sitemap y robots.txt. Al pasar al dominio propio, cambiarla en Vercel.
 */
export function urlSitio() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
