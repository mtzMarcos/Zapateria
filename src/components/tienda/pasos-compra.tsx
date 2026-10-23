import { IconoCheck } from "./iconos";

const pasos = ["Carrito", "Datos y entrega", "Pago"] as const;

/** Pasos de la compra (el pago es en Mercado Pago). `actual`: 0 = carrito, 1 = datos y entrega. */
export function PasosCompra({ actual }: { actual: 0 | 1 }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs sm:text-sm" aria-label="Pasos de la compra">
      {pasos.map((paso, i) => {
        const hecho = i < actual;
        const esActual = i === actual;
        return (
          <li key={paso} className="flex items-center gap-2" aria-current={esActual ? "step" : undefined}>
            {i > 0 && <span className="h-px w-4 bg-neutral-300 sm:w-8" aria-hidden />}
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                hecho || esActual ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-500"
              }`}
              aria-hidden
            >
              {hecho ? <IconoCheck className="size-3.5" /> : i + 1}
            </span>
            <span className={esActual ? "font-medium" : "text-neutral-500"}>
              {paso}
              {hecho && <span className="sr-only"> (hecho)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
