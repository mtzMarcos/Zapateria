"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { borrarArchivos, rutaValida } from "@/lib/admin/archivos";
import { catalogoActualizado } from "@/lib/admin/revalidar";
import { mensajeError, texto, type EstadoForm } from "@/lib/form";

// Portada del inicio (carrusel) y anuncio de la barra de arriba.

/**
 * Los links tienen que ser de la tienda ("/outlet") o https. No se aceptan
 * "//otro-sitio" (llevaría a otra página) ni "javascript:".
 */
function linkValido(link: string) {
  return /^\/(?!\/)/.test(link) || /^https:\/\/[^\s]+$/.test(link);
}

// ---------------------------------------------------------------------
// Anuncio
// ---------------------------------------------------------------------

export async function guardarAnuncio(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const anuncio = texto(formData, "texto");
  const link = texto(formData, "link");
  if (anuncio.length > 120) return { error: "El anuncio puede tener hasta 120 caracteres." };
  if (link && !linkValido(link)) {
    return { error: 'El link tiene que empezar con "/" (una página de la tienda) o con "https://".' };
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      announcement_text: anuncio,
      announcement_url: link || null,
      announcement_active: formData.get("visible") === "on",
    })
    .eq("id", true);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: "Anuncio guardado." };
}

// ---------------------------------------------------------------------
// Portadas
// ---------------------------------------------------------------------

/** Agrega una portada al final, oculta hasta que el dueño la complete. */
export async function crearPortada(): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { data: ultima } = await supabase
    .from("home_slides")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("home_slides").insert({
    title: "Nueva portada",
    active: false,
    position: (ultima?.position ?? 0) + 1,
  });
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return {};
}

export async function guardarPortada(
  id: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const destino = texto(formData, "destino");
  const link = destino === "otro" ? texto(formData, "linkOtro") : destino;
  const titulo = texto(formData, "titulo");
  const subtitulo = texto(formData, "subtitulo");
  const boton = texto(formData, "boton");

  if (titulo.length > 80 || subtitulo.length > 160 || boton.length > 30) {
    return { error: "El título (80), el subtítulo (160) o el botón (30) son demasiado largos." };
  }
  if (!boton) return { error: 'Escribí el texto del botón (por ejemplo "Comprar ahora").' };
  if (!linkValido(link)) {
    return { error: 'El link tiene que empezar con "/" (una página de la tienda) o con "https://".' };
  }

  const { error } = await supabase
    .from("home_slides")
    .update({
      title: titulo,
      subtitle: subtitulo,
      button_text: boton,
      button_url: link,
      active: formData.get("visible") === "on",
    })
    .eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: "Portada guardada." };
}

/**
 * Guarda (o quita, con null) la foto de compu o de celular y borra el archivo
 * anterior. `color`: color dominante de la franja de abajo de la foto (lo
 * calcula el navegador), para el degradado de la portada con la página.
 */
export async function guardarFotoPortada(
  id: string,
  cual: "compu" | "celular",
  ruta: string | null,
  color?: string | null,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  if (ruta !== null && !rutaValida("portada", ruta)) return { error: "Ruta de foto inválida." };
  const columna = cual === "compu" ? "image_path" : "mobile_image_path";
  const columnaColor = cual === "compu" ? "image_color" : "mobile_image_color";
  const colorValido = ruta !== null && color && /^#[0-9a-f]{6}$/i.test(color) ? color : null;

  const { data: anterior } = await supabase.from("home_slides").select(columna).eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("home_slides")
    .update({ [columna]: ruta, [columnaColor]: colorValido })
    .eq("id", id);
  if (error) {
    await borrarArchivos([ruta]);
    return { error: mensajeError(error) };
  }
  const rutaAnterior = (anterior as Record<string, string | null> | null)?.[columna];
  if (rutaAnterior !== ruta) await borrarArchivos([rutaAnterior]);

  catalogoActualizado();
  return {};
}

/** Mueve una portada un lugar antes (-1) o después (+1). */
export async function moverPortada(id: string, direccion: -1 | 1): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.from("home_slides").select("id").order("position").order("created_at");
  if (error) return { error: mensajeError(error) };

  const ids = data.map((s) => s.id as string);
  const desde = ids.indexOf(id);
  const hasta = desde + direccion;
  if (desde === -1 || hasta < 0 || hasta >= ids.length) return {};
  [ids[desde], ids[hasta]] = [ids[hasta], ids[desde]];

  const resultados = await Promise.all(
    ids.map((slideId, i) => supabase.from("home_slides").update({ position: i + 1 }).eq("id", slideId)),
  );
  const fallo = resultados.find((r) => r.error)?.error;
  if (fallo) return { error: mensajeError(fallo) };

  catalogoActualizado();
  return {};
}

export async function borrarPortada(id: string): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("home_slides")
    .delete()
    .eq("id", id)
    .select("image_path, mobile_image_path")
    .maybeSingle();
  if (error) return { error: mensajeError(error) };
  await borrarArchivos([data?.image_path, data?.mobile_image_path]);

  catalogoActualizado();
  return {};
}
