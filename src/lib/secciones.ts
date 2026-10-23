import type { ProductoResumen } from "@/lib/catalogo";

// Público de cada producto (columna products.audience) y secciones del menú
// principal. Lo usan el panel (formulario de producto) y la tienda (menú y
// páginas /mujer, /hombre, /ninos, /tendencias, /deportes y /outlet).

export const publicos = {
  mujer: "Mujer",
  hombre: "Hombre",
  ninos: "Niños",
  unisex: "Unisex",
} as const;

export type Publico = keyof typeof publicos;

export const esPublico = (valor: string): valor is Publico => valor in publicos;

type Seccion = {
  slug: string;
  nombre: string;
  descripcion: string;
  incluye: (p: ProductoResumen) => boolean;
};

/** Secciones del menú, en el orden en que se muestran. Los unisex van en Mujer y en Hombre. */
export const secciones: Seccion[] = [
  {
    slug: "mujer",
    nombre: "Mujer",
    descripcion: "Zapatillas y calzado para mujer.",
    incluye: (p) => p.publico === "mujer" || p.publico === "unisex",
  },
  {
    slug: "hombre",
    nombre: "Hombre",
    descripcion: "Zapatillas y calzado para hombre.",
    incluye: (p) => p.publico === "hombre" || p.publico === "unisex",
  },
  {
    slug: "ninos",
    nombre: "Niños",
    descripcion: "Zapatillas y calzado para chicos.",
    incluye: (p) => p.publico === "ninos",
  },
  {
    slug: "tendencias",
    nombre: "Tendencias",
    descripcion: "Los modelos que se están usando.",
    incluye: (p) => p.tendencia,
  },
  {
    slug: "deportes",
    nombre: "Deportes",
    descripcion: "Para correr, entrenar y jugar.",
    incluye: (p) => p.deportes,
  },
  {
    slug: "outlet",
    nombre: "Outlet",
    descripcion: "Precios especiales por tiempo limitado.",
    incluye: (p) => p.outlet,
  },
];

export function buscarSeccion(slug: string) {
  return secciones.find((s) => s.slug === slug);
}
