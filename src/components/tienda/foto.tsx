"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Foto de la tienda: como <Image> de Next, pero aparece con un fundido suave
 * cuando termina de cargar (clase foto-suave en globals.css).
 *
 * El HTML llega con la foto visible: el fundido se activa recién al arrancar
 * el JavaScript y solo si la foto todavía no cargó. Así ninguna foto espera al
 * JavaScript para verse (no demora lo que mide Lighthouse) y sin JavaScript
 * se ven todas.
 */
export function Foto({ alt, className = "", onLoad, onError, ...props }: ImageProps) {
  const img = useRef<HTMLImageElement>(null);
  // inicial: como llegó del servidor (visible) · esperando: oculta hasta cargar · lista.
  const [fase, setFase] = useState<"inicial" | "esperando" | "lista">("inicial");

  useEffect(() => {
    if (img.current && !img.current.complete) setFase("esperando");
  }, []);

  const terminar = () => setFase((f) => (f === "esperando" ? "lista" : f));

  return (
    <Image
      {...props}
      ref={img}
      alt={alt}
      className={fase === "inicial" ? className : `foto-suave ${className}`}
      data-cargada={fase === "lista" || undefined}
      onLoad={(e) => {
        terminar();
        onLoad?.(e);
      }}
      // Si la foto no carga, que al menos se vea el texto alternativo.
      onError={(e) => {
        terminar();
        onError?.(e);
      }}
    />
  );
}
