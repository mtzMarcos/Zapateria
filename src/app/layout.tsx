import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { tienda } from "@/config/tienda";
import { urlSitio } from "@/lib/sitio";
import "./globals.css";

// Tipografía de la tienda y el panel. next/font la descarga al compilar y la
// sirve desde la tienda (sin pedidos a Google), solo con los caracteres latinos;
// mientras carga se ve una fuente del sistema de medidas parecidas (sin saltos).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Base de las URLs absolutas (imágenes para compartir, canonical).
  metadataBase: new URL(urlSitio()),
  title: { default: tienda.nombre, template: `%s · ${tienda.nombre}` },
  description: tienda.descripcion,
  openGraph: {
    siteName: tienda.nombre,
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior: el desplazamiento suave es solo para los links dentro
    // de la misma página; al cambiar de página Next salta arriba sin animación.
    <html lang="es-AR" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
