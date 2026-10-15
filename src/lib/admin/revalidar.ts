import "server-only";
import { refresh, updateTag } from "next/cache";

/**
 * Llamar después de modificar el catálogo desde una acción del panel.
 * - "catalogo" es la etiqueta que usará la tienda pública (Etapa 3) para
 *   cachear productos: así los cambios se ven enseguida.
 * - refresh() actualiza la pantalla del panel con los datos nuevos.
 */
export function catalogoActualizado() {
  updateTag("catalogo");
  refresh();
}
