"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Portada } from "@/lib/portada";
import { useCargarDespues } from "./cargar-despues";
import { IconoFlecha, IconoPausa, IconoPlay } from "./iconos";

const INTERVALO = 6000; // ms entre portadas

// Los textos van sobre fotos: usan colores fijos (blanco sobre un velo oscuro)
// en vez de la paleta, que en modo oscuro se invierte.

/**
 * Carrusel del inicio: fotos a todo el ancho con título, subtítulo y botón,
 * una encima de otra: al pasar de una a otra se funden (fundido cruzado).
 * Pasa solo cada 6 segundos (salvo que la persona pida "reducir movimiento"),
 * se pausa al pasar el mouse, al enfocar con el teclado o con el botón de
 * pausa. En el celular se cambia deslizando el dedo; con el teclado, con las
 * flechas.
 */
export function CarruselPortada({ portadas }: { portadas: Portada[] }) {
  const toque = useRef<number | null>(null);
  const [actual, setActual] = useState(0);
  // La primera foto se pide enseguida; las demás, cuando la página terminó de cargar.
  const todas = useCargarDespues();
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

  const irA = (i: number) => setActual((i + portadas.length) % portadas.length);

  useEffect(() => {
    if (!varias || pausado || enUso || !movimiento) return;
    const temporizador = setInterval(() => {
      if (!document.hidden) setActual((a) => (a + 1) % portadas.length);
    }, INTERVALO);
    return () => clearInterval(temporizador);
  }, [varias, pausado, enUso, movimiento, portadas.length]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="relative"
      onMouseEnter={() => setEnUso(true)}
      onMouseLeave={() => setEnUso(false)}
      onFocus={() => setEnUso(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setEnUso(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") irA(actual + 1);
        if (e.key === "ArrowLeft") irA(actual - 1);
      }}
      onTouchStart={(e) => {
        setEnUso(true);
        toque.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        setTimeout(() => setEnUso(false), INTERVALO);
        if (toque.current === null || !varias) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        toque.current = null;
        if (Math.abs(dx) > 40) irA(actual + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Todas las portadas en la misma celda de la grilla: se ven una encima de otra. */}
      <div className="relative grid">
        {portadas.map((p, i) => (
          <Diapositiva
            key={p.id}
            portada={p}
            numero={i + 1}
            total={portadas.length}
            prioridad={i === 0}
            activa={i === actual}
            conFoto={i === 0 || todas}
          />
        ))}

        {varias && (
          <>
            <button
              type="button"
              onClick={() => irA(actual - 1)}
              aria-label="Portada anterior"
              className="absolute top-1/2 left-4 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#fff]/85 text-[#111] shadow hover:bg-[#fff] md:flex"
            >
              <IconoFlecha direccion="izquierda" />
            </button>
            <button
              type="button"
              onClick={() => irA(actual + 1)}
              aria-label="Portada siguiente"
              className="absolute top-1/2 right-4 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#fff]/85 text-[#111] shadow hover:bg-[#fff] md:flex"
            >
              <IconoFlecha />
            </button>

            {/* Puntitos y pausa sobre una pastilla oscura: se ven con cualquier color de foto. */}
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-[#000]/35 py-1 pr-1 pl-2 backdrop-blur-sm">
                <div className="flex gap-1">
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
                        className={`block h-1.5 rounded-full transition-all duration-300 ${
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
                    className="flex size-7 items-center justify-center rounded-full text-[#fff] hover:bg-[#fff]/20"
                  >
                    {pausado ? <IconoPlay className="size-4" /> : <IconoPausa className="size-4" />}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Diapositiva({
  portada,
  numero,
  total,
  prioridad,
  activa,
  conFoto,
}: {
  portada: Portada;
  numero: number;
  total: number;
  prioridad: boolean;
  activa: boolean;
  conFoto: boolean;
}) {
  return (
    <div
      role="group"
      aria-roledescription="diapositiva"
      aria-label={`${numero} de ${total}`}
      aria-hidden={!activa}
      // inert: las portadas que no se ven no reciben foco ni clics.
      inert={!activa}
      className={`relative col-start-1 row-start-1 aspect-[4/5] w-full overflow-hidden bg-[#3f3f46] transition-opacity duration-700 ease-in-out sm:aspect-[16/9] md:aspect-[12/5] md:max-h-[640px] ${
        activa ? "z-[1] opacity-100" : "opacity-0"
      }`}
    >
      {portada.foto && conFoto ? (
        <Foto portada={portada} prioridad={prioridad} />
      ) : portada.foto ? null : (
        // Sin foto todavía: fondo neutro y aviso para completarla en el panel.
        <span className="absolute top-4 right-4 rounded border border-dashed border-[#fca5a5] bg-[#7f1d1d]/80 px-2 py-1 text-xs text-[#fff]">
          [Completar: foto de portada]
        </span>
      )}
      {/* Velo oscuro detrás del texto. En el celular queda a la altura del texto y no llega
          al borde de abajo, así el fundido con la página no se ve gris. */}
      <div className="velo-portada absolute inset-0 md:bg-gradient-to-r md:from-[#000]/55 md:via-[#000]/20 md:to-transparent" />
      {/* La parte de abajo de la foto se funde con el fondo de la página (igual en todas las portadas). */}
      <div aria-hidden className="fundido-portada pointer-events-none absolute inset-x-0 bottom-0 h-[40%]" />
      {/* El texto queda por encima del fundido. El padding en % se mide sobre el ancho:
          50 % del ancho = 40 % de la altura con la foto 4:5 del celular (23 % con la 16:9).
          En la compu va centrado, un poco más arriba del medio. */}
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-6 pb-[50%] text-[#fff] sm:pb-[23%] md:top-0 md:flex md:flex-col md:justify-center md:px-10 md:pb-24">
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
