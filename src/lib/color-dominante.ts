/**
 * Color dominante de la franja de abajo de una foto (el tercio inferior), en
 * formato #rrggbb. Se calcula en el navegador al subir una foto de portada:
 * es el color con el que la portada se funde con el resto de la página.
 *
 * Achica la foto a 64 px de ancho, agrupa los colores parecidos (16 niveles
 * por canal) y devuelve el promedio del grupo más grande. Devuelve null si el
 * navegador no puede leer la imagen.
 */
export async function colorDominante(archivo: Blob): Promise<string | null> {
  try {
    const imagen = await createImageBitmap(archivo);
    const ancho = 64;
    const alto = Math.max(3, Math.round((imagen.height * ancho) / imagen.width));
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(imagen, 0, 0, ancho, alto);
    imagen.close();

    const desde = Math.floor(alto * (2 / 3));
    const { data } = ctx.getImageData(0, desde, ancho, alto - desde);
    const grupos = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // transparente
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const clave = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const grupo = grupos.get(clave) ?? { n: 0, r: 0, g: 0, b: 0 };
      grupo.n++;
      grupo.r += r;
      grupo.g += g;
      grupo.b += b;
      grupos.set(clave, grupo);
    }

    let mayor: { n: number; r: number; g: number; b: number } | undefined;
    for (const grupo of grupos.values()) if (!mayor || grupo.n > mayor.n) mayor = grupo;
    if (!mayor) return null;
    const hex = (v: number) => Math.round(v / mayor.n).toString(16).padStart(2, "0");
    return `#${hex(mayor.r)}${hex(mayor.g)}${hex(mayor.b)}`;
  } catch {
    return null;
  }
}
