import { tienda } from "@/config/tienda";
import { Dato } from "./dato";
import { TransicionPagina } from "./transicion-pagina";

/** "por email a … o por WhatsApp al …", para usar dentro de un párrafo. */
export function MediosDeContacto() {
  return (
    <>
      por email a <Dato valor={tienda.contacto.email} /> o por WhatsApp al{" "}
      <Dato valor={tienda.contacto.whatsapp} />
    </>
  );
}

/** Estructura y estilos de las páginas legales (términos, cambios, privacidad, arrepentimiento). */
export function PaginaLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <TransicionPagina>
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
        <p className="mt-2 text-sm text-neutral-500">Última actualización: {tienda.legalesActualizados}</p>
        <div className="mt-6 text-neutral-700 [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_li]:mt-1 [&_p]:mt-3 [&_strong]:text-neutral-900 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </main>
    </TransicionPagina>
  );
}
