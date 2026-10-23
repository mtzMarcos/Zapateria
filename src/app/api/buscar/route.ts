import type { NextRequest } from "next/server";
import { obtenerCatalogo } from "@/lib/catalogo";
import { coincideBusqueda } from "@/lib/filtros";

// Sugerencias del buscador del encabezado: hasta 6 productos que coinciden
// por nombre, marca o categoría. Usa el catálogo cacheado (no consulta la base
// en cada letra). Los que tienen stock van primero.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ productos: [], total: 0 });

  const encontrados = (await obtenerCatalogo())
    .filter((p) => coincideBusqueda(p, q))
    .toSorted((a, b) => Number(a.stockTotal === 0) - Number(b.stockTotal === 0));

  return Response.json({
    total: encontrados.length,
    productos: encontrados.slice(0, 6).map((p) => ({
      slug: p.slug,
      nombre: p.name,
      marca: p.marca?.name ?? null,
      precio: p.price,
      foto: p.portada,
    })),
  });
}
