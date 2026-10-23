"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Portada } from "@/lib/portada";
import { IconoFlecha, IconoPausa, IconoPlay } from "./iconos";

const INTERVALO = 6000; // ms entre portadas

// Los textos van sobre fotos: usan colores fijos (blanco sobre un velo oscuro)
// en vez de la paleta, que en modo oscuro se invierte.

/**
 * Carrusel del inicio: fotos a todo el ancho con título, subtítulo y botón.
 * Pasa solo cada 6 segundos (salvo que la persona pida "reducir movimiento"),
 * se pausa al pasar el mouse, al enfocar con el teclado o con el botón de
 * pausa, y en el celular se desliza con el dedo.
 */
export function CarruselPortada({ portadas }: { portadas: Portada[] }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false); // pausa elegida con el botón
  const [enUso, setEnUso] = useState(false); // mouse encima, foco o dedo
  const [movimiento, setMovimiento] = useState(true);
  const varias = portadas.length > 1;

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actualizar = () => setMovimiento(!consulta.matches);
    actualizar();
    consulta.addEventListener("change", actualizar);
    return () => consulta.removeEventListener("change", actualizar);
  }, []);

  const irA = useCallback((i: number) => {
    const el = pista.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!varias || pausado || enUso || !movimiento) return;
    const temporizador = setInterval(() => {
      if (document.hidden) return;
      irA((actual + 1) % portadas.length);
    }, INTERVALO);
    return () => clearInterval(temporizador);
  }, [varias, pausado, enUso, movimiento, actual, portadas.length, irA]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="relative"
      onMouseEnter={() => setEnUso(true)}
      onMouseLeave={() => setEnUso(false)}
      onFocus={() => setEnUso(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setEnUso(false)}
      onTouchStart={() => setEnUso(true)}
      onTouchEnd={() => setTimeout(() => setEnUso(false), INTERVALO)}
    >
      <div
        ref={pista}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActual(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {portadas.map((p, i) => (
          <Diapositiva
            key={p.id}
            portada={p}
            numero={i + 1}
            total={portadas.length}
            prioridad={i === 0}
            activa={i === actual}
          />
        ))}
      </div>

      {varias && (
        <>
          <button
            type="button"
            onClick={() => irA((actual - 1 + portadas.length) % portadas.length)}
            aria-label="Portada anterior"
            className="absolute top-1/2 left-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#fff]/85 text-[#111] shadow hover:bg-[#fff] md:flex"
          >
            <IconoFlecha direccion="izquierda" />
          </button>
          <button
            type="button"
            onClick={() => irA((actual + 1) % portadas.length)}
            aria-label="Portada siguiente"
            className="absolute top-1/2 right-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#fff]/85 text-[#111] shadow hover:bg-[#fff] md:flex"
          >
            <IconoFlecha />
          </button>

          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
            <div className="flex gap-2">
              {portadas.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => irA(i)}
                  aria-label={`Ver portada ${i + 1}`}
                  aria-current={i === actual ? "true" : undefined}
                  className="flex size-6 items-center justify-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      i === actual ? "w-6 bg-[#fff]" : "w-1.5 bg-[#fff]/60"
                    }`}
                  />
                </button>
              ))}
            </div>
            {movimiento && (
              <button
                type="button"
                onClick={() => setPausado(!pausado)}
                aria-label={pausado ? "Reanudar el carrusel" : "Pausar el carrusel"}
                className="flex size-8 items-center justify-center rounded-full bg-[#000]/40 text-[#fff] hover:bg-[#000]/60"
              >
                {pausado ? <IconoPlay className="size-4" /> : <IconoPausa className="size-4" />}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Diapositiva({
  portada,
  numero,
  total,
  prioridad,
  activa,
}: {
  portada: Portada;
  numero: number;
  total: number;
  prioridad: boolean;
  activa: boolean;
}) {
  return (
    <div
      role="group"
      aria-roledescription="diapositiva"
      aria-label={`${numero} de ${total}`}
      className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-[#3f3f46] sm:aspect-[16/9] md:aspect-[12/5] md:max-h-[640px]"
    >
      {portada.foto ? (
        <Foto portada={portada} prioridad={prioridad} />
      ) : (
        // Sin foto todavía: fondo neutro y aviso para completarla en el panel.
        <span className="absolute top-4 right-4 rounded border border-dashed border-[#fca5a5] bg-[#7f1d1d]/80 px-2 py-1 text-xs text-[#fff]">
          [Completar: foto de portada]
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000]/60 via-[#000]/15 to-transparent md:bg-gradient-to-r md:from-[#000]/55 md:via-[#000]/20" />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-6 pb-16 text-[#fff] md:top-0 md:flex md:flex-col md:justify-center md:px-10 md:pb-0">
        {/* El texto de la portada que se ve aparece suave (sube 12 px y se funde). */}
        <div
          className={`max-w-xl transition-[opacity,translate] duration-500 ease-out ${
            activa ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {portada.titulo && (
            <p className="text-3xl leading-tight font-bold tracking-tight uppercase sm:text-4xl md:text-5xl">
              {portada.titulo}
            </p>
          )}
          {portada.subtitulo && <p className="mt-3 text-base sm:text-lg">{portada.subtitulo}</p>}
          <Link
            href={portada.link}
            className="mt-6 inline-block rounded-full bg-[#fff] px-7 py-3 text-sm font-semibold text-[#111] hover:bg-[#e5e5e5]"
          >
            {portada.boton}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Foto de la portada: la de celular (si hay) en pantallas chicas y la de compu en las grandes. */
function Foto({ portada, prioridad }: { portada: Portada; prioridad: boolean }) {
  const comun = {
    alt: "",
    fill: true,
    sizes: "100vw",
    loading: prioridad ? ("eager" as const) : ("lazy" as const),
    fetchPriority: prioridad ? ("high" as const) : undefined,
  };
  const {
    props: { srcSet: compu },
  } = getImageProps({ ...comun, src: portada.foto! });
  const {
    props: { srcSet: celular, ...resto },
  } = getImageProps({ ...comun, src: portada.fotoCelular ?? portada.foto! });

  return (
    <picture>
      <source media="(min-width: 640px)" srcSet={compu} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- decorativa: el texto de la portada va encima */}
      <img {...resto} srcSet={celular} className="object-cover" />
    </picture>
  );
}
