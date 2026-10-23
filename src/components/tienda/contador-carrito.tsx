"use client";

import { useEffect, useRef, useState } from "react";
import { IconoBolsa } from "./iconos";

/**
 * Ícono del carrito con la cantidad. Cuando la cantidad sube (se agregó un
 * producto), el ícono hace un rebote y el número "late" una vez. No se anima
 * al cargar la página: compara con la cantidad anterior.
 */
export function ContadorCarrito({ cantidad }: { cantidad: number }) {
  const anterior = useRef(cantidad);
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    if (cantidad > anterior.current) setAnimar(true);
    anterior.current = cantidad;
  }, [cantidad]);

  return (
    <>
      <span className={animar ? "animate-rebote" : undefined} onAnimationEnd={() => setAnimar(false)}>
        <IconoBolsa className="size-6" />
      </span>
      <span className="sr-only md:not-sr-only">Carrito</span>
      {cantidad > 0 && (
        <span
          className={`absolute top-0.5 left-6 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-xs text-white md:static ${animar ? "animate-latido" : ""}`}
        >
          {cantidad}
          <span className="sr-only">{cantidad === 1 ? " producto" : " productos"}</span>
        </span>
      )}
    </>
  );
}
