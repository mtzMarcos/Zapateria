import Link from "next/link";
import { datosFaltantes, tienda } from "@/config/tienda";
import { cerrarSesion } from "../login/actions";

const secciones = [
  { href: "/admin/pedidos", nombre: "Pedidos" },
  { href: "/admin/productos", nombre: "Productos" },
  { href: "/admin/portada", nombre: "Portada" },
  { href: "/admin/marcas", nombre: "Marcas" },
  { href: "/admin/categorias", nombre: "Categorías" },
  { href: "/admin/envios", nombre: "Envíos" },
] as const;

// El layout no lee la sesión: así se muestra al instante. Cada página
// verifica que el usuario sea admin (con requireAdmin) detrás del loading.
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  const faltantes = datosFaltantes();

  return (
    <>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin/pedidos" className="font-bold">
            {tienda.nombre} · Panel
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {secciones.map((s) => (
              <Link key={s.href} href={s.href} className="text-neutral-600 hover:text-neutral-900">
                {s.nombre}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              Ver tienda
            </Link>
            <form action={cerrarSesion}>
              <button type="submit" className="text-neutral-600 hover:text-neutral-900">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {faltantes.length > 0 && (
          <details className="mb-6 rounded-lg border border-dashed border-red-300 bg-red-50 p-4 text-sm text-red-700">
            <summary className="cursor-pointer font-medium">
              Faltan {faltantes.length} datos de la tienda antes de lanzar
            </summary>
            <p className="mt-2">
              Se ven en la tienda como “[Completar: …]”. Se cargan en <code>src/config/tienda.ts</code>:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {faltantes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </details>
        )}
        {children}
      </main>
    </>
  );
}
