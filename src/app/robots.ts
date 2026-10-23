import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/sitio";

// Los buscadores indexan la tienda, no el panel ni las páginas de cada compra.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/carrito", "/checkout", "/pedido/"],
    },
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
