const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Formatea un precio en pesos argentinos: 12000 → "$ 12.000" */
export function formatearPrecio(valor: number) {
  return pesos.format(valor);
}

/** Porcentaje de descuento redondeado: (100000, 80000) → 20. */
export function descuento(precioAnterior: number, precio: number) {
  return Math.round((1 - precio / precioAnterior) * 100);
}
