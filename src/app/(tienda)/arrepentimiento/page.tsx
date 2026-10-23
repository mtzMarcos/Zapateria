import type { Metadata } from "next";
import Link from "next/link";
import { MediosDeContacto, PaginaLegal } from "@/components/tienda/pagina-legal";
import { FormularioArrepentimiento } from "./formulario";

// Botón de arrepentimiento (Resolución SCI 424/2020): permite revocar una compra
// online sin registrarse, y hay que darle al comprador un código de solicitud.
// El link está en el pie de todas las páginas de la tienda.

export const metadata: Metadata = {
  title: "Botón de arrepentimiento",
  description: "Revocá tu compra dentro de los 10 días corridos desde que recibiste el producto.",
};

export default function ArrepentimientoPage() {
  return (
    <PaginaLegal titulo="Botón de arrepentimiento">
      <p>
        Tenés <strong>10 días corridos</strong> desde que recibiste el producto (o desde la compra, si es
        posterior) para revocar la compra, sin dar explicaciones y sin costo (artículo 34 de la Ley 24.240 y
        artículo 1110 del Código Civil y Comercial).
      </p>
      <ul>
        <li>El producto tiene que estar sin uso y en las mismas condiciones en que lo recibiste.</li>
        <li>Los gastos de devolución corren por nuestra cuenta.</li>
        <li>Te reintegramos el total pagado por el mismo medio de pago, a través de Mercado Pago.</li>
      </ul>
      <p>
        Si lo que querés es cambiar el talle o el modelo, mirá la{" "}
        <Link href="/cambios-y-devoluciones">política de cambios</Link>.
      </p>

      <div className="mt-8">
        <FormularioArrepentimiento />
      </div>

      <p className="text-sm">
        ¿Problemas con el formulario? Escribinos <MediosDeContacto /> con tu número de pedido.
      </p>
    </PaginaLegal>
  );
}
