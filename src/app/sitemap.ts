import type { MetadataRoute } from "next";
import { obtenerCatalogo } from "@/lib/catalogo";
import { opcionesDeFiltro } from "@/lib/filtros";
import { urlSitio } from "@/lib/sitio";

// Lista de páginas para los buscadores. Usa la caché del catálogo, así que se
// actualiza cuando cambian los productos desde el panel.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitio = urlSitio();
  const productos = await obtenerCatalogo();
  const { categorias } = opcionesDeFiltro(productos);

  return [
    { url: sitio, changeFrequency: "daily", priority: 1 },
    { url: `${sitio}/productos`, changeFrequency: "daily", priority: 0.9 },
    ...categorias.map((c) => ({
      url: `${sitio}/productos?categoria=${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...productos.map((p) => ({
      url: `${sitio}/productos/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.portada ? [p.portada] : undefined,
    })),
    ...["/terminos", "/cambios-y-devoluciones", "/privacidad", "/arrepentimiento"].map((ruta) => ({
      url: sitio + ruta,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
