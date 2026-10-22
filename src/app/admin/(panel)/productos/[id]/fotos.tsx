"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { borrarFoto, moverFoto, registrarFotos } from "../actions";
import type { EstadoForm } from "@/lib/form";

type Foto = { id: string; url: string };

const extensiones: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const tamanioMaximo = 5 * 1024 * 1024; // igual al límite del bucket

export function Fotos({ productId, fotos }: { productId: string; fotos: Foto[] }) {
  const [pendiente, startTransition] = useTransition();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ejecutar(accion: () => Promise<EstadoForm>) {
    setError(null);
    startTransition(async () => {
      const resultado = await accion();
      if (resultado.error) setError(resultado.error);
    });
  }

  async function subir(archivos: File[]) {
    setError(null);

    const invalido = archivos.find((a) => !extensiones[a.type]);
    if (invalido) return setError(`"${invalido.name}" no es JPG, PNG ni WEBP.`);
    const pesado = archivos.find((a) => a.size > tamanioMaximo);
    if (pesado) return setError(`"${pesado.name}" pesa más de 5 MB.`);

    setSubiendo(true);
    const supabase = createBrowserSupabase();
    const rutas: string[] = [];

    for (const archivo of archivos) {
      const ruta = `${productId}/${crypto.randomUUID()}.${extensiones[archivo.type]}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(ruta, archivo, { contentType: archivo.type, cacheControl: "31536000" });
      if (error) {
        setError(`No se pudo subir "${archivo.name}": ${error.message}`);
        break;
      }
      rutas.push(ruta);
    }

    setSubiendo(false);
    if (rutas.length > 0) ejecutar(() => registrarFotos(productId, rutas));
  }

  const ocupado = pendiente || subiendo;

  return (
    <div className="space-y-4">
      {fotos.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
          {fotos.map((foto, i) => (
            <li key={foto.id} className="overflow-hidden rounded-md border border-neutral-200">
              <div className="relative aspect-square bg-neutral-100">
                <Image src={foto.url} alt="" fill sizes="10rem" className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-white">
                    Portada
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-1 text-sm">
                <div>
                  <BotonIcono
                    etiqueta="Mover a la izquierda"
                    disabled={ocupado || i === 0}
                    onClick={() => ejecutar(() => moverFoto(productId, foto.id, -1))}
                  >
                    ←
                  </BotonIcono>
                  <BotonIcono
                    etiqueta="Mover a la derecha"
                    disabled={ocupado || i === fotos.length - 1}
                    onClick={() => ejecutar(() => moverFoto(productId, foto.id, 1))}
                  >
                    →
                  </BotonIcono>
                </div>
                <BotonIcono
                  etiqueta="Borrar foto"
                  disabled={ocupado}
                  peligro
                  onClick={() => ejecutar(() => borrarFoto(productId, foto.id))}
                >
                  Borrar
                </BotonIcono>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label
        className={`flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed border-neutral-300 p-6 text-center text-sm hover:border-neutral-500 ${ocupado ? "pointer-events-none opacity-50" : ""}`}
      >
        <span className="font-medium">
          {subiendo ? "Subiendo fotos…" : pendiente ? "Guardando…" : "Elegir fotos para subir"}
        </span>
        <span className="text-neutral-500">JPG, PNG o WEBP, hasta 5 MB cada una.</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={ocupado}
          className="sr-only"
          onChange={(e) => {
            const archivos = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (archivos.length > 0) subir(archivos);
          }}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function BotonIcono({
  etiqueta,
  peligro,
  children,
  ...props
}: {
  etiqueta: string;
  peligro?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={etiqueta}
      aria-label={etiqueta}
      className={`rounded px-2 py-1 disabled:opacity-30 ${peligro ? "text-red-700 hover:bg-red-50" : "hover:bg-neutral-100"}`}
      {...props}
    >
      {children}
    </button>
  );
}
