import { ImageResponse } from "next/og";
import { tienda } from "@/config/tienda";

// Imagen que aparece al compartir un link de la tienda (WhatsApp, redes).
// Las páginas de producto usan la foto del producto en su lugar.
// Cuando el cliente pase su logo, se puede reemplazar por un archivo
// opengraph-image.png de 1200×630 en esta misma carpeta.

export const alt = tienda.nombre;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#171717",
          color: "white",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700 }}>{tienda.nombre}</div>
        <div style={{ marginTop: 24, fontSize: 44, color: "#d4d4d4" }}>{tienda.descripcion}</div>
      </div>
    ),
    size,
  );
}
