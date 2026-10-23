"use client";

import Image from "next/image";
import { useRef, useState, ViewTransition } from "react";

/**
 * Fotos del producto. En el celular se pasan deslizando (scroll con "snap")
 * y los puntitos indican cuál se ve; en la compu, además, miniaturas.
 */
export function Galeria({ id, fotos, nombre }: { id: string; fotos: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  const carrusel = useRef<HTMLDivElement>(null);

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        Sin foto
      </div>
    );
  }

  const irA = (i: number) => {
    const el = carrusel.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      {/* En el celular ocupa todo el ancho (sin el margen de la página). */}
      <div className="relative -mx-4 md:mx-0">
        <div
          ref={carrusel}
          onScroll={(e) => {
            const el = e.currentTarget;
            setActual(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto bg-neutral-100 [scrollbar-width:none] md:rounded-lg [&::-webkit-scrollbar]:hidden"
          aria-label={`Fotos de ${nombre}`}
          role="region"
          tabIndex={0}
        >
          {fotos.map((foto, i) => {
            const diapositiva = (
              <div key={foto} className="relative aspect-square w-full shrink-0 snap-center">
                <Image
                  src={foto}
                  alt={fotos.length > 1 ? `${nombre}, foto ${i + 1} de ${fotos.length}` : nombre}
                  fill
                  // La primera es la imagen principal de la página: se pide enseguida.
                  preload={i === 0}
                  sizes="(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
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
        </div>

        {fotos.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
            {fotos.map((foto, i) => (
              <span
                key={foto}
                className={`size-2 rounded-full ${i === actual ? "bg-neutral-900" : "bg-neutral-400"}`}
              />
            ))}
          </div>
        )}
      </div>

      {fotos.length > 1 && (
        <ul className="mt-3 hidden grid-cols-5 gap-2 md:grid">
          {fotos.map((foto, i) => (
            <li key={foto}>
              <button
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual ? "true" : undefined}
                className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 ${
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
