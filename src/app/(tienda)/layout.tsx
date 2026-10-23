import Link from "next/link";
import { Suspense } from "react";
import { faltaCompletar, tienda } from "@/config/tienda";
import { CarritoLink, CarritoLinkVacio } from "@/components/tienda/carrito-link";
import { Dato } from "@/components/tienda/dato";
import { MenuMovil } from "@/components/tienda/menu-movil";
import { obtenerCatalogo } from "@/lib/catalogo";
import { opcionesDeFiltro } from "@/lib/filtros";

export default function TiendaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Fijo arriba al bajar. En el celular: menú, nombre y carrito en una línea. */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 md:h-16 md:gap-8">
          <MenuCelular />
          <Link href="/" className="text-lg font-bold md:text-xl">
            {tienda.nombre}
          </Link>
          <Navegacion />
          <div className="ml-auto">
            <Suspense fallback={<CarritoLinkVacio />}>
              <CarritoLink />
            </Suspense>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <Pie />
    </>
  );
}

const legales = [
  { href: "/terminos", nombre: "Términos y condiciones" },
  { href: "/cambios-y-devoluciones", nombre: "Cambios y devoluciones" },
  { href: "/privacidad", nombre: "Privacidad" },
] as const;

function Pie() {
  const { contacto, legal, retiro } = tienda;
  // Número para wa.me: 54 9 + código de área y número (sin el 0 ni el 15).
  const digitos = contacto.whatsapp.replace(/\D/g, "");
  const whatsapp = digitos.startsWith("54") ? digitos : `549${digitos.replace(/^0/, "")}`;

  return (
    <footer className="mt-16 border-t border-neutral-200">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 text-sm text-neutral-600 sm:grid-cols-3">
        <div>
          <p className="font-medium text-neutral-900">{tienda.nombre}</p>
          <p className="mt-1">{tienda.descripcion}</p>
          <p className="mt-3">
            Local: <Dato valor={retiro.direccion} />
            <br />
            <Dato valor={retiro.horarios} />
          </p>
        </div>

        <div>
          <p className="font-medium text-neutral-900">Contacto</p>
          <ul className="mt-1 space-y-1">
            <li>
              {faltaCompletar(contacto.email) ? (
                <Dato valor={contacto.email} />
              ) : (
                <a href={`mailto:${contacto.email}`} className="hover:text-neutral-900">
                  {contacto.email}
                </a>
              )}
            </li>
            <li>
              {faltaCompletar(contacto.whatsapp) ? (
                <Dato valor={contacto.whatsapp} />
              ) : (
                <a href={`https://wa.me/${whatsapp}`} className="hover:text-neutral-900">
                  WhatsApp {contacto.whatsapp}
                </a>
              )}
            </li>
            {contacto.instagram && (
              <li>
                {faltaCompletar(contacto.instagram) ? (
                  <Dato valor={contacto.instagram} />
                ) : (
                  <a href={`https://instagram.com/${contacto.instagram}`} className="hover:text-neutral-900">
                    Instagram @{contacto.instagram}
                  </a>
                )}
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="font-medium text-neutral-900">Información legal</p>
          <ul className="mt-1 space-y-1">
            {legales.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-neutral-900">
                  {l.nombre}
                </Link>
              </li>
            ))}
            <li>
              {/* Botón de arrepentimiento: obligatorio y de fácil acceso (Res. SCI 424/2020). */}
              <Link
                href="/arrepentimiento"
                className="mt-1 inline-block rounded-md border border-neutral-900 px-3 py-1 font-medium text-neutral-900 hover:bg-neutral-100"
              >
                Botón de arrepentimiento
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-200">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-neutral-500">
          <p>
            <Dato valor={legal.titular} /> · CUIT <Dato valor={legal.cuit} />
          </p>
          <div className="flex items-center gap-4">
            {/* Link a la Ventanilla Única Federal de reclamos (Res. SCI 274/2021). */}
            <a
              href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-neutral-900"
            >
              Defensa de las y los Consumidores. Para reclamos ingrese aquí
            </a>
            {faltaCompletar(legal.dataFiscalUrl) ? (
              <Dato valor={legal.dataFiscalUrl} />
            ) : (
              // Código estándar de ARCA para el QR de Data fiscal (formulario 960).
              <a href={legal.dataFiscalUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg"
                  alt="Data fiscal"
                  width={40}
                  height={54}
                />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Los datos vienen de la caché del catálogo, así que el menú forma parte
// de la página estática y aparece al instante.
async function enlacesCategorias() {
  const { categorias } = opcionesDeFiltro(await obtenerCatalogo());
  return [
    { href: "/productos", nombre: "Todos los productos" },
    ...categorias.map((c) => ({ href: `/productos?categoria=${c.slug}`, nombre: c.name })),
  ];
}

/** Links del encabezado en la compu (en el celular van en MenuCelular). */
async function Navegacion() {
  const enlaces = (await enlacesCategorias()).slice(0, 7);

  return (
    <nav className="hidden gap-x-5 text-sm md:flex">
      {enlaces.map((e) => (
        <Link key={e.href} href={e.href} className="text-neutral-600 hover:text-neutral-900">
          {e.nombre}
        </Link>
      ))}
    </nav>
  );
}

async function MenuCelular() {
  return (
    <MenuMovil
      enlaces={await enlacesCategorias()}
      secundarios={[...legales, { href: "/arrepentimiento", nombre: "Botón de arrepentimiento" }]}
    />
  );
}
