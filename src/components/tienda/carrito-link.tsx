import Link from "next/link";
import { cantidadTotal, leerCarrito } from "@/lib/carrito";

const clases =
  "flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:border-neutral-900";

// Lee la cookie del carrito: va dentro de un <Suspense> con CarritoLinkVacio
// de respaldo, así el resto del encabezado sigue siendo estático.
export async function CarritoLink() {
  const cantidad = cantidadTotal(await leerCarrito());

  return (
    <Link href="/carrito" className={clases}>
      Carrito
      {cantidad > 0 && (
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">
          {cantidad}
        </span>
      )}
    </Link>
  );
}

export function CarritoLinkVacio() {
  return (
    <Link href="/carrito" className={clases}>
      Carrito
    </Link>
  );
}
