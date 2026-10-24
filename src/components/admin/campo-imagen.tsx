"use client";

import Image from "next/image";
import { useId, useState, useTransition } from "react";
import type { EstadoForm } from "@/lib/form";
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
 */
export function CampoImagen({
  carpeta,
  url,
  etiqueta,
  ayuda,
  guardar,
  claseVista = "aspect-video w-full",
  ajuste = "object-cover",
}: {
  carpeta: "marcas" | "portada";
  url: string | null;
  etiqueta: string;
  ayuda?: string;
  guardar: (ruta: string | null) => Promise<EstadoForm>;
  claseVista?: string;
  ajuste?: "object-cover" | "object-contain";
}) {
  const [pendiente, startTransition] = useTransition();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  function registrar(ruta: string | null) {
    startTransition(async () => {
      const resultado = await guardar(ruta);
      if (resultado.error) setError(resultado.error);
    });
  }

  async function subir(archivo: File) {
    setError(null);
    if (!extensiones[archivo.type]) return setError("La imagen tiene que ser JPG, PNG o WEBP.");
    if (archivo.size > tamanioMaximo) return setError("La imagen pesa más de 5 MB.");

    setSubiendo(true);
    const ruta = `${carpeta}/${crypto.randomUUID()}.${extensiones[archivo.type]}`;
    const { error } = await createBrowserSupabase()
      .storage.from("product-images")
      .upload(ruta, archivo, { contentType: archivo.type, cacheControl: "31536000" });
    setSubiendo(false);
    if (error) return setError(`No se pudo subir la imagen: ${error.message}`);
    registrar(ruta);
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
