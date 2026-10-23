"use client";

import Image from "next/image";
import { useRef, useState, ViewTransition } from "react";
import { Foto } from "@/components/tienda/foto";
import { useCargarDespues } from "@/components/tienda/cargar-despues";

/**
 * Fotos del producto, una encima de otra: al cambiar de foto se funden
 * (fundido cruzado). En el celular se cambian deslizando el dedo y los
 * puntitos indican cuál se ve; en la compu, con las miniaturas. Con el foco
 * en la foto, también con las flechas del teclado.
 */
export function Galeria({ id, fotos, nombre }: { id: string; fotos: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  const toque = useRef<number | null>(null);
  // La primera foto se pide enseguida; las demás, cuando la página terminó de cargar.
  const todas = useCargarDespues();
  const [vistas, setVistas] = useState(() => new Set([0]));

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        Sin foto
      </div>
    );
  }

  const varias = fotos.length > 1;
  const irA = (i: number) => {
    const n = (i + fotos.length) % fotos.length;
    setActual(n);
    setVistas((v) => (v.has(n) ? v : new Set(v).add(n)));
  };

  return (
    <div>
      {/* En el celular ocupa todo el ancho (sin el margen de la página). */}
      <div
        role="region"
        aria-roledescription="galería"
        aria-label={`Fotos de ${nombre}`}
        tabIndex={varias ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") irA(actual + 1);
          if (e.key === "ArrowLeft") irA(actual - 1);
        }}
        onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (toque.current === null || !varias) return;
          const dx = e.changedTouches[0].clientX - toque.current;
          toque.current = null;
          if (Math.abs(dx) > 40) irA(actual + (dx < 0 ? 1 : -1));
        }}
        className="relative -mx-4 grid overflow-hidden bg-neutral-100 outline-offset-2 md:mx-0 md:rounded-lg"
      >
        {fotos.map((foto, i) => {
          const visible = i === actual;
          const diapositiva = (
            <div
              key={foto}
              aria-hidden={!visible}
              className={`relative col-start-1 row-start-1 aspect-square w-full transition-opacity duration-500 ease-in-out ${
                visible ? "opacity-100" : "opacity-0"
              }`}
            >
              {(i === 0 || todas || vistas.has(i)) && (
                <Foto
                  src={foto}
                  alt={varias ? `${nombre}, foto ${i + 1} de ${fotos.length}` : nombre}
                  fill
                  // La primera es la imagen principal de la página: se pide enseguida.
                  preload={i === 0}
                  sizes="(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              )}
            </div>
          );
          // La primera foto tiene el mismo name que la foto de la tarjeta: al
          // entrar desde la grilla, la tarjeta "viaja" hasta acá.
          return i === 0 ? (
            <ViewTransition key={foto} name={`foto-${id}`} share="morph" default="none">
              {diapositiva}
            </ViewTransition>
          ) : (
            diapositiva
          );
        })}

        {varias && (
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1 md:hidden">
            {fotos.map((foto, i) => (
              <button
                key={foto}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual ? "true" : undefined}
                className="flex size-6 items-center justify-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === actual ? "w-5 bg-neutral-900" : "w-1.5 bg-neutral-400"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {varias && (
        <ul className="mt-3 hidden grid-cols-5 gap-2 md:grid">
          {fotos.map((foto, i) => (
            <li key={foto}>
              <button
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual ? "true" : undefined}
                className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 transition-colors ${
                  i === actual ? "border-neutral-900" : "border-transparent hover:border-neutral-300"
                }`}
              >
                <Image src={foto} alt="" fill sizes="110px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
