import Link from "next/link";
import { cantidadTotal, leerCarrito } from "@/lib/carrito";
import { IconoBolsa } from "./iconos";

const clases =
  "relative -mr-2 flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-neutral-100";

// Lee la cookie del carrito: va dentro de un <Suspense> con CarritoLinkVacio
// de respaldo, así el resto del encabezado sigue siendo estático.
//
// En el celular solo se ve el ícono: "Carrito" queda para lectores de pantalla.
// El nombre accesible empieza con el texto visible ("Carrito 1 producto").
export async function CarritoLink() {
  const cantidad = cantidadTotal(await leerCarrito());

  return (
    <Link href="/carrito" className={clases}>
      <IconoBolsa className="size-6" />
      <span className="sr-only md:not-sr-only">Carrito</span>
      {cantidad > 0 && (
        <span className="absolute top-0.5 left-6 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-xs text-white md:static">
          {cantidad}
          <span className="sr-only">{cantidad === 1 ? " producto" : " productos"}</span>
        </span>
      )}
    </Link>
  );
}

export function CarritoLinkVacio() {
  return (
    <Link href="/carrito" className={clases}>
      <IconoBolsa className="size-6" />
      <span className="sr-only md:not-sr-only">Carrito</span>
    </Link>
  );
}
