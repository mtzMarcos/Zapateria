import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { urlFoto } from "@/lib/supabase/env";

// Portada del inicio (carrusel) y anuncio de la barra de arriba. Se editan en
// el panel → Portada, que invalida la etiqueta "catalogo" al guardar.

export type Portada = {
  id: string;
  titulo: string;
  subtitulo: string;
  boton: string;
  link: string;
  foto: string | null;
  fotoCelular: string | null;
};

export type Anuncio = { texto: string; link: string | null };

export async function obtenerPortadas(): Promise<Portada[]> {
  "use cache";
  cacheTag("catalogo");
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("home_slides")
    .select("id, title, subtitle, button_text, button_url, image_path, mobile_image_path")
    .eq("active", true)
    .order("position")
    .order("created_at");
  if (error) throw new Error(`No se pudo cargar la portada: ${error.message}`);

  return data.map((s) => ({
    id: s.id,
    titulo: s.title,
    subtitulo: s.subtitle,
    boton: s.button_text,
    link: s.button_url,
    foto: s.image_path ? urlFoto(s.image_path) : null,
    fotoCelular: s.mobile_image_path ? urlFoto(s.mobile_image_path) : null,
  }));
}

/** El anuncio de la barra fina, o null si está apagado o vacío. */
export async function obtenerAnuncio(): Promise<Anuncio | null> {
  "use cache";
  cacheTag("catalogo");
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("announcement_text, announcement_url, announcement_active")
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el anuncio: ${error.message}`);
  if (!data?.announcement_active || !data.announcement_text.trim()) return null;
  return { texto: data.announcement_text, link: data.announcement_url };
}
