import Link from "next/link";
import { tienda } from "@/config/tienda";
import { obtenerCatalogo } from "@/lib/catalogo";
import { opcionesDeFiltro } from "@/lib/filtros";

export default function TiendaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4">
          <Link href="/" className="text-xl font-bold">
            {tienda.nombre}
          </Link>
          <Navegacion />
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mt-16 border-t border-neutral-200">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-neutral-500">
          <p className="font-medium text-neutral-900">{tienda.nombre}</p>
          <p className="mt-1">{tienda.descripcion}</p>
        </div>
      </footer>
    </>
  );
}

// Los datos vienen de la caché del catálogo, así que el menú forma parte
// de la página estática y aparece al instante.
async function Navegacion() {
  const { categorias } = opcionesDeFiltro(await obtenerCatalogo());

  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      <Link href="/productos" className="text-neutral-600 hover:text-neutral-900">
        Todos los productos
      </Link>
      {categorias.slice(0, 6).map((c) => (
        <Link
          key={c.slug}
          href={`/productos?categoria=${c.slug}`}
          className="text-neutral-600 hover:text-neutral-900"
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
