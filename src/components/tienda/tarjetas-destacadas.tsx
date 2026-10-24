import Link from "next/link";
import type { Tarjeta } from "@/lib/portada";
import { Foto } from "./foto";

/**
 * Tarjetas grandes del inicio, debajo de la portada: Tendencias, Deportes y
 * Outlet (se editan en el panel → Portada). En la compu van de a tres; en el
 * celular se deslizan de costado y asoma la siguiente.
 * Los colores con [#…] son fijos a propósito: el texto va sobre la foto y
 * tiene que ser blanco también en modo oscuro (igual que en la portada).
 */
export function TarjetasDestacadas({ tarjetas }: { tarjetas: Tarjeta[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
      {tarjetas.map((t) => (
        <li key={t.seccion} className="w-[78%] shrink-0 snap-start sm:w-auto">
          <Link
            href={`/${t.seccion}`}
            className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-[#3f3f46] transition-transform active:scale-[0.98]"
          >
            {t.foto ? (
              <Foto
                src={t.foto}
                alt=""
                fill
                sizes="(min-width: 1280px) 416px, (min-width: 640px) 33vw, 78vw"
                className="object-cover transition-[scale] duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              // Sin foto todavía: fondo neutro y aviso para completarla en el panel.
              <span className="absolute top-3 right-3 rounded border border-dashed border-[#fca5a5] bg-[#7f1d1d]/80 px-2 py-1 text-xs text-[#fff]">
                [Completar: foto]
              </span>
            )}
            {/* Velo oscuro abajo para que el texto blanco se lea sobre cualquier foto. */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#000]/70 via-[#000]/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-[#fff] sm:p-6">
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.titulo}</h3>
              {t.subtitulo && <p className="mt-1 text-sm text-[#fff]/90 sm:text-base">{t.subtitulo}</p>}
              <span className="mt-4 inline-block text-sm font-semibold underline underline-offset-4 group-hover:no-underline">
                Ver productos
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
