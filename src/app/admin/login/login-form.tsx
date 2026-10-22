"use client";

import { useActionState } from "react";
import { estadoInicial } from "@/lib/form";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { claseInput, claseLabel } from "@/components/admin/estilos";
import { iniciarSesion } from "./actions";

export function LoginForm() {
  const [estado, accion] = useActionState(iniciarSesion, estadoInicial);

  return (
    <form action={accion} className="space-y-4">
      <div>
        <label htmlFor="email" className={claseLabel}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={claseInput} />
      </div>
      <div>
        <label htmlFor="password" className={claseLabel}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={claseInput}
        />
      </div>
      <Mensaje estado={estado} />
      <BotonEnviar textoEnviando="Ingresando…">Ingresar</BotonEnviar>
    </form>
  );
}
