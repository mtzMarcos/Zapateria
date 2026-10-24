"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";
import { catalogoActualizado } from "@/lib/admin/revalidar";
import { mensajeError, texto, type EstadoForm } from "@/lib/form";
import { slugify } from "@/lib/slug";

// Categorías y subcategorías (un solo nivel: Zapatillas → Running). La base
// también lo controla (migración 20261028000000_navegacion.sql); acá se
// valida antes para dar un mensaje claro.

/** Mensaje de error si `madre` no puede contener a la categoría `id` (null al crear). */
async function problemaConMadre(supabase: SupabaseClient, id: string | null, madre: string | null) {
  if (!madre) return null;
  if (madre === id) return "Una categoría no puede ir dentro de sí misma.";

  const { data } = await supabase.from("categories").select("parent_id").eq("id", madre).maybeSingle();
  if (!data) return "La categoría elegida ya no existe. Recargá la página.";
  if (data.parent_id) return "Una subcategoría no puede tener subcategorías.";

  if (id) {
    const { count } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id);
    if (count) return "Esta categoría tiene subcategorías: no puede ir dentro de otra.";
  }
  return null;
}

/** Categorías con la misma madre (o las principales, con null), en orden. */
function hermanas(supabase: SupabaseClient, madre: string | null) {
  const consulta = supabase.from("categories").select("id, position");
  return (madre ? consulta.eq("parent_id", madre) : consulta.is("parent_id", null))
    .order("position")
    .order("name");
}

/** Posición para agregar una categoría al final de sus hermanas. */
async function posicionAlFinal(supabase: SupabaseClient, madre: string | null) {
  const { data } = await hermanas(supabase, madre);
  return Math.max(0, ...(data ?? []).map((c) => c.position as number)) + 1;
}

export async function crearCategoria(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const nombre = texto(formData, "nombre");
  const madre = texto(formData, "madre") || null;
  if (!nombre) return { error: "Escribí un nombre." };
  const problema = await problemaConMadre(supabase, null, madre);
  if (problema) return { error: problema };

  const { error } = await supabase.from("categories").insert({
    name: nombre,
    slug: slugify(nombre),
    parent_id: madre,
    position: await posicionAlFinal(supabase, madre),
  });
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: `"${nombre}" agregada.` };
}

/** Cambia el nombre y la categoría madre. Si cambia de madre, queda última entre sus nuevas hermanas. */
export async function guardarCategoria(id: string, _estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const nombre = texto(formData, "nombre");
  const madre = texto(formData, "madre") || null;
  if (!nombre) return { error: "El nombre no puede quedar vacío." };
  const problema = await problemaConMadre(supabase, id, madre);
  if (problema) return { error: problema };

  const { data: actual } = await supabase.from("categories").select("parent_id").eq("id", id).maybeSingle();
  const cambiaDeMadre = (actual?.parent_id ?? null) !== madre;

  const { error } = await supabase
    .from("categories")
    .update({
      name: nombre,
      slug: slugify(nombre),
      parent_id: madre,
      ...(cambiaDeMadre ? { position: await posicionAlFinal(supabase, madre) } : {}),
    })
    .eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: "Guardado." };
}

/** Mueve una categoría un lugar antes (-1) o después (+1) entre sus hermanas. */
export async function moverCategoria(id: string, direccion: -1 | 1): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { data: categoria } = await supabase.from("categories").select("parent_id").eq("id", id).maybeSingle();
  if (!categoria) return {};
  const { data, error } = await hermanas(supabase, categoria.parent_id);
  if (error) return { error: mensajeError(error) };

  const ids = data.map((c) => c.id as string);
  const desde = ids.indexOf(id);
  const hasta = desde + direccion;
  if (desde === -1 || hasta < 0 || hasta >= ids.length) return {};
  [ids[desde], ids[hasta]] = [ids[hasta], ids[desde]];

  const resultados = await Promise.all(
    ids.map((idCategoria, i) => supabase.from("categories").update({ position: i + 1 }).eq("id", idCategoria)),
  );
  const fallo = resultados.find((r) => r.error)?.error;
  if (fallo) return { error: mensajeError(fallo) };

  catalogoActualizado();
  return {};
}

export async function borrarCategoria(id: string): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (count) return { error: "Tiene subcategorías: borralas o pasalas a otra categoría primero." };

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return {};
}
