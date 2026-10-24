"use client";

import Image from "next/image";
import { useId, useState, useTransition } from "react";
import type { EstadoForm } from "@/lib/form";
import { colorDominante } from "@/lib/color-dominante";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { clasesBoton } from "./estilos";

const extensiones: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const tamanioMaximo = 5 * 1024 * 1024; // igual al límite del bucket

/**
 * Una imagen del panel (logo de marca, foto de portada): vista previa y
 * botones para subir, cambiar o quitar. El archivo se sube directo del
 * navegador a Supabase Storage y después `guardar` registra la ruta (o null
 * para quitarla); el servidor valida la ruta y borra el archivo anterior.
 * Con `conColor`, además calcula el color dominante de la franja de abajo de
 * la foto y se lo pasa a `guardar` (portadas: degradado con la página).
 */
export function CampoImagen({
  carpeta,
  url,
  etiqueta,
  ayuda,
  guardar,
  claseVista = "aspect-video w-full",
  ajuste = "object-cover",
  conColor = false,
  color,
}: {
  carpeta: "marcas" | "portada";
  url: string | null;
  etiqueta: string;
  ayuda?: string;
  guardar: (ruta: string | null, color?: string | null) => Promise<EstadoForm>;
  claseVista?: string;
  ajuste?: "object-cover" | "object-contain";
  conColor?: boolean;
  /** Color guardado de la foto actual (se muestra como una muestra). */
  color?: string | null;
}) {
  const [pendiente, startTransition] = useTransition();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  function registrar(ruta: string | null, colorFoto?: string | null) {
    startTransition(async () => {
      const resultado = await guardar(ruta, colorFoto);
      if (resultado.error) setError(resultado.error);
    });
  }

  async function subir(archivo: File) {
    setError(null);
    if (!extensiones[archivo.type]) return setError("La imagen tiene que ser JPG, PNG o WEBP.");
    if (archivo.size > tamanioMaximo) return setError("La imagen pesa más de 5 MB.");

    setSubiendo(true);
    const ruta = `${carpeta}/${crypto.randomUUID()}.${extensiones[archivo.type]}`;
    const [{ error }, colorFoto] = await Promise.all([
      createBrowserSupabase()
        .storage.from("product-images")
        .upload(ruta, archivo, { contentType: archivo.type, cacheControl: "31536000" }),
      conColor ? colorDominante(archivo) : Promise.resolve(null),
    ]);
    setSubiendo(false);
    if (error) return setError(`No se pudo subir la imagen: ${error.message}`);
    registrar(ruta, colorFoto);
  }

  const ocupado = pendiente || subiendo;

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{etiqueta}</p>
      <div className={`relative overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 ${claseVista}`}>
        {url ? (
          <Image src={url} alt="" fill sizes="400px" className={ajuste} />
        ) : (
          <span className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
            Sin imagen
          </span>
        )}
      </div>
      {conColor && url && color && (
        <p className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
          <span className="size-4 rounded-full border border-neutral-300" style={{ backgroundColor: color }} />
          Color para el degradado: {color}
        </p>
      )}
      {ayuda && <p className="mt-1 text-xs text-neutral-500">{ayuda}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <label
          htmlFor={id}
          className={`${clasesBoton("secundario")} cursor-pointer ${ocupado ? "pointer-events-none text-neutral-500" : ""}`}
        >
          {subiendo ? "Subiendo…" : pendiente ? "Guardando…" : url ? "Cambiar" : "Subir imagen"}
        </label>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={ocupado}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (archivo) subir(archivo);
          }}
        />
        {url && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => registrar(null)}
            className={clasesBoton("peligro")}
          >
            Quitar
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
