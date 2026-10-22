"use client";

import { useFormStatus } from "react-dom";
import type { EstadoForm } from "@/lib/form";
import { clasesBoton, type VarianteBoton } from "./estilos";

/** Botón de envío que se deshabilita mientras la acción está en curso. */
export function BotonEnviar({
  children,
  variante = "primario",
  textoEnviando = "Guardando…",
}: {
  children: React.ReactNode;
  variante?: VarianteBoton;
  textoEnviando?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={clasesBoton(variante)}>
      {pending ? textoEnviando : children}
    </button>
  );
}

export function Mensaje({ estado }: { estado: EstadoForm }) {
  if (estado.error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {estado.error}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p role="status" className="text-sm text-green-700">
        {estado.ok}
      </p>
    );
  }
  return null;
}
