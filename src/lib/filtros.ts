import type { ProductoResumen } from "@/lib/catalogo";
import { compararTalles } from "@/lib/talles";

export const ordenes = {
  recientes: "Más nuevos",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
} as const;

export type Orden = keyof typeof ordenes;

export type Filtros = {
  categoria?: string;
  marca?: string;
  talle?: string;
  orden: Orden;
};

type SearchParams = Record<string, string | string[] | undefined>;

function primero(valor: string | string[] | undefined) {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return v?.trim() || undefined;
}

/** Lee los filtros de la URL: /productos?categoria=zapatillas&talle=40&orden=precio-asc */
export function leerFiltros(searchParams: SearchParams): Filtros {
  const orden = primero(searchParams.orden);
  return {
    categoria: primero(searchParams.categoria),
    marca: primero(searchParams.marca),
    talle: primero(searchParams.talle),
    orden: orden && orden in ordenes ? (orden as Orden) : "recientes",
  };
}

/** Arma la URL del catálogo cambiando algunos filtros y manteniendo el resto. */
export function urlCatalogo(filtros: Filtros, cambios: Partial<Filtros>) {
  const nuevos = { ...filtros, ...cambios };
  const params = new URLSearchParams();
  if (nuevos.categoria) params.set("categoria", nuevos.categoria);
  if (nuevos.marca) params.set("marca", nuevos.marca);
  if (nuevos.talle) params.set("talle", nuevos.talle);
  if (nuevos.orden !== "recientes") params.set("orden", nuevos.orden);
  const query = params.toString();
  return query ? `/productos?${query}` : "/productos";
}

/** Aplica los filtros y el orden. Los productos sin stock van siempre al final. */
export function filtrarProductos(productos: ProductoResumen[], filtros: Filtros) {
  const resultado = productos.filter(
    (p) =>
      (!filtros.categoria || p.categoria?.slug === filtros.categoria) &&
      (!filtros.marca || p.marca?.slug === filtros.marca) &&
      (!filtros.talle || p.talles.some((t) => t.size === filtros.talle && t.stock > 0)),
  );

  return resultado.toSorted((a, b) => {
    const sinStock = Number(a.stockTotal === 0) - Number(b.stockTotal === 0);
    if (sinStock !== 0) return sinStock;
    if (filtros.orden === "precio-asc") return a.price - b.price;
    if (filtros.orden === "precio-desc") return b.price - a.price;
    return 0; // "recientes": el catálogo ya viene ordenado así
  });
}

/** Categorías, marcas y talles que tienen al menos un producto visible (para los filtros). */
export function opcionesDeFiltro(productos: ProductoResumen[]) {
  const categorias = new Map<string, { name: string; slug: string; position: number }>();
  const marcas = new Map<string, { name: string; slug: string }>();
  const talles = new Set<string>();

  for (const p of productos) {
    if (p.categoria) categorias.set(p.categoria.slug, p.categoria);
    if (p.marca) marcas.set(p.marca.slug, p.marca);
    for (const t of p.talles) if (t.stock > 0) talles.add(t.size);
  }

  return {
    categorias: [...categorias.values()].toSorted(
      (a, b) => a.position - b.position || a.name.localeCompare(b.name, "es"),
    ),
    marcas: [...marcas.values()].toSorted((a, b) => a.name.localeCompare(b.name, "es")),
    talles: [...talles].toSorted(compararTalles),
  };
}
