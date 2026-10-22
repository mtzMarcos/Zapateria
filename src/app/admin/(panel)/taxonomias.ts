"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { mensajeError, texto, type EstadoForm } from "@/lib/form";
import { catalogoActualizado } from "@/lib/admin/revalidar";
import { slugify } from "@/lib/slug";

// Marcas y categorías funcionan igual: nombre + slug.
const tablas = ["brands", "categories"] as const;
export type Taxonomia = (typeof tablas)[number];

function validarTabla(tabla: Taxonomia) {
  if (!tablas.includes(tabla)) throw new Error("Tabla inválida");
}

export async function crearTaxonomia(
  tabla: Taxonomia,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  validarTabla(tabla);
  const { supabase } = await requireAdmin();

  const nombre = texto(formData, "nombre");
  if (!nombre) return { error: "Escribí un nombre." };

  const { error } = await supabase.from(tabla).insert({ name: nombre, slug: slugify(nombre) });
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: `"${nombre}" agregado.` };
}

export async function renombrarTaxonomia(
  tabla: Taxonomia,
  id: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  validarTabla(tabla);
  const { supabase } = await requireAdmin();

  const nombre = texto(formData, "nombre");
  if (!nombre) return { error: "El nombre no puede quedar vacío." };

  const { error } = await supabase
    .from(tabla)
    .update({ name: nombre, slug: slugify(nombre) })
    .eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: "Guardado." };
}

export async function borrarTaxonomia(
  tabla: Taxonomia,
  id: string,
): Promise<EstadoForm> {
  validarTabla(tabla);
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return {};
}
