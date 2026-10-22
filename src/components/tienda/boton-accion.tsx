"use client";

import { useFormStatus } from "react-dom";

/** Botón de un formulario con Server Action: se deshabilita mientras la acción corre. */
export function BotonAccion({
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
