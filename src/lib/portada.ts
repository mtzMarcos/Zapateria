import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { urlFoto } from "@/lib/supabase/env";
import type { Destacada } from "@/lib/secciones";

// Portada del inicio (carrusel y tarjetas) y anuncio de la barra de arriba. Se editan en
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

export type Tarjeta = {
  seccion: Destacada;
  titulo: string;
  subtitulo: string;
  foto: string | null;
};

/** Tarjetas del inicio (Tendencias, Deportes y Outlet) visibles, en orden. */
export async function obtenerTarjetas(): Promise<Tarjeta[]> {
  "use cache";
  cacheTag("catalogo");
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("home_cards")
    .select("section, title, subtitle, image_path")
    .eq("active", true)
    .order("position");
  if (error) throw new Error(`No se pudieron cargar las tarjetas del inicio: ${error.message}`);

  return data.map((t) => ({
    seccion: t.section as Destacada,
    titulo: t.title,
    subtitulo: t.subtitle,
    foto: t.image_path ? urlFoto(t.image_path) : null,
  }));
}
