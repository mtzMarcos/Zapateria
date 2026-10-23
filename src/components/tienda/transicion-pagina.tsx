import { ViewTransition } from "react";

/**
 * Envuelve el contenido de cada página de la tienda: al navegar, la página que
 * se va se desvanece y la nueva aparece con un fundido corto (clase "pagina"
 * en globals.css). default="none": no anima en cambios dentro de la misma
 * página (filtros, carrito, formularios).
 */
export function TransicionPagina({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="pagina" exit="pagina" default="none">
      {children}
    </ViewTransition>
  );
}
