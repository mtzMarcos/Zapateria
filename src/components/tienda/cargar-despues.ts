"use client";

import { useEffect, useState } from "react";

/**
 * true cuando la página ya terminó de cargar (y el navegador está libre): para
 * pedir recién ahí las fotos que no se ven al principio (las otras fotos de
 * la galería o del carrusel), sin competir con la foto principal.
 */
export function useCargarDespues() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const marcar = () => {
      const libre = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 200));
      libre(() => !cancelado && setListo(true));
    };
    if (document.readyState === "complete") marcar();
    else window.addEventListener("load", marcar, { once: true });
    return () => {
      cancelado = true;
      window.removeEventListener("load", marcar);
    };
  }, []);

  return listo;
}
