/** Ordena talles "como números" cuando se puede: 35, 36, 40.5, 41 (y S, M, L alfabéticamente). */
export function compararTalles(a: string, b: string) {
  return a.localeCompare(b, "es", { numeric: true });
}
