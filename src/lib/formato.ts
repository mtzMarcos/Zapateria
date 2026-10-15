const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Formatea un precio en pesos argentinos: 12000 → "$ 12.000" */
export function formatearPrecio(valor: number) {
  return pesos.format(valor);
}
