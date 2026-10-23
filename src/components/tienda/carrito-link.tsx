import Link from "next/link";
import { cantidadTotal, leerCarrito } from "@/lib/carrito";
import { ContadorCarrito } from "./contador-carrito";
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
      <ContadorCarrito cantidad={cantidad} />
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
