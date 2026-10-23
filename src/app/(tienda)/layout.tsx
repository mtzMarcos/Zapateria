import Link from "next/link";
import { Suspense } from "react";
import { faltaCompletar, tienda } from "@/config/tienda";
import { CarritoLink, CarritoLinkVacio } from "@/components/tienda/carrito-link";
import { Dato } from "@/components/tienda/dato";
import { IconoChevron } from "@/components/tienda/iconos";
import { MenuMovil } from "@/components/tienda/menu-movil";
import { BuscadorCelular, BuscadorCompu } from "@/components/tienda/buscador";
import { obtenerAnuncio } from "@/lib/portada";
import { secciones } from "@/lib/secciones";
import { obtenerCatalogo } from "@/lib/catalogo";
import { opcionesDeFiltro } from "@/lib/filtros";

export default function TiendaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <BarraAnuncio />
      {/* Fijo arriba al bajar. En el celular: menú, nombre, lupa y carrito en una línea. */}
      {/* viewTransitionName: el encabezado queda quieto en las transiciones entre páginas. */}
      <header
        className="sticky top-0 z-30 border-b border-neutral-200 bg-white"
        style={{ viewTransitionName: "encabezado" }}
      >
        <div className="relative mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 md:h-16 md:gap-6">
          <MenuCelular />
          <Link href="/" className="text-lg font-bold md:text-xl">
            {tienda.nombre}
          </Link>
          <Navegacion />
          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-4">
            <BuscadorCompu />
            <BuscadorCelular />
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
  const digitos = contacto.whatsapp.replace(/D/g, "");
  const whatsapp = digitos.startsWith("54") ? digitos : `549${digitos.replace(/^0/, "")}`;
  const link = "hover:text-neutral-900 hover:underline underline-offset-4";

  return (
    <footer className="mt-20 border-t border-neutral-200 bg-neutral-50 text-sm text-neutral-600">
      <div className="mx-auto grid w-full max-w-7xl gap-x-8 px-4 pt-10 pb-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:pb-10">
        <div className="pb-6 md:pb-0">
          <p className="text-lg font-bold text-neutral-900">{tienda.nombre}</p>
          <p className="mt-2 max-w-xs">{tienda.descripcion}</p>
          {/* Botón de arrepentimiento: obligatorio y de fácil acceso (Res. SCI 424/2020).
              Fuera de las secciones plegables: siempre a la vista. */}
          <Link
            href="/arrepentimiento"
            className="mt-5 inline-flex rounded-md border border-neutral-900 px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white"
          >
            Botón de arrepentimiento
          </Link>
        </div>

        <ColumnaPie titulo="Comprar">
          <ul className="space-y-2">
            {[...enlacesSecciones, { href: "/productos", nombre: "Todos los productos" }].map((e) => (
              <li key={e.href}>
                <Link href={e.href} className={link}>
                  {e.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </ColumnaPie>

        <ColumnaPie titulo="Ayuda">
          <ul className="space-y-2">
            {legales.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>
                  {l.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </ColumnaPie>

        <ColumnaPie titulo="Contacto">
          <ul className="space-y-2">
            <li>
              {faltaCompletar(contacto.email) ? (
                <Dato valor={contacto.email} />
              ) : (
                <a href={`mailto:${contacto.email}`} className={link}>
                  {contacto.email}
                </a>
              )}
            </li>
            <li>
              {faltaCompletar(contacto.whatsapp) ? (
                <Dato valor={contacto.whatsapp} />
              ) : (
                <a href={`https://wa.me/${whatsapp}`} className={link}>
                  WhatsApp {contacto.whatsapp}
                </a>
              )}
            </li>
            {contacto.instagram && (
              <li>
                {faltaCompletar(contacto.instagram) ? (
                  <Dato valor={contacto.instagram} />
                ) : (
                  <a href={`https://instagram.com/${contacto.instagram}`} className={link}>
                    Instagram @{contacto.instagram}
                  </a>
                )}
              </li>
            )}
            <li className="pt-2">
              <span className="block font-medium text-neutral-900">Local</span>
              <Dato valor={retiro.direccion} />
              <br />
              <Dato valor={retiro.horarios} />
            </li>
          </ul>
        </ColumnaPie>
      </div>

      <div className="border-t border-neutral-200">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-neutral-500">
          <p>
            © {tienda.nombre} · <Dato valor={legal.titular} /> · CUIT <Dato valor={legal.cuit} />
          </p>
          <div className="flex items-center gap-4">
            {/* Link a la Ventanilla Única Federal de reclamos (Res. SCI 274/2021). */}
            <a
              href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900"
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

/**
 * Columna del pie: en la compu, título y contenido a la vista; en el celular,
 * una sección plegable (se toca el título para abrirla).
 */
function ColumnaPie({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <>
      <details className="group border-t border-neutral-200 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-medium text-neutral-900 [&::-webkit-details-marker]:hidden">
          {titulo}
          <IconoChevron className="size-5 text-neutral-500 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="pb-5">{children}</div>
      </details>
      <div className="hidden md:block">
        <p className="mb-4 font-medium text-neutral-900">{titulo}</p>
        {children}
      </div>
    </>
  );
}

// Secciones del menú principal: Mujer, Hombre, Niños, Tendencias, Deportes y Outlet.
const enlacesSecciones = secciones.map((s) => ({ href: `/${s.slug}`, nombre: s.nombre }));

/** Menú principal en la compu (en el celular va en el ☰). */
function Navegacion() {
  return (
    <nav aria-label="Secciones" className="hidden flex-1 justify-center gap-x-6 text-sm font-medium lg:gap-x-8 md:flex">
      {enlacesSecciones.map((e) => (
        <Link key={e.href} href={e.href} className="py-2 hover:underline hover:underline-offset-8">
          {e.nombre}
        </Link>
      ))}
    </nav>
  );
}

// Las categorías vienen de la caché del catálogo: el menú forma parte de la
// página estática y aparece al instante.
async function MenuCelular() {
  const { categorias } = opcionesDeFiltro(await obtenerCatalogo());
  return (
    <MenuMovil
      enlaces={[...enlacesSecciones, { href: "/productos", nombre: "Todos los productos" }]}
      secundarios={[
        ...categorias.map((c) => ({ href: `/productos?categoria=${c.slug}`, nombre: c.name })),
        ...legales,
        { href: "/arrepentimiento", nombre: "Botón de arrepentimiento" },
      ]}
    />
  );
}

/** Barra fina con el anuncio que se edita en el panel → Portada. */
async function BarraAnuncio() {
  const anuncio = await obtenerAnuncio();
  if (!anuncio) return null;
  const clases = "block px-4 py-2 text-center text-xs font-medium tracking-wide sm:text-sm";
  return (
    <div className="bg-neutral-900 text-white">
      {anuncio.link ? (
        <Link href={anuncio.link} className={`${clases} hover:underline`}>
          {anuncio.texto}
        </Link>
      ) : (
        <p className={clases}>{anuncio.texto}</p>
      )}
    </div>
  );
}
