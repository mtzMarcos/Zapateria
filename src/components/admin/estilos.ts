// Clases de Tailwind compartidas por el panel. Están en un archivo aparte
// (sin "use client") para poder usarlas en componentes de servidor y cliente.

const estilosBoton = {
  primario:
    "bg-neutral-900 text-white hover:bg-neutral-700 disabled:bg-neutral-300 disabled:text-neutral-700",
  secundario: "border border-neutral-300 bg-white hover:bg-neutral-100 disabled:text-neutral-500",
  peligro:
    "border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:border-neutral-200 disabled:text-neutral-500",
};

export type VarianteBoton = keyof typeof estilosBoton;

export function clasesBoton(variante: VarianteBoton = "primario") {
  return `inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed ${estilosBoton[variante]}`;
}

export const claseInput =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none";

export const claseLabel = "mb-1 block text-sm font-medium";
