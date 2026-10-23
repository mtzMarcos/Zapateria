import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { tienda } from "@/config/tienda";
import { urlSitio } from "@/lib/sitio";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
