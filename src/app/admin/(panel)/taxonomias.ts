"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { mensajeError, texto, type EstadoForm } from "@/lib/form";
import { catalogoActualizado } from "@/lib/admin/revalidar";
import { slugify } from "@/lib/slug";
import { borrarArchivos, rutaValida } from "@/lib/admin/archivos";

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

  // Las marcas pueden tener logo: se borra el archivo junto con la marca.
  const logo =
    tabla === "brands"
      ? (await supabase.from("brands").select("logo_path").eq("id", id).maybeSingle()).data?.logo_path
      : null;

  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) return { error: mensajeError(error) };
  await borrarArchivos([logo]);

  catalogoActualizado();
  return {};
}

/** Guarda (o quita, con null) el logo de una marca y borra el archivo anterior. */
export async function guardarLogoMarca(id: string, ruta: string | null): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  if (ruta !== null && !rutaValida("marcas", ruta)) return { error: "Ruta de logo inválida." };

  const { data: anterior } = await supabase.from("brands").select("logo_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("brands").update({ logo_path: ruta }).eq("id", id);
  if (error) {
    await borrarArchivos([ruta]);
    return { error: mensajeError(error) };
  }
  if (anterior?.logo_path !== ruta) await borrarArchivos([anterior?.logo_path]);

  catalogoActualizado();
  return {};
}
