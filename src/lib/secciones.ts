import type { ProductoResumen } from "@/lib/catalogo";

// Público de cada producto (columna products.audience) y secciones de la
// tienda. Lo usan el panel (formulario de producto) y la tienda (menú,
// tarjetas del inicio y páginas /hombre, /mujer, /ninos, /tendencias,
// /deportes y /outlet).

export const publicos = {
  mujer: "Mujer",
  hombre: "Hombre",
  ninos: "Niños",
  unisex: "Unisex",
} as const;

export type Publico = keyof typeof publicos;

export const esPublico = (valor: string): valor is Publico => valor in publicos;

/** Secciones que van como tarjetas en el inicio (tabla home_cards). */
export const destacadas = ["tendencias", "deportes", "outlet"] as const;
export type Destacada = (typeof destacadas)[number];

type Seccion = {
  slug: string;
  nombre: string;
  descripcion: string;
  /** true: va en el menú del encabezado. Las demás son tarjetas del inicio. */
  enMenu: boolean;
  incluye: (p: ProductoResumen) => boolean;
};

/** Secciones en el orden en que se muestran. Los unisex van en Hombre y en Mujer. */
export const secciones: Seccion[] = [
  {
    slug: "hombre",
    nombre: "Hombre",
    descripcion: "Zapatillas y calzado para hombre.",
    enMenu: true,
    incluye: (p) => p.publico === "hombre" || p.publico === "unisex",
  },
  {
    slug: "mujer",
    nombre: "Mujer",
    descripcion: "Zapatillas y calzado para mujer.",
    enMenu: true,
    incluye: (p) => p.publico === "mujer" || p.publico === "unisex",
  },
  {
    slug: "ninos",
    nombre: "Niños",
    descripcion: "Zapatillas y calzado para chicos.",
    enMenu: true,
    incluye: (p) => p.publico === "ninos",
  },
  {
    slug: "tendencias",
    nombre: "Tendencias",
    descripcion: "Los modelos que se están usando.",
    enMenu: false,
    incluye: (p) => p.tendencia,
  },
  {
    slug: "deportes",
    nombre: "Deportes",
    descripcion: "Para correr, entrenar y jugar.",
    enMenu: false,
    incluye: (p) => p.deportes,
  },
  {
    slug: "outlet",
    nombre: "Outlet",
    descripcion: "Precios especiales por tiempo limitado.",
    enMenu: false,
    incluye: (p) => p.outlet,
  },
];

export function buscarSeccion(slug: string) {
  return secciones.find((s) => s.slug === slug);
}
