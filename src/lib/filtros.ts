import type { ProductoResumen } from "@/lib/catalogo";
import { compararTalles } from "@/lib/talles";

export const ordenes = {
  recientes: "Más nuevos",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
} as const;

export type Orden = keyof typeof ordenes;

export type Filtros = {
  /** Texto buscado (nombre, marca o categoría). */
  q?: string;
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
    q: primero(searchParams.q)?.slice(0, 80),
    categoria: primero(searchParams.categoria),
    marca: primero(searchParams.marca),
    talle: primero(searchParams.talle),
    orden: orden && orden in ordenes ? (orden as Orden) : "recientes",
  };
}

/**
 * Arma la URL del catálogo cambiando algunos filtros y manteniendo el resto.
 * `ruta`: la página del listado (/productos, /mujer, /marcas/nike…).
 */
export function urlCatalogo(filtros: Filtros, cambios: Partial<Filtros>, ruta = "/productos") {
  const nuevos = { ...filtros, ...cambios };
  const params = new URLSearchParams();
  if (nuevos.q) params.set("q", nuevos.q);
  if (nuevos.categoria) params.set("categoria", nuevos.categoria);
  if (nuevos.marca) params.set("marca", nuevos.marca);
  if (nuevos.talle) params.set("talle", nuevos.talle);
  if (nuevos.orden !== "recientes") params.set("orden", nuevos.orden);
  const query = params.toString();
  return query ? `${ruta}?${query}` : ruta;
}

/** Minúsculas y sin tildes, para comparar "Niños" con "ninos". */
export function normalizarTexto(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// Palabras del público que se pueden buscar ("zapatillas mujer"). Unisex vale para los dos.
const palabrasPublico: Record<string, string> = {
  mujer: "mujer",
  hombre: "hombre",
  ninos: "niños chicos",
  unisex: "unisex mujer hombre",
};

/** true si todas las palabras buscadas aparecen en el nombre, la marca, la categoría o el público. */
export function coincideBusqueda(producto: ProductoResumen, busqueda: string) {
  const palabras = normalizarTexto(busqueda).split(/\s+/).filter(Boolean);
  const texto = normalizarTexto(
    [producto.name, producto.marca?.name, producto.categoria?.name, palabrasPublico[producto.publico]]
      .filter(Boolean)
      .join(" "),
  );
  return palabras.every((palabra) => texto.includes(palabra));
}

/** Aplica los filtros y el orden. Los productos sin stock van siempre al final. */
export function filtrarProductos(productos: ProductoResumen[], filtros: Filtros) {
  const resultado = productos.filter(
    (p) =>
      (!filtros.q || coincideBusqueda(p, filtros.q)) &&
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
