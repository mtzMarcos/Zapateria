/** Resultado de una acción de formulario (panel o tienda), para mostrar un mensaje. */
export type EstadoForm = { error?: string; ok?: string };

export const estadoInicial: EstadoForm = {};

/** Traduce los errores más comunes de la base a un mensaje entendible. */
export function mensajeError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "Ya existe un registro con ese nombre.";
  if (error.code === "23503") {
    return "No se puede borrar porque está en uso (por ejemplo, tiene productos asignados).";
  }
  if (error.code === "23514") return "Algún valor no es válido (¿un número negativo?).";
  if (error.code === "42501") return "No tenés permisos para hacer esto.";
  return `Error de la base de datos: ${error.message}`;
}

/** Lee un campo de texto de un formulario, sin espacios en los extremos. */
export function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

/** Lee un número de un formulario. Devuelve null si está vacío o no es válido. */
export function numero(formData: FormData, campo: string) {
  const valor = texto(formData, campo).replace(",", ".");
  if (valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}
